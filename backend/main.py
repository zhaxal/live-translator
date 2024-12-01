from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from models import load_model
from llm import init_openai
import uvicorn
import asyncio
import numpy as np
from datetime import datetime
from pathlib import Path
import uuid
import aiofiles

app = FastAPI()
model = load_model()
openai_client = init_openai()

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
        pass

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
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    filepath = UPLOAD_FOLDER / filename
    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    asyncio.create_task(transcribe_file(filepath))
    return {"filename": filename}

async def transcribe_file(filepath: Path):
    try:
        segments, info = model.transcribe(str(filepath))
        transcript_text = "\n".join(
            f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text.strip()}"
            for segment in segments
        )
        transcript_path = TRANSCRIPT_FOLDER / f"{filepath.stem}.txt"
        async with aiofiles.open(transcript_path, 'w', encoding='utf-8') as f:
            await f.write(transcript_text)
        filepath.unlink()
    except Exception as e:
        print(f"Error transcribing file {filepath}: {e}")

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

@app.post("/analyze-history")
async def analyze_history(history: list):
    if not history:
        raise HTTPException(status_code=400, detail="No history provided")
    try:
        formatted_history = "\n".join(history)
        response = await openai_client.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes transcribed speech."},
                {"role": "user", "content": f"Analyze the following text:\n\n{formatted_history}"}
            ]
        )
        return {"analysis": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
