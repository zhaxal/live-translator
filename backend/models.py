from faster_whisper import WhisperModel

def load_model():
    model_size = "medium"
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    return model
