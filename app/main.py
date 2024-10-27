from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import wave
import pyaudio
import os
from faster_whisper import WhisperModel

app = FastAPI()

# Serve the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

NEON_GREEN = "\033[92m"
RESET_COLOR = "\033[0m"
model = WhisperModel("small", device="auto", compute_type="int8")

@app.get("/")
async def get():
    return HTMLResponse(open("static/index.html").read())

async def transcribe_chunk(file_path):
    segments, _ = model.transcribe(file_path, beam_size=10)
    return " ".join([segment.text for segment in segments])

def record_chunk(p, stream, file_path, chunk_length=1):
    frames = []
    for _ in range(0, int(16000 / 1024 * chunk_length)):
        data = stream.read(1024)
        frames.append(data)

    wf = wave.open(file_path, 'wb')
    wf.setnchannels(1)
    wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
    wf.setframerate(16000)
    wf.writeframes(b''.join(frames))
    wf.close()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    accumulated_transcription = ""
    
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=1024)

    try:
        while True:
            chunk_file = "temp_chunk.wav"
            record_chunk(p, stream, chunk_file, 5)  # Record a chunk

            # Transcribe the audio chunk
            transcription = await transcribe_chunk(chunk_file)
            print(NEON_GREEN + transcription + RESET_COLOR)
            accumulated_transcription += transcription + " "

            # Send the transcription to the client
            await websocket.send_text(transcription)
            os.remove(chunk_file)  # Clean up the temporary file

    except Exception as e:
        print(f"Error: {e}")

    finally:
        print("Final accumulated transcription:", accumulated_transcription)
        if stream.is_active():
            stream.stop_stream()
        stream.close()
        p.terminate()
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
