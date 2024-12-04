import { useState, useRef, useEffect } from "react";
import Button from "../Button";
import { SAMPLE_RATE, PROCESSOR_BUFFER_SIZE, CHUNK_SIZE } from "../../constants";
import { host, wsHost } from "../../utils/backend";

function Home() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const totalQueueLengthRef = useRef<number>(0);
  const websocketRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setupWebSocket = () => {
    const ws = new WebSocket(`${wsHost}/ws`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newText = data.text;
      setTranscript((prev) => prev + newText + "\n");
      setHistory((prev) => [...prev, newText]);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocketRef.current = ws;
  };

  const startTranscription = async () => {
    if (isTranscribing) return;

    try {
      setupWebSocket();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new window.AudioContext({
        sampleRate: SAMPLE_RATE,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(PROCESSOR_BUFFER_SIZE, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }

        audioQueueRef.current.push(int16Data);
        totalQueueLengthRef.current += int16Data.length;

        if (totalQueueLengthRef.current >= CHUNK_SIZE) {
          const combinedData = new Int16Array(totalQueueLengthRef.current);
          let offset = 0;
          for (const chunk of audioQueueRef.current) {
            combinedData.set(chunk, offset);
            offset += chunk.length;
          }
          websocketRef.current?.send(combinedData.buffer);
          audioQueueRef.current = [];
          totalQueueLengthRef.current = 0;
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsTranscribing(true);
    } catch (error) {
      console.error("Error starting transcription:", error);
    }
  };

  const stopTranscription = () => {
    if (!isTranscribing) return;

    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

    websocketRef.current?.close();
    websocketRef.current = null;

    processorRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
    audioQueueRef.current = [];
    totalQueueLengthRef.current = 0;

    setIsTranscribing(false);
  };

  useEffect(() => {
    return () => {
      stopTranscription();
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [transcript]);

  const downloadHistory = () => {
    if (history.length === 0) return;
    const content = history.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcription_history_${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const analyzeHistory = async () => {
    if (history.length === 0) return;
    try {
      const response = await fetch(`${host}/analyze-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(history),
      });
      const data = await response.json();
      alert(`Analysis:\n${data.analysis}`);
    } catch (error) {
      console.error("Error analyzing history:", error);
    }
  };

  const clearHistory = () => {
    if (history.length === 0) return;
    if (window.confirm("Are you sure you want to clear the transcription history?")) {
      setTranscript("");
      setHistory([]);
    }
  };

  return (
    <div className="px-4 md:px-6 py-4">
      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
        <Button
          onClick={isTranscribing ? stopTranscription : startTranscription}
          variant={isTranscribing ? "danger" : "primary"}
          fullWidth
          className="min-h-[44px]"
        >
          {isTranscribing ? "Stop Transcription" : "Start Transcription"}
        </Button>
        <Button 
          onClick={downloadHistory} 
          variant="secondary"
          fullWidth
          className="min-h-[44px]"
        >
          Download History
        </Button>
        <Button 
          onClick={analyzeHistory} 
          variant="purple"
          fullWidth
          className="min-h-[44px]"
        >
          Analyze History
        </Button>
        <Button 
          onClick={clearHistory} 
          variant="warning"
          fullWidth
          className="min-h-[44px]"
        >
          Clear History
        </Button>
      </div>

      <textarea
        ref={textareaRef}
        className="w-full h-48 md:h-64 mt-4 md:mt-6 p-3 border border-gray-300 rounded-md resize-none text-sm md:text-base scroll-smooth"
        value={transcript}
        readOnly
        aria-label="Transcription output"
      />
    </div>
  );
}

export default Home;
