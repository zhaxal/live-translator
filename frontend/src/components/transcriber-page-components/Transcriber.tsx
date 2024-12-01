import { useState, useEffect } from "react";
import Button from "../Button";

function Transcriber() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [transcriptContent, setTranscriptContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState("");
  const [fileId, setFileId] = useState("");

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      const response = await fetch("http://localhost:8000/transcripts");
      const data = await response.json();
      setTranscripts(data.transcripts);
    } catch (error) {
      console.error("Error fetching transcripts:", error);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setTranscriptionStatus("Uploading file...");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setFileId(data.file_id);
      setTranscriptionStatus("File uploaded. Transcription in progress...");
      // Start polling for transcription status
      pollTranscriptionStatus(data.file_id);
    } catch (error) {
      console.error("Error uploading file:", error);
      setTranscriptionStatus("Error uploading file");
      setUploading(false);
    }
  };

  const pollTranscriptionStatus = (fileId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/transcription-status/${fileId}`);
        const data = await response.json();
        if (data.status === "Completed") {
          setTranscriptionStatus("Transcription completed");
          setUploading(false);
          clearInterval(interval);
          fetchTranscripts();
        } else if (data.status.startsWith("Error")) {
          setTranscriptionStatus("Error during transcription");
          setUploading(false);
          clearInterval(interval);
        } else {
          setTranscriptionStatus(`Status: ${data.status}`);
        }
      } catch (error) {
        console.error("Error fetching transcription status:", error);
        setTranscriptionStatus("Error fetching transcription status");
        setUploading(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  const loadTranscript = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/transcripts/${filename}`);
      const text = await response.text();
      setTranscriptContent(text);
    } catch (error) {
      console.error("Error loading transcript:", error);
    }
  };

  const downloadTranscript = (filename: string) => {
    const link = document.createElement("a");
    link.href = `http://localhost:8000/transcripts/${filename}`;
    link.download = filename;
    link.click();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">File Transcriber</h2>
      <div className="mt-4">
        <input
          type="file"
          accept=".mp3,.wav,.m4a,.aac"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="border border-gray-300 p-2"
        />
        <Button onClick={uploadFile} className="ml-2">
          Upload and Transcribe
        </Button>
      </div>
      {uploading && (
        <div className="mt-4">
          <p>{transcriptionStatus}</p>
          {/* You can enhance the progress bar based on actual status */}
          <div className="w-full bg-gray-200 h-2 mt-2">
            <div className="bg-blue-500 h-2" style={{ width: "50%" }}></div>
          </div>
        </div>
      )}
      <div className="mt-4">
        <h3 className="text-xl font-bold">Available Transcripts</h3>
        <ul>
          {transcripts.map((filename) => (
            <li key={filename} className="mt-2">
              <Button onClick={() => loadTranscript(filename)} variant="secondary">
                {filename}
              </Button>
              <Button onClick={() => downloadTranscript(filename)} className="ml-2" variant="secondary">
                Download
              </Button>
            </li>
          ))}
        </ul>
      </div>
      {transcriptContent && (
        <div className="mt-4">
          <h3 className="text-xl font-bold">Transcript Content</h3>
          <textarea
            className="w-full h-64 mt-2 p-2 border border-gray-300 rounded-md resize-none"
            value={transcriptContent}
            readOnly
          />
        </div>
      )}
    </div>
  );
}

export default Transcriber;
