from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
import logging.config
import asyncio
import numpy as np
import aiofiles
from datetime import datetime

from config import LOGGING_CONFIG
from models import load_model
from llm import init_openai

# Configure logging
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize models at startup
model = load_model()
openai_client = init_openai()

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

@app.get("/")
async def get():
    async with aiofiles.open("static/index.html", mode='r', encoding="utf-8") as f:
        content = await f.read()
    return HTMLResponse(content)

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
            audio_data = await websocket.receive_bytes()
            
            # Process audio in background
            transcription = await asyncio.to_thread(
                transcribe_audio,
                audio_data,
                lang
            )
            
            # Send transcription if not empty
            if transcription.strip():
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

def transcribe_audio(audio_data: bytes, language: str = "en") -> str:
    try:
        # Convert bytes to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

        # Transcribe with optimized parameters
        segments, _ = model.transcribe(
            audio_array,
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
        return ""