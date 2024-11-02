# Live Audio Transcription

A real-time audio transcription application built with FastAPI and WebSockets. It captures audio from your microphone, transcribes it using the Whisper model, and provides analysis capabilities using GPT-3.5.

## Features

- Real-time audio transcription in multiple languages
- Dark/Light theme support
- Transcription history management
  - Download transcription history
  - Clear history
  - AI-powered analysis of transcription history
- Support for 12 languages including:
  - English, Spanish, French, German
  - Italian, Portuguese, Dutch, Polish
  - Russian, Japanese, Korean, Chinese
- WebSocket-based communication for low-latency interaction
- Colored logging output for better debugging

## Requirements

- Python 3.8+
- CUDA-capable GPU (recommended for optimal performance)
- OpenAI API key for analysis features

## Installation

1. Clone the repository:
```sh
git clone https://github.com/yourusername/live-transcription.git
cd live-transcription
```

2. Create a virtual environment and activate it:
```sh
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

3. Install the required dependencies:
```sh
pip install -r requirements.txt
```

4. Set up your OpenAI API key:
```sh
export OPENAI_API_KEY='your-api-key-here'  # Linux/Mac
set OPENAI_API_KEY=your-api-key-here  # Windows
```

## Usage

1. Start the FastAPI server:
```sh
uvicorn app:app --reload
```

2. Open your browser and navigate to `http://localhost:8000`

3. Select your desired language from the dropdown menu

4. Click "Start Transcription" to begin capturing and transcribing audio

5. Use the control buttons to:
   - Download transcription history
   - Analyze transcriptions using GPT-3.5
   - Clear the transcription history

## Project Structure

```
└── ./
    ├── static/
    │   └── index.html      # Frontend UI
    ├── app.py              # Main FastAPI application
    ├── config.py           # Logging configuration
    ├── llm.py             # OpenAI client initialization
    ├── models.py          # Whisper model setup
    └── requirements.txt    # Project dependencies
```

## Component Overview

### Backend (`app.py`)

- FastAPI application with WebSocket support
- Real-time audio processing using Whisper
- GPT-3.5 integration for transcription analysis
- Efficient audio chunking and processing
- Comprehensive error handling and logging

### Frontend (`static/index.html`)

- Clean, responsive UI with dark/light theme support
- Real-time audio capture and streaming
- WebSocket communication for low-latency updates
- Transcription history management
- Download and analysis capabilities

### Model Handling (`models.py`)

- Efficient Whisper model initialization
- CUDA acceleration with float16 precision
- Optimized for real-time transcription

## Technical Details

### Audio Processing

- Sample Rate: 16kHz
- Buffer Size: 4096 samples
- Chunk Size: 3 seconds of audio
- Format: 16-bit PCM

### Transcription

- Model: Whisper Medium
- Compute Type: float16
- Device: CUDA (when available)
- VAD Filter: Enabled with 500ms minimum silence duration

## Error Handling

The application includes comprehensive error handling for:
- WebSocket connection issues
- Audio capture problems
- Transcription failures
- Analysis errors

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [Whisper](https://github.com/openai/whisper)
- [faster-whisper](https://github.com/guillaumekln/faster-whisper)
- [OpenAI](https://openai.com/)
- [Colorlog](https://github.com/borntyping/python-colorlog)# Live Audio Transcription

A real-time audio transcription application built with FastAPI and WebSockets. It captures audio from your microphone, transcribes it using the Whisper model, and provides analysis capabilities using GPT-3.5.

## Features

- Real-time audio transcription in multiple languages
- Dark/Light theme support
- Transcription history management
  - Download transcription history
  - Clear history
  - AI-powered analysis of transcription history
- Support for 12 languages including:
  - English, Spanish, French, German
  - Italian, Portuguese, Dutch, Polish
  - Russian, Japanese, Korean, Chinese
- WebSocket-based communication for low-latency interaction
- Colored logging output for better debugging

## Requirements

- Python 3.8+
- CUDA-capable GPU (recommended for optimal performance)
- OpenAI API key for analysis features

## Installation

1. Clone the repository:
```sh
git clone https://github.com/yourusername/live-transcription.git
cd live-transcription
```

2. Create a virtual environment and activate it:
```sh
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

3. Install the required dependencies:
```sh
pip install -r requirements.txt
```

4. Set up your OpenAI API key:
```sh
export OPENAI_API_KEY='your-api-key-here'  # Linux/Mac
set OPENAI_API_KEY=your-api-key-here  # Windows
```

## Usage

1. Start the FastAPI server:
```sh
uvicorn app:app --reload
```

2. Open your browser and navigate to `http://localhost:8000`

3. Select your desired language from the dropdown menu

4. Click "Start Transcription" to begin capturing and transcribing audio

5. Use the control buttons to:
   - Download transcription history
   - Analyze transcriptions using GPT-3.5
   - Clear the transcription history

## Project Structure

```
└── ./
    ├── static/
    │   └── index.html      # Frontend UI
    ├── app.py              # Main FastAPI application
    ├── config.py           # Logging configuration
    ├── llm.py             # OpenAI client initialization
    ├── models.py          # Whisper model setup
    └── requirements.txt    # Project dependencies
```

## Component Overview

### Backend (`app.py`)

- FastAPI application with WebSocket support
- Real-time audio processing using Whisper
- GPT-3.5 integration for transcription analysis
- Efficient audio chunking and processing
- Comprehensive error handling and logging

### Frontend (`static/index.html`)

- Clean, responsive UI with dark/light theme support
- Real-time audio capture and streaming
- WebSocket communication for low-latency updates
- Transcription history management
- Download and analysis capabilities

### Model Handling (`models.py`)

- Efficient Whisper model initialization
- CUDA acceleration with float16 precision
- Optimized for real-time transcription

## Technical Details

### Audio Processing

- Sample Rate: 16kHz
- Buffer Size: 4096 samples
- Chunk Size: 3 seconds of audio
- Format: 16-bit PCM

### Transcription

- Model: Whisper Medium
- Compute Type: float16
- Device: CUDA (when available)
- VAD Filter: Enabled with 500ms minimum silence duration

## Error Handling

The application includes comprehensive error handling for:
- WebSocket connection issues
- Audio capture problems
- Transcription failures
- Analysis errors

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [Whisper](https://github.com/openai/whisper)
- [faster-whisper](https://github.com/guillaumekln/faster-whisper)
- [OpenAI](https://openai.com/)
- [Colorlog](https://github.com/borntyping/python-colorlog)