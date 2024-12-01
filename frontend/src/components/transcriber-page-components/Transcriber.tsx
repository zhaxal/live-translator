/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Button from "../Button";
import FileItem from "./FileItem";

import { host } from "../../utils/backend";

function Transcriber() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [transcriptContent, setTranscriptContent] = useState("");
  const [statuses, setStatuses] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchTranscripts(), fetchStatuses()]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTranscripts = async () => {
    try {
      const response = await fetch(`${host}/transcripts`);
      const data = await response.json();
      setTranscripts(data.transcripts);
    } catch (error) {
      console.error("Error fetching transcripts:", error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch(`${host}/transcription-status`);
      const data = await response.json();
      setStatuses(data.statuses);
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsUploading(true);
      const response = await fetch(`${host}/upload`, {
        method: "POST",
        body: formData,
      });
      await response.json();
      alert("File uploaded successfully");
      setSelectedFile(null);
      await Promise.all([fetchTranscripts(), fetchStatuses()]);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  const loadTranscript = async (filename: string) => {
    try {
      const response = await fetch(
        `${host}/transcripts/${filename}`
      );
      const text = await response.text();
      setTranscriptContent(text);
    } catch (error) {
      console.error("Error loading transcript:", error);
    }
  };

  const downloadTranscript = (filename: string) => {
    const link = document.createElement("a");
    link.href = `${host}/transcripts/${filename}`;
    link.download = filename;
    link.click();
  };

  const deleteTranscript = async (filename: string) => {
    try {
      await fetch(`${host}/transcripts/${filename}`, {
        method: "DELETE",
      });
      alert("Transcript deleted");
      fetchTranscripts();
    } catch (error) {
      console.error("Error deleting transcript:", error);
    }
  };

  return (
    <div>
      <div className="mt-4" role="region" aria-labelledby="file-upload-heading">
        <h2 className="text-2xl font-bold" id="file-upload-heading">
          File Transcriber
        </h2>
        <div className="mt-4">
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.aac"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="border border-gray-300 p-2"
            disabled={isUploading}
            aria-label="Choose audio file to transcribe"
            role="button"
          />
          <Button
            onClick={uploadFile}
            className="ml-2"
            disabled={isUploading || !selectedFile}
            ariaLabel={
              isUploading
                ? "Uploading file..."
                : "Upload and transcribe selected file"
            }
          >
            {isUploading ? "Uploading..." : "Upload and Transcribe"}
          </Button>
          <Button
            onClick={fetchInitialData}
            className="ml-2"
            variant="secondary"
            disabled={isUploading}
            ariaLabel="Refresh transcription data"
          >
            Refetch Data
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4">Loading...</div>
      ) : (
        <>
          <div
            className="mt-4"
            role="region"
            aria-label="Transcription Queue Status"
          >
            <h3 className="text-xl font-bold" id="queue-status">
              Transcription Queue Status
            </h3>
            {statuses.length === 0 ? (
              <p role="status">No active transcriptions</p>
            ) : (
              <ul role="list" aria-labelledby="queue-status">
                {statuses.map((item) => (
                  <li
                    key={item.id}
                    className="mt-2"
                    role="status"
                    aria-label={`${item.filename} status: ${item.status}`}
                  >
                    <span className="font-semibold">{item.filename}:</span>{" "}
                    {item.status}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-bold">Available Transcripts</h3>
            {transcripts.length === 0 ? (
              <p>No transcripts available</p>
            ) : (
              transcripts.map((filename) => (
                <FileItem
                  key={filename}
                  filename={filename}
                  onView={loadTranscript}
                  onDownload={downloadTranscript}
                  onDelete={deleteTranscript}
                />
              ))
            )}
          </div>
        </>
      )}

      {transcriptContent && (
        <div
          className="mt-4"
          role="region"
          aria-labelledby="transcript-content-heading"
        >
          <h3 className="text-xl font-bold" id="transcript-content-heading">
            Transcript Content
          </h3>
          <textarea
            className="w-full h-64 mt-2 p-2 border border-gray-300 rounded-md resize-none"
            value={transcriptContent}
            readOnly
            aria-label="Transcript content"
            role="textbox"
          />
        </div>
      )}
    </div>
  );
}

export default Transcriber;
