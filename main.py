from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import logging
import logging.config
import numpy as np
import os
from faster_whisper import WhisperModel
from starlette.websockets import WebSocketDisconnect, WebSocketState
import aiofiles  # For asynchronous file operations

# Initialize FastAPI
app = FastAPI()

# Define the logging configuration with colored output
LOGGING_CONFIG = {
    "version": 1,  # Ensure version is specified
    "disable_existing_loggers": False,
    "formatters": {
        "colored": {
            "()": "colorlog.ColoredFormatter",
            "format": "%(log_color)s%(asctime)s - %(levelname)s - %(name)s - %(message)s",
            "log_colors": {
                "DEBUG": "cyan",
                "INFO": "green",
                "WARNING": "yellow",
                "ERROR": "red",
                "CRITICAL": "bold_red",
            },
        },
        "standard": {
            "format": "%(asctime)s - %(levelname)s - %(name)s - %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "colored",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "class": "logging.FileHandler",
            "formatter": "standard",
            "filename": "app.log",
            "mode": "a",
        },
    },
    "loggers": {
        "": {  # Root logger
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "uvicorn.error": {
            "level": "INFO",
            "handlers": ["console", "file"],
            "propagate": False,
        },
        "uvicorn.access": {
            "level": "INFO",
            "handlers": ["console", "file"],
            "propagate": False,
        },
    },
}

# Apply the logging configuration
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("app")

# Serve the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Whisper model with the desired size
model = WhisperModel("medium", device="cuda", compute_type="float16")

def is_silent(audio_array, threshold=0.01):
    """
    Determine if the audio is silent based on RMS energy.
    """
    rms = np.sqrt(np.mean(audio_array**2))
    return rms < threshold

@app.get("/")
async def get():
    # Use aiofiles for asynchronous file operations
    async with aiofiles.open("static/index.html", mode='r', encoding="utf-8") as f:
        content = await f.read()
    return HTMLResponse(content)

async def transcribe_chunk(audio_data):
    try:
        # Convert raw PCM data to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32)
        # Normalize audio data to range [-1, 1]
        audio_array /= 32768.0  # 16-bit audio

        # Check for silence using RMS energy
        if is_silent(audio_array):
            logger.info("Silence detected, skipping transcription.")
            return ""

        logger.info("Transcribing audio chunk...")

        # Transcribe the audio array
        segments, _ = model.transcribe(
            audio_array,
            beam_size=5,
            no_speech_threshold=0.6,
            task="translate",     # Set task to 'translate' if needed
            language=None,        # Set to None for automatic language detection
        )
        transcription = " ".join([segment.text for segment in segments]) if segments else ""
        logger.info(f"Transcription result: {transcription}")

    except Exception as e:
        logger.error(f"An error occurred during transcription: {e}")
        transcription = "Error in audio processing."

    return transcription

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    accumulated_transcription = ""

    try:
        while True:
            data = await websocket.receive_bytes()
            transcription = await transcribe_chunk(data)

            # Only send transcription if it's not empty
            if transcription.strip():
                accumulated_transcription += transcription + " "
                await websocket.send_text(transcription)
                logger.info("Sent transcription to client.")
            else:
                logger.info("No transcription to send (silence or noise).")

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info(f"Final accumulated transcription: {accumulated_transcription}")
        if websocket.application_state == WebSocketState.CONNECTED:
            try:
                await websocket.close()
                logger.info("WebSocket closed gracefully.")
            except Exception as e:
                logger.error(f"Error closing WebSocket: {e}")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_config=LOGGING_CONFIG,
    )
