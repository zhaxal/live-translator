/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import Button from "../Button";

const SAMPLE_RATE = 16000;
const PROCESSOR_BUFFER_SIZE = 4096;
const DESIRED_CHUNK_SIZE = SAMPLE_RATE * 3;

function Home() {
  const [micIsOn, setMicIsOn] = useState(false);
  const [mediaStream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState("idle");

  const startTranscription = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log("getUserMedia is not supported");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });



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
