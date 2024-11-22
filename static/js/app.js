// Constants
const SAMPLE_RATE = 16000;
const PROCESSOR_BUFFER_SIZE = 4096;
const DESIRED_CHUNK_SIZE = SAMPLE_RATE * 3; // 3 seconds

// DOM Elements
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const downloadButton = document.getElementById("download");
const clearButton = document.getElementById("clear");
const analyzeButton = document.getElementById("analyze");
const languageSelect = document.getElementById("language");
const transcriptDiv = document.getElementById("transcript");
const statusDiv = document.getElementById("status");
const analysisDiv = document.getElementById("analysis");
const themeToggle = document.getElementById("themeToggle");

// Global Variables
let audioContext;
let processor;
let socket;
let mediaStream;
let audioQueue = [];
let totalQueueLength = 0;
let transcriptionHistory = [];

// Theme Management
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function setTheme(isDark) {
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Initialize theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  setTheme(savedTheme === "dark");
} else {
  setTheme(prefersDark.matches);
}

// UI Functions
function updateStatus(message) {
  statusDiv.textContent = message;
  statusDiv.setAttribute('aria-live', 'polite');
}

function addTranscript(text, timestamp) {
  const entry = document.createElement("div");
  entry.className = "transcript-entry";
  entry.tabIndex = 0;
  entry.setAttribute('role', 'listitem');

  const time = new Date(timestamp).toLocaleTimeString();
  entry.innerHTML = `
    <span class="timestamp" aria-label="Time">${time}</span>
    <span class="text">${text}</span>
  `;

  transcriptDiv.appendChild(entry);
  transcriptDiv.scrollTop = transcriptDiv.scrollHeight;

  // Save to history
  transcriptionHistory.push({ text, timestamp });
}

// History Management Functions
function downloadHistory() {
  if (transcriptionHistory.length === 0) {
    updateStatus("No history to download");
    return;
  }

  const text = transcriptionHistory
    .map(
      (entry) => `[${new Date(entry.timestamp).toLocaleString()}] ${entry.text}`
    )
    .join("\n");

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transcription-history-${new Date()
    .toISOString()
    .slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearHistory() {
  transcriptionHistory = [];
  transcriptDiv.innerHTML = "";
  analysisDiv.style.display = "none";
  updateStatus("History cleared");
}

// Analysis Function
async function analyzeHistory() {
  if (transcriptionHistory.length === 0) {
    updateStatus("No history to analyze");
    return;
  }

  try {
    updateStatus("Analyzing history...");
    const response = await fetch("/analyze-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        history: transcriptionHistory,
        language: languageSelect.value,
      }),
    });

    if (!response.ok) throw new Error("Analysis failed");

    const data = await response.json();
    analysisDiv.style.display = "block";
    analysisDiv.innerHTML = `<h3>Analysis</h3><p>${data.analysis}</p>`;
    updateStatus("Analysis complete");
  } catch (error) {
    updateStatus("Failed to analyze history: " + error.message);
  }
}

// Audio Processing Functions
async function startTranscription() {
  try {
    startButton.disabled = true;
    stopButton.disabled = false;
    languageSelect.disabled = true;
    updateStatus("Initializing...");

    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: SAMPLE_RATE,
    });

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(mediaStream);

    processor = audioContext.createScriptProcessor(PROCESSOR_BUFFER_SIZE, 1, 1);

    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    socket = new WebSocket(
      `${protocol}${window.location.host}/ws?lang=${languageSelect.value}`
    );
    socket.binaryType = "arraybuffer";

    socket.addEventListener("open", () => {
      updateStatus("Connected - Recording...");
    });

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        addTranscript(data.text, data.timestamp);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    });

    socket.addEventListener("close", () => {
      updateStatus("Disconnected");
    });

    socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      updateStatus("Connection error");
    });

    processor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const int16Data = new Int16Array(inputData.length);

      for (let i = 0; i < inputData.length; i++) {
        int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
      }

      audioQueue.push(int16Data);
      totalQueueLength += int16Data.length;

      if (totalQueueLength >= DESIRED_CHUNK_SIZE) {
        const combinedData = new Int16Array(totalQueueLength);
        let offset = 0;

        for (const chunk of audioQueue) {
          combinedData.set(chunk, offset);
          offset += chunk.length;
        }

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(combinedData.buffer);
        }

        audioQueue = [];
        totalQueueLength = 0;
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  } catch (error) {
    console.error("Error starting transcription:", error);
    updateStatus("Error: " + error.message);
    startButton.disabled = false;
    stopButton.disabled = true;
    languageSelect.disabled = false;
  }
}

async function stopTranscription() {
  try {
    updateStatus("Stopping...");

    if (processor) {
      processor.disconnect();
      processor = null;
    }

    if (audioContext) {
      await audioContext.close();
      audioContext = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
      socket = null;
    }

    startButton.disabled = false;
    stopButton.disabled = true;
    languageSelect.disabled = false;
    updateStatus("Stopped");
  } catch (error) {
    console.error("Error stopping transcription:", error);
    updateStatus("Error stopping: " + error.message);
  }
}

// Event Listeners
startButton.addEventListener("click", startTranscription);
stopButton.addEventListener("click", stopTranscription);
downloadButton.addEventListener("click", downloadHistory);
clearButton.addEventListener("click", clearHistory);
analyzeButton.addEventListener("click", analyzeHistory);
themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  setTheme(!isDark);
});

// Add keyboard support for theme toggle
themeToggle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(!isDark);
  }
});

// Add loading states for buttons
function setLoading(button, isLoading) {
  button.disabled = isLoading;
  button.setAttribute('aria-busy', isLoading);
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Loading...';
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
}

window.addEventListener("beforeunload", stopTranscription);
