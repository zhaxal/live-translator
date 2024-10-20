from faster_whisper import WhisperModel

model_size = "large-v3"

# Run on GPU with FP16
model = WhisperModel(model_size, device="cuda", compute_type="float16")

# or run on GPU with INT8
# model = WhisperModel(model_size, device="cuda", compute_type="int8_float16")
# or run on CPU with INT8
# model = WhisperModel(model_size, device="cpu", compute_type="int8")

segments, info = model.transcribe("audio/space_lecture_2nd_part2.mp3", beam_size=5)

print("Detected language '%s' with probability %f" % (info.language, info.language_probability))

with open("textfiles/transcript.txt", "w", encoding="utf-8") as file:
    for segment in segments:
        file.write("[%.2fs -> %.2fs] %s\n" % (segment.start, segment.end, segment.text))
        print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))