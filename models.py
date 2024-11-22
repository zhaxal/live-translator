# models.py

import logging
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

def load_model():
    try:
        # Use a smaller model for faster transcription
        model_size = "medium"
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        logger.info(f"Loaded Whisper model '{model_size}' successfully.")
        return model
    except Exception as e:
        logger.exception("Failed to load Whisper model.")
        raise e
