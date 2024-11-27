/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import Button from "../Button";

import useWebSocket, { ReadyState } from "react-use-websocket";

const SAMPLE_RATE = 16000;
const PROCESSOR_BUFFER_SIZE = 4096;
const DESIRED_CHUNK_SIZE = SAMPLE_RATE * 3;

function Home() {
  const [micIsOn, setMicIsOn] = useState(false);
  const [mediaStream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState("idle");

  // const [audioQueue, setAudioQueue] = useState<Int16Array[]>([]);
  // const [totalQueueLength, setTotalQueueLength] = useState(0);

  const { sendMessage, readyState } = useWebSocket("ws://localhost:8000/ws", {
    share: true,
  });

  const startTranscription = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log("getUserMedia is not supported");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      const source = audioContext.createMediaStreamSource(mediaStream);

      const processor = audioContext.createScriptProcessor(
        PROCESSOR_BUFFER_SIZE,
        1,
        1
      );

      let audioQueue: Int16Array[] = [];
      let totalQueueLength = 0;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const int16Data = new Int16Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }

        audioQueue.push(int16Data);
        totalQueueLength += int16Data.length;

        if (totalQueueLength >= DESIRED_CHUNK_SIZE) {
          const data = new Int16Array(totalQueueLength);
          let offset = 0;

          for (const chunk of audioQueue) {
            data.set(chunk, offset);
            offset += chunk.length;
          }

          sendMessage(data.buffer);

          audioQueue = [];
          totalQueueLength = 0;
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setMicIsOn(true);

      setStatus("transcribing");

      console.log("Listening for audio");
    } catch (err) {
      setMicIsOn(false);
      setStatus("idle");
      console.error(err);
    } finally {
      setStream(mediaStream);
    }
  };

  const stopTranscription = () => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    setMicIsOn(!micIsOn);
    setStatus("idle");
  };

  const toggleTranscription = () => {
    if (micIsOn) {
      stopTranscription();
    } else {
      startTranscription();
    }
  };

  return (
    <>
      <Button onClick={toggleTranscription}>
        {micIsOn ? "Stop transcription" : "Start transcription"}
      </Button>

      <p className="mt-4">
        Status: {status}
        <br />
        WebSocket status: {ReadyState[readyState]}
      </p>

      <textarea
        placeholder="Translation will appear here"
        className="w-full h-64 mt-4 p-2 border border-gray-300 rounded-md resize-none"
        disabled
        readOnly
      ></textarea>
    </>
  );
}

export default Home;
