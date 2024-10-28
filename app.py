# app.py

import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from config import LOGGING_CONFIG
from models import load_model
import asyncio
import numpy as np
import aiofiles

# Configure logging
import logging.config
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load the Whisper model once at startup
model = load_model()

@app.get("/")
async def get():
    # Serve the index.html file
    async with aiofiles.open("static/index.html", mode='r', encoding="utf-8") as f:
        content = await f.read()
    return HTMLResponse(content)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            # Offload transcription to avoid blocking the event loop
            transcription = await asyncio.to_thread(transcribe_audio, data)
            if transcription.strip():
                await websocket.send_text(transcription)
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    except Exception as e:
        logger.exception(f"Error in WebSocket connection: {e}")
        await websocket.close()

def transcribe_audio(audio_data):
    try:
        # Convert bytes to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

        # Transcribe the audio
        segments, _ = model.transcribe(
            audio_array,
            beam_size=1,
            task="transcribe",  # Use "transcribe" for same-language transcription
            language="en",       # Set language if known
        )

        # Combine the text from all segments
        transcription = " ".join([segment.text for segment in segments]) if segments else ""
        logger.info(f"Transcription: {transcription}")
        return transcription

    except Exception as e:
        logger.exception("Failed to transcribe audio.")
        return "Error in transcription."
