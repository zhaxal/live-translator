# models.py

from faster_whisper import WhisperModel
import logging

logger = logging.getLogger("app")

def initialize_model():
    try:
        # Initialize Whisper model with the desired size
        model = WhisperModel("large-v3", device="cuda", compute_type="float16")
        logger.info("Whisper model initialized successfully.")
        return model
    except Exception as e:
        logger.exception("Failed to initialize Whisper model.")
        raise e
