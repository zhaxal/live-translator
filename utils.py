# utils.py

import numpy as np
import logging
from webrtcvad import Vad
import asyncio

logger = logging.getLogger("app")
vad = Vad(2)  # Aggressiveness mode for VAD

def is_silent(audio_array, sample_rate=16000, frame_duration=30):
    """
    Use WebRTC VAD to determine if the audio contains speech.
    """
    frame_length = int(sample_rate * frame_duration / 1000)
    is_speech = False

    for start in range(0, len(audio_array), frame_length):
        end = start + frame_length
        frame = audio_array[start:end]
        if len(frame) < frame_length:
            break
        pcm_data = frame.tobytes()
        if vad.is_speech(pcm_data, sample_rate):
            is_speech = True
            break

    return not is_speech

def _transcribe_chunk_sync(audio_data, model):
    try:
        # Convert raw PCM data to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.int16)

        # Check for silence using VAD
        if is_silent(audio_array):
            logger.info("Silence detected, skipping transcription.")
            return ""

        logger.info("Transcribing audio chunk...")

        # Normalize audio to float32 in range [-1, 1]
        audio_array = audio_array.astype(np.float32) / 32768.0

        # Transcribe the audio array
        segments, _ = model.transcribe(
            audio_array,
            beam_size=10,
            no_speech_threshold=0.8,
            task="translate",
            language="en",
        )
        transcription = " ".join([segment.text for segment in segments]) if segments else ""
        logger.info(f"Transcription result: {transcription}")

    except Exception as e:
        logger.exception(f"An error occurred during transcription: {e}")
        transcription = "Error in audio processing."

    return transcription

async def transcribe_chunk(audio_data, model):
    transcription = await asyncio.to_thread(_transcribe_chunk_sync, audio_data, model)
    return transcription