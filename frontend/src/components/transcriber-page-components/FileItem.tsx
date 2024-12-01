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
    <div 
      className="flex items-center justify-between mt-2"
      role="listitem"
      aria-label={`Transcript file: ${filename}`}
    >
      <span id={`filename-${filename}`}>{filename}</span>
      <div role="group" aria-label={`Actions for ${filename}`}>
        <Button 
          onClick={() => onView(filename)} 
          variant="secondary" 
          className="mr-2"
          ariaLabel={`View transcript for ${filename}`}
        >
          View
        </Button>
        <Button 
          onClick={() => onDownload(filename)} 
          variant="secondary" 
          className="mr-2"
          ariaLabel={`Download transcript for ${filename}`}
        >
          Download
        </Button>
        <Button 
          onClick={() => onDelete(filename)} 
          variant="danger"
          ariaLabel={`Delete transcript for ${filename}`}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default FileItem;
