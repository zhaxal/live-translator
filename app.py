# app.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from typing import Optional, Dict
import logging.config
import asyncio
import numpy as np
import aiofiles
from datetime import datetime
from dataclasses import dataclass
from collections import deque
import json

# Import local modules
from config import LOGGING_CONFIG
from models import load_model
from llm import init_openai

# Configure logging
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

@dataclass
class TranscriptionSession:
    websocket: WebSocket
    buffer: deque
    last_processed: datetime
    is_active: bool

class TranscriptionApp:
    def __init__(self):
        self.app = FastAPI(title="Live Audio Transcription")
        self.model = load_model()
        self.openai_client = init_openai()
        self.active_sessions: Dict[str, TranscriptionSession] = {}
        self.setup_routes()
        
        # Constants
        self.BUFFER_MAX_SIZE = 5  # Maximum number of audio chunks to buffer
        self.PROCESS_INTERVAL = 2.0  # Seconds between processing batches
        
    def setup_routes(self):
        self.app.mount("/static", StaticFiles(directory="static"), name="static")
        
        @self.app.get("/")
        async def get():
            async with aiofiles.open("static/index.html", mode='r', encoding="utf-8") as f:
                content = await f.read()
            return HTMLResponse(content)
            
        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket, background_tasks: BackgroundTasks):
            session_id = str(id(websocket))
            await self.handle_websocket_connection(websocket, session_id, background_tasks)

    async def handle_websocket_connection(self, websocket: WebSocket, session_id: str, background_tasks: BackgroundTasks):
        await websocket.accept()
        
        # Initialize session
        self.active_sessions[session_id] = TranscriptionSession(
            websocket=websocket,
            buffer=deque(maxlen=self.BUFFER_MAX_SIZE),
            last_processed=datetime.now(),
            is_active=True
        )
        
        # Start background processing task
        background_tasks.add_task(self.process_audio_buffer, session_id)
        
        try:
            await self.handle_websocket_messages(session_id)
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected: {session_id}")
        except Exception as e:
            logger.exception(f"Error in WebSocket connection: {e}")
        finally:
            await self.cleanup_session(session_id)

    async def handle_websocket_messages(self, session_id: str):
        session = self.active_sessions[session_id]
        while session.is_active:
            try:
                data = await session.websocket.receive_bytes()
                session.buffer.append(data)
            except Exception as e:
                logger.error(f"Error receiving message: {e}")
                break

    async def process_audio_buffer(self, session_id: str):
        session = self.active_sessions[session_id]
        
        while session.is_active:
            if len(session.buffer) > 0 and (datetime.now() - session.last_processed).total_seconds() >= self.PROCESS_INTERVAL:
                try:
                    # Process all available audio in buffer
                    audio_data = b''.join(session.buffer)
                    session.buffer.clear()
                    
                    # Process audio in background
                    transcription = await asyncio.to_thread(
                        self.transcribe_audio, 
                        audio_data
                    )
                    
                    if transcription.strip():
                        await session.websocket.send_json({
                            'type': 'transcription',
                            'text': transcription,
                            'timestamp': datetime.now().isoformat()
                        })
                        
                except Exception as e:
                    logger.exception("Error processing audio buffer")
                    
                session.last_processed = datetime.now()
            
            await asyncio.sleep(0.1)  # Prevent CPU overload

    def transcribe_audio(self, audio_data: bytes) -> str:
        try:
            # Convert bytes to numpy array with proper normalization
            audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

            # Transcribe with optimized parameters
            segments, _ = self.model.transcribe(
                audio_array,
                beam_size=5,
                task="translate",
                language="en",
                vad_filter=True,  # Filter out non-speech
                vad_parameters=dict(min_silence_duration_ms=500)
            )

            return " ".join(segment.text for segment in segments if segment.text.strip())

        except Exception as e:
            logger.exception("Failed to transcribe audio")
            return ""

    async def cleanup_session(self, session_id: str):
        if session_id in self.active_sessions:
            self.active_sessions[session_id].is_active = False
            del self.active_sessions[session_id]
            logger.info(f"Cleaned up session: {session_id}")

# Create application instance
app_instance = TranscriptionApp()
app = app_instance.app