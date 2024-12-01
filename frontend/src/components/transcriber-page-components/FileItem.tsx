import React from "react";
import Button from "../Button";

interface FileItemProps {
  filename: string;
  onView: (filename: string) => void;
  onDownload: (filename: string) => void;
  onDelete: (filename: string) => void;
}

const FileItem: React.FC<FileItemProps> = ({ filename, onView, onDownload, onDelete }) => {
  return (
    <div className="flex items-center justify-between mt-2">
      <span>{filename}</span>
      <div>
        <Button onClick={() => onView(filename)} variant="secondary" className="mr-2">
          View
        </Button>
        <Button onClick={() => onDownload(filename)} variant="secondary" className="mr-2">
          Download
        </Button>
        <Button onClick={() => onDelete(filename)} variant="danger">
          Delete
        </Button>
      </div>
    </div>
  );
};

export default FileItem;
