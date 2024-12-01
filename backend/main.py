from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from models import load_model
from database import init_db, add_to_queue, update_status, get_status, get_all_statuses, remove_from_queue
import uvicorn
import asyncio
import numpy as np
from datetime import datetime
from pathlib import Path
import uuid
import aiofiles
import os

app = FastAPI()
model = load_model()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = Path("uploads")
TRANSCRIPT_FOLDER = Path("transcripts")
UPLOAD_FOLDER.mkdir(exist_ok=True)
TRANSCRIPT_FOLDER.mkdir(exist_ok=True)

init_db()  # Initialize the database

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            audio_data = await websocket.receive_bytes()
            transcription = await asyncio.to_thread(transcribe_audio, audio_data)
            if transcription.strip():
                response = {
                    "text": transcription,
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send_json(response)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"Error: {e}")

def transcribe_audio(audio_data: bytes) -> str:
    try:
        audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
        segments, _ = model.transcribe(audio_array)
        transcription = " ".join(segment.text.strip() for segment in segments if segment.text.strip())
        return transcription
    except Exception:
        return ""

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/aac"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
    file_id = uuid.uuid4().hex
    filename = f"{file_id}_{file.filename}"
    filepath = UPLOAD_FOLDER / filename

    async with aiofiles.open(filepath, 'wb') as out_file:
        while content := await file.read(1024):  # Show upload progress
            await out_file.write(content)

    add_to_queue(file_id, filename)
    # Start transcription in background
    asyncio.create_task(transcribe_file(filepath, file_id))
    return {"file_id": file_id}

async def transcribe_file(filepath: Path, file_id: str):
    try:
        update_status(file_id, "Transcribing")
        segments, _ = await asyncio.to_thread(model.transcribe, str(filepath))
        transcript_text = "\n".join(
            f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text.strip()}"
            for segment in segments
        )
        transcript_path = TRANSCRIPT_FOLDER / f"{filepath.stem}.txt"
        async with aiofiles.open(transcript_path, 'w', encoding='utf-8') as f:
            await f.write(transcript_text)
        update_status(file_id, "Completed")
        filepath.unlink()
    except Exception as e:
        update_status(file_id, f"Error: {str(e)}")
        print(f"Error transcribing file {filepath}: {e}")

@app.get("/transcription-status")
async def get_transcription_status():
    statuses = get_all_statuses()
    return {"statuses": statuses}

@app.get("/transcripts")
async def list_transcripts():
    files = [f.name for f in TRANSCRIPT_FOLDER.glob("*.txt")]
    return {"transcripts": files}

@app.get("/transcripts/{filename}")
async def get_transcript(filename: str):
    transcript_path = TRANSCRIPT_FOLDER / filename
    if not transcript_path.exists():
        raise HTTPException(status_code=404, detail="Transcript not found")
    return FileResponse(transcript_path)

@app.delete("/transcripts/{filename}")
async def delete_transcript(filename: str):
    transcript_path = TRANSCRIPT_FOLDER / filename
    if transcript_path.exists():
        transcript_path.unlink()
        return {"detail": "Transcript deleted"}
    else:
        raise HTTPException(status_code=404, detail="Transcript not found")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
