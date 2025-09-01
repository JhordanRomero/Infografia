import React, { useRef, useState } from 'react';
import Icon from './Icon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };


  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group w-full max-w-lg cursor-pointer border-4 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 ${isDragging ? 'border-true-blue bg-true-blue/10' : 'border-gray-300 hover:border-true-blue hover:bg-sky-blue/20'}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="application/pdf"
      />
       <div className="flex flex-col items-center justify-center">
            <Icon name="upload_file" className={`text-6xl text-gray-400 transition-colors group-hover:text-true-blue ${isDragging ? 'text-true-blue' : ''}`} />
            <p className="mt-4 text-xl font-semibold text-bentonville-blue">
              Arrastra y Suelta tu PDF aquí
            </p>
            <p className="text-gray-500">o haz clic para buscar</p>
        </div>
    </div>
  );
};

export default FileUpload;