import { useState, useEffect } from "react";
import Button from "../Button";

function Transcriber() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [transcriptContent, setTranscriptContent] = useState("");

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
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      alert("File uploaded successfully");
      fetchTranscripts();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
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
      <h2>File Transcriber</h2>
      <div className="mt-4">
        <input
          type="file"
          accept=".mp3,.wav,.m4a,.aac"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
        <Button onClick={uploadFile} className="ml-2">
          Upload and Transcribe
        </Button>
      </div>
      <div className="mt-4">
        <h3>Available Transcripts</h3>
        <ul>
          {transcripts.map((filename) => (
            <li key={filename} className="mt-2">
              <Button onClick={() => loadTranscript(filename)}>{filename}</Button>
              <Button onClick={() => downloadTranscript(filename)} className="ml-2">
                Download
              </Button>
            </li>
          ))}
        </ul>
      </div>
      {transcriptContent && (
        <div className="mt-4">
          <h3>Transcript Content</h3>
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
