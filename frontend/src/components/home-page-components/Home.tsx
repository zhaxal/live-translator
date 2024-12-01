import { useState, useRef, useEffect } from "react";
import Button from "../Button";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { SAMPLE_RATE, PROCESSOR_BUFFER_SIZE, CHUNK_SIZE } from "../../constants";

function Home() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const totalQueueLengthRef = useRef<number>(0);

  const { sendMessage, lastJsonMessage, readyState } = useWebSocket<{ text: string }>(
    "ws://localhost:8000/ws",
    {
      share: true,
      onMessage: () => {},
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    if (lastJsonMessage) {
      const newText = lastJsonMessage.text;
      setTranscript((prev) => prev + newText + "\n");
      setHistory((prev) => [...prev, newText]);
    }
  }, [lastJsonMessage]);

  const startTranscription = async () => {
    if (isTranscribing) return;

    try {
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
          sendMessage(combinedData.buffer);
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

    processorRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
    audioQueueRef.current = [];
    totalQueueLengthRef.current = 0;

    setIsTranscribing(false);
  };

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
      const response = await fetch("http://localhost:8000/analyze-history", {
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

  return (
    <div>
      <Button onClick={isTranscribing ? stopTranscription : startTranscription}>
        {isTranscribing ? "Stop Transcription" : "Start Transcription"}
      </Button>
      <Button onClick={downloadHistory} className="ml-2">
        Download History
      </Button>
      <Button onClick={analyzeHistory} className="ml-2">
        Analyze History
      </Button>
      <p className="mt-4">
        WebSocket Status: {ReadyState[readyState]}
      </p>
      <textarea
        className="w-full h-64 mt-4 p-2 border border-gray-300 rounded-md resize-none"
        value={transcript}
        readOnly
      />
    </div>
  );
}

export default Home;
