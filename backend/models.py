import torch
from faster_whisper import WhisperModel
import os


def load_model() -> WhisperModel:
    model_size = os.getenv("OPENAI_API_KEY") or "small"
    try:
        if torch.cuda.is_available():
            model = WhisperModel(model_size, device="cuda", compute_type="float16")
        else:
            model = WhisperModel(model_size, device="cpu", compute_type="int8")
    except Exception:
        # Fallback to CPU if any error occurs
        model = WhisperModel(model_size, device="cpu", compute_type="int8")

    return model
