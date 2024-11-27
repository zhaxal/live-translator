

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from models import load_model
from datetime import datetime

import asyncio
import numpy as np

app = FastAPI()
model = load_model()

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection established")

    try:
        while True:
            data = await websocket.receive_bytes()

            transcription = await asyncio.to_thread(transcribe_audio, data)

            if transcription.strip():
                response = {
                   "text": transcription,
                   "timestamp": str(datetime.datetime.now())
                }

                print ("Sending response:", response)
                await websocket.send_json(response)
    except WebSocketDisconnect:
        print("WebSocket connection closed")
    except Exception as e:
        print(e)
        await websocket.close()
        


def transcribe_audio(audio_data: bytes) -> str:
    try:
        audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

        segments, _ = model.transcribe(audio_array, beam_size=5, vad_filter=True, vad_parameters=dict(min_silence_duration_ms=500))

        transcription = " ".join(segment.text for segment in segments)
        print("Transcription:", transcription)

        return transcription
    
    except Exception as e:
        print(e)
        return ""
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


