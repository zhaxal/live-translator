from faster_whisper import WhisperModel

def load_model():
    try:
        model_size = "medium"
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        print("Model loaded successfully")
        return model
    except Exception as e:
        print(e)
        return None