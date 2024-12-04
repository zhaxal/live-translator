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
      className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 rounded-lg"
      role="listitem"
      aria-label={`Transcript file: ${filename}`}
    >
      <span 
        id={`filename-${filename}`}
        className="text-sm md:text-base font-medium mb-3 md:mb-0 break-all"
      >
        {filename}
      </span>
      <div 
        role="group" 
        aria-label={`Actions for ${filename}`}
        className="flex flex-col md:flex-row w-full md:w-auto gap-2 md:gap-1"
      >
        <Button 
          onClick={() => onView(filename)} 
          variant="secondary" 
          className="md:mr-2"
          fullWidth
          ariaLabel={`View transcript for ${filename}`}
        >
          View
        </Button>
        <Button 
          onClick={() => onDownload(filename)} 
          variant="secondary" 
          className="md:mr-2"
          fullWidth
          ariaLabel={`Download transcript for ${filename}`}
        >
          Download
        </Button>
        <Button 
          onClick={() => onDelete(filename)} 
          variant="danger"
          fullWidth
          ariaLabel={`Delete transcript for ${filename}`}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default FileItem;
