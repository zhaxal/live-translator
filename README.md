# Live Translator

Live Translator is a real-time audio transcription and translation application built with FastAPI and WebSockets. It leverages the Whisper model for transcription and translation tasks.

## Features

- Real-time audio transcription
- Translation of transcribed text
- WebSocket-based communication for low-latency interaction
- Logging with color-coded output for better readability

## Installation

1. Clone the repository:
  ```sh
  git clone https://github.com/yourusername/live-translator.git
  cd live-translator
  ```

2. Create a virtual environment and activate it:
  ```sh
  python -m venv venv
  source venv/bin/activate  # On Windows use `venv\Scripts\activate`
  ```

3. Install the required dependencies:
  ```sh
  pip install -r requirements.txt
  ```

## Usage

1. Start the FastAPI server:
  ```sh
  uvicorn app:app --reload
  ```

2. Open your browser and navigate to `http://localhost:8000` to access the application.

## Project Structure

- `app.py`: Main application file containing the FastAPI setup and WebSocket endpoint.
- `models.py`: Contains the model loading logic.
- `config.py`: Configuration for logging.
- `static/`: Directory for static files like `index.html`.
- `requirements.txt`: List of dependencies.

## Code Overview

### `app.py`

```py
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
  async with aiofiles.open("static/index.html", mode='r', encoding="utf-8") as f:
    content = await f.read()
  return HTMLResponse(content)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
  await websocket.accept()
  try:
    while True:
      data = await websocket.receive_bytes()
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
    audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
    segments, _ = model.transcribe(audio_array, beam_size=5, task="translate", language="en")
    transcription = " ".join([segment.text for segment in segments]) if segments else ""
    logger.info(f"Transcription: {transcription}")
    return transcription
  except Exception as e:
    logger.exception("Failed to transcribe audio.")
    return "Error in transcription."
```

### `models.py`

```py
import logging
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

def load_model():
  try:
    model_size = "large-v3"
    model = WhisperModel(model_size, device="cuda", compute_type="float16")
    logger.info(f"Loaded Whisper model '{model_size}' successfully.")
    return model
  except Exception as e:
    logger.exception("Failed to load Whisper model.")
    raise e
```

### `config.py`

```py
import logging

LOGGING_CONFIG = {
  "version": 1,
  "disable_existing_loggers": False,
  "formatters": {
    "standard": {
      "()": "colorlog.ColoredFormatter",
      "format": "%(log_color)s[%(asctime)s] %(levelname)s - %(message)s",
      "log_colors": {
        "DEBUG": "cyan",
        "INFO": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "bold_red",
      },
    },
  },
  "handlers": {
    "console": {
      "class": "logging.StreamHandler",
      "formatter": "standard",
      "stream": "ext://sys.stdout",
    },
  },
  "root": {
    "handlers": ["console"],
    "level": "INFO",
  },
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes.

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [Whisper](https://github.com/openai/whisper)
- [Colorlog](https://github.com/borntyping/python-colorlog)
