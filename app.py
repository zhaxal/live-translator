from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, UploadFile, File, BackgroundTasks, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.templating import Jinja2Templates
import logging.config
import asyncio
import numpy as np
import aiofiles
from datetime import datetime
from typing import List
import uuid
import os
from pydantic import BaseModel, Field, ValidationError
from typing import Literal
from pathlib import Path
import librosa
import soundfile as sf

from config import LOGGING_CONFIG
from models import load_model
from llm import init_openai
from database import SessionLocal, TranscriptionJob, Status

# Configure logging
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Setup template and static directories
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Initialize models at startup
model = load_model()
openai_client = init_openai()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Validation model
class UploadRequest(BaseModel):
    language: Literal["en", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "ja", "ko", "zh"] = Field(
        default="en",
        description="Language code for transcription"
    )

# Allowed audio formats
ALLOWED_AUDIO_TYPES = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 
    'audio/x-wav', 'audio/ogg', 'audio/flac'
]

@app.post("/analyze-history")
async def analyze_history(body: dict):
    history = body.get("history", [])
    if not history:
        raise HTTPException(status_code=400, detail="No history provided")
    
    language = body.get("language", "en")
    
    # Map language codes to full names
    language_names = {
        "en": "English",
        "ja": "Japanese",
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "it": "Italian",
        "pt": "Portuguese",
        "nl": "Dutch",
        "pl": "Polish",
        "ru": "Russian",
        "ko": "Korean",
        "zh": "Chinese"
    }

    try:
        formatted_history = "\n".join([entry['text'] for entry in history])
        
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are analyzing transcribed speech that may have recognition errors. Provide a clear summary and handle unclear words based on context."},
                {"role": "user", "content": f"Analyze this text and write the summary in {language_names.get(language, 'English')}:\n\n{formatted_history}"}
            ]
        )
        
        return JSONResponse({
            "analysis": response.choices[0].message.content
        })
    except Exception as e:
        logger.exception("Failed to analyze history")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    language: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    # Validate language
    try:
        UploadRequest(language=language)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Validate files
    if not files:
        raise HTTPException(status_code=422, detail="No files provided")

    # Check file types
    for file in files:
        content_type = file.content_type
        if content_type not in ALLOWED_AUDIO_TYPES:
            raise HTTPException(
                status_code=422, 
                detail=f"File {file.filename} has unsupported format. Allowed formats: MP3, WAV, OGG, FLAC"
            )

    job_id = str(uuid.uuid4())
    db = SessionLocal()
    
    try:
        for file in files:
            file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
            content = await file.read()
            
            # Ensure file is not empty
            if len(content) == 0:
                raise HTTPException(status_code=422, detail=f"File {file.filename} is empty")
                
            with open(file_path, "wb") as f:
                f.write(content)
            
            job = TranscriptionJob(
                job_id=job_id,
                status=Status.PENDING.value,
                original_filename=file.filename,
                output_path=file_path,
                language=language
            )
            db.add(job)
        
        db.commit()
        background_tasks.add_task(process_transcription, job_id)
        return {"job_id": job_id}

    except Exception as e:
        # Cleanup on error
        db.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/status/{job_id}/check")
async def check_status(job_id: str):
    db = SessionLocal()
    try:
        jobs = db.query(TranscriptionJob).filter(
            TranscriptionJob.job_id == job_id
        ).all()
        
        if not jobs:
            raise HTTPException(status_code=404, detail="Job not found")
        
        files = []
        status = Status.COMPLETED.value
        
        for job in jobs:
            if job.status != Status.COMPLETED.value:
                status = job.status
                break
            files.append({
                "id": job.id,
                "original_filename": job.original_filename
            })
        
        return {
            "status": status,
            "files": files if status == Status.COMPLETED.value else []
        }
    finally:
        db.close()

@app.get("/download/{file_id}")
async def download_transcription(file_id: int):
    db = SessionLocal()
    try:
        job = db.query(TranscriptionJob).filter(
            TranscriptionJob.id == file_id
        ).first()
        
        if not job or job.status != Status.COMPLETED.value:
            raise HTTPException(status_code=404, detail="File not found")
            
        return FileResponse(
            job.output_path,
            filename=f"{job.original_filename}.txt",
            media_type="text/plain"
        )
    finally:
        db.close()

@app.get("/")
async def get():
    async with aiofiles.open("static/index.html", mode='r', encoding="utf-8") as f:
        content = await f.read()
    return HTMLResponse(content)

@app.get("/upload")
async def get_upload_page():
    async with aiofiles.open("static/upload.html", mode='r') as f:
        content = await f.read()
    return HTMLResponse(content)

@app.get("/status/{job_id}")
async def get_status_page(request: Request, job_id: str):
    return templates.TemplateResponse(
        "status.html",
        {"request": request, "job_id": job_id}
    )

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    lang: str = Query("en")
):
    await websocket.accept()
    logger.info(f"New WebSocket connection established for language: {lang}")
    
    try:
        while True:
            # Receive audio data
            audio_bytes = await websocket.receive_bytes()
            
            # Convert bytes to numpy array
            audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
            audio_float32 = audio_array.astype(np.float32) / 32768.0  # Normalize to [-1, 1]
            
            # Process audio
            transcription = await transcribe_audio(audio_float32, lang)
            
            # Send transcription if not empty
            if transcription and transcription.strip():
                response = {
                    'text': transcription,
                    'timestamp': datetime.now().isoformat()
                }
                await websocket.send_json(response)
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.exception(f"Error in WebSocket connection: {e}")
        await websocket.close()

async def transcribe_audio(audio_data: np.ndarray, language: str = "en") -> str:
    """
    Transcribe audio data using Whisper model.
    
    Args:
        audio_data: Audio data as float32 numpy array normalized to [-1, 1]
        language: Language code for transcription
        
    Returns:
        str: Transcribed text
    """
    try:
        # Run transcription in thread pool to avoid blocking
        segments, _ = await asyncio.to_thread(
            model.transcribe,
            audio_data,
            beam_size=5,
            language=language,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500)
        )

        # Combine all segments
        transcription = " ".join(segment.text for segment in segments if segment.text.strip())
        logger.info(f"Transcription ({language}): {transcription}")
        
        return transcription

    except Exception as e:
        logger.exception("Failed to transcribe audio")
        raise RuntimeError(f"Transcription failed: {str(e)}")

def load_audio(file_path: str) -> np.ndarray:
    """
    Load audio file and convert to correct format for whisper model.
    
    Args:
        file_path: Path to audio file
        
    Returns:
        np.ndarray: Audio data as float32 numpy array
    """
    try:
        # Load audio file using librosa
        audio, sr = librosa.load(
            file_path,
            sr=16000,  # Whisper expects 16kHz
            mono=True
        )
        
        # Normalize audio
        audio = librosa.util.normalize(audio)
        
        # Convert to float32
        audio = audio.astype(np.float32)
        
        return audio
        
    except Exception as e:
        logger.exception(f"Failed to load audio file: {file_path}")
        raise RuntimeError(f"Audio loading failed: {str(e)}")

# Add background task function
async def process_transcription(job_id: str):
    db = SessionLocal()
    try:
        jobs = db.query(TranscriptionJob).filter(
            TranscriptionJob.job_id == job_id
        ).all()
        
        for job in jobs:
            job.status = Status.PROCESSING.value
            db.commit()
            
            try:
                # Use existing transcription logic
                audio = load_audio(job.output_path)
                transcription = await transcribe_audio(audio, job.language)
                
                # Save transcription
                output_path = f"{job.output_path}.txt"
                with open(output_path, "w") as f:
                    f.write(transcription)
                
                job.status = Status.COMPLETED.value
                job.output_path = output_path
            except Exception as e:
                logger.exception(f"Transcription failed for {job.original_filename}")
                job.status = Status.FAILED.value
            
            db.commit()
    finally:
        db.close()