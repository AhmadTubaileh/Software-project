import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const TaskFiles = ({ taskId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [taskId]);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/files`);
      const data = await response.json();
      
      if (response.ok) {
        setFiles(data);
      } else {
        toast.error('Failed to load files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Error loading files');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons = {
      pdf: '📕',
      doc: '📘',
      docx: '📘',
      xls: '📗',
      xlsx: '📗',
      txt: '📄',
      csv: '📊',
      zip: '📦',
      rar: '📦',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      webp: '🖼️',
      svg: '🖼️'
    };
    return icons[ext] || '📄';
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-400">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-sm mt-2">Loading files...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-600 rounded-lg">
        <div className="text-2xl mb-2">📎</div>
        <p>No files uploaded yet</p>
        <p className="text-xs mt-1">Upload files to share your work</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400 font-medium">Uploaded Files ({files.length})</div>
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:border-gray-500 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-2xl">
              {getFileIcon(file.file_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate" title={file.file_name}>
                {file.file_name}
              </div>
              <div className="text-gray-400 text-xs flex flex-wrap gap-2 mt-1">
                <span>By {file.uploaded_by_name}</span>
                <span>•</span>
                <span>{formatFileSize(file.file_size)}</span>
                <span>•</span>
                <span>{formatDate(file.uploaded_at)}</span>
              </div>
            </div>
          </div>
          <a
            href={`http://localhost:5000${file.file_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition-colors whitespace-nowrap"
          >
            Download
          </a>
        </div>
      ))}
    </div>
  );
};

export default TaskFiles;