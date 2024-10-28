# main.py

from fastapi import FastAPI
from starlette.websockets import WebSocket
from fastapi.staticfiles import StaticFiles
from config import LOGGING_CONFIG
from routes import router
from models import initialize_model
import logging.config

# Apply the logging configuration
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("app")

# Initialize FastAPI
app = FastAPI()
app.include_router(router)

# Serve the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Whisper model
model = initialize_model()

# Store the model in the app state for access in routes
app.state.model = model

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_config=LOGGING_CONFIG,
    )
