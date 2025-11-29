import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';

const FileUpload = ({ onFileUpload }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not allowed. Please upload images, PDFs, or documents.');
      return;
    }

    setUploading(true);
    try {
      await onFileUpload(file);
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
          uploading 
            ? 'border-blue-400 bg-blue-500/10 cursor-not-allowed' 
            : isDragging 
            ? 'border-green-400 bg-green-500/10' 
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/20'
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleInputChange}
          disabled={uploading}
          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z"
        />
        
        {uploading ? (
          <div className="text-blue-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm">Uploading file...</p>
          </div>
        ) : (
          <div className="text-gray-400">
            <div className="text-3xl mb-3">📎</div>
            <p className="text-sm font-medium mb-1">Click or drag files to upload</p>
            <p className="text-xs text-gray-500">
              Supports: Images, PDF, Word, Excel, Text files
            </p>
            <p className="text-xs text-gray-500 mt-1">Max size: 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;