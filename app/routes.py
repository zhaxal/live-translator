# routes.py

from fastapi import APIRouter, WebSocket
from fastapi.responses import HTMLResponse
from starlette.websockets import WebSocketDisconnect, WebSocketState
from utils import is_silent, transcribe_chunk
import logging
import aiofiles

router = APIRouter()
logger = logging.getLogger("app")

@router.get("/")
async def get():
    # Use aiofiles for asynchronous file operations
    async with aiofiles.open("static/index.html", mode='r', encoding="utf-8") as f:
        content = await f.read()
    return HTMLResponse(content)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    accumulated_transcription = ""

    try:
        while True:
            data = await websocket.receive_bytes()
            transcription = await transcribe_chunk(data, websocket.app.state.model)

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
        logger.exception(f"WebSocket error: {e}")
    finally:
        logger.info(f"Final accumulated transcription: {accumulated_transcription}")
        if websocket.application_state == WebSocketState.CONNECTED:
            try:
                await websocket.close()
                logger.info("WebSocket closed gracefully.")
            except Exception as e:
                logger.error(f"Error closing WebSocket: {e}")
