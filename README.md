# Live Audio Transcription

A real-time audio transcription application built with FastAPI and WebSockets. It captures audio from your microphone, transcribes it using the Whisper model, and provides analysis capabilities using GPT-3.5.

## Features

- Real-time audio transcription in multiple languages
- Modern, responsive UI with Dark/Light theme support
- Transcription history management
  - Download transcription history as text file
  - Clear history
  - AI-powered analysis of transcription history using GPT-3.5
- Support for 12 languages:
  - English, Spanish, French, German
  - Italian, Portuguese, Dutch, Polish
  - Russian, Japanese, Korean, Chinese
- WebSocket-based communication for low-latency interaction
- Clean, modular codebase with separated concerns

## Requirements

- Python 3.8+
- CUDA-capable GPU (recommended for optimal performance)
- OpenAI API key for analysis features

## Installation

1. Clone the repository:
```sh
git clone https://github.com/zhaxal/live-transcription.git
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

## Project Structure

```
└── ./
    ├── static/
    │   ├── css/
    │   │   └── styles.css       # Application styling
    │   ├── js/
    │   │   └── app.js          # Frontend JavaScript
    │   └── index.html          # Main HTML template
    ├── app.py                  # FastAPI application
    ├── config.py               # Logging configuration
    ├── llm.py                  # OpenAI client initialization
    ├── models.py               # Whisper model setup
    └── requirements.txt        # Project dependencies
```

## Component Overview

### Frontend Architecture

#### HTML (`static/index.html`)
- Semantic HTML5 structure
- Clean organization of UI components
- External CSS and JavaScript imports

#### CSS (`static/css/styles.css`)
- CSS variables for theme management
- Responsive design
- Dark/Light theme support
- Modern UI components styling

#### JavaScript (`static/js/app.js`)
- Modular code organization
- WebSocket audio streaming
- Real-time UI updates
- Theme management
- History management
- Error handling

### Backend Architecture

#### FastAPI Application (`app.py`)
- WebSocket endpoint for audio streaming
- Static file serving
- Analysis endpoint using GPT-3.5
- Error handling and logging

#### Model Management (`models.py`)
- Whisper model initialization
- CUDA acceleration
- Optimized transcription settings

#### OpenAI Integration (`llm.py`)
- GPT-3.5 client setup
- Analysis functionality

## Technical Specifications

### Audio Processing
- Sample Rate: 16kHz
- Buffer Size: 4096 samples
- Chunk Size: 3 seconds
- Format: 16-bit PCM

### WebSocket Communication
- Binary audio data streaming
- JSON response format
- Automatic reconnection handling
- Error recovery

### Transcription Settings
- Model: Whisper Medium
- Compute Type: float16
- Device: CUDA (when available)
- VAD Filter: Enabled (500ms silence threshold)

## Development

### Running in Development Mode
```sh
# Install development dependencies
pip install -r requirements.txt

# Start the development server
uvicorn app:app --reload --port 8000
```

### Code Style
- Follow PEP 8 for Python code
- Use ES6+ features for JavaScript
- Maintain consistent indentation (2 spaces)
- Use meaningful variable and function names

## Error Handling

The application includes comprehensive error handling for:
- WebSocket connection issues
- Audio capture problems
- Transcription failures
- Analysis errors
- Browser compatibility issues

## Browser Compatibility

Tested and supported on:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [Whisper](https://github.com/openai/whisper)
- [faster-whisper](https://github.com/guillaumekln/faster-whisper)
- [OpenAI](https://openai.com/)
- [Colorlog](https://github.com/borntyping/python-colorlog)
