import torch
from faster_whisper import WhisperModel
import os
from logger import setup_logger

logger = setup_logger(__name__)


def load_model() -> WhisperModel:
    model_size = os.getenv("MODEL_SIZE") or "small"
    try:
        if torch.cuda.is_available():
            model = WhisperModel(model_size, device="cuda", compute_type="float16")
            logger.info("Using GPU")
        else:
            model = WhisperModel(model_size, device="cpu", compute_type="int8")
            logger.info("Using CPU")
    except Exception:
        # Fallback to CPU if any error occurs
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        logger.error("Error loading model, falling back to CPU")

    return model
