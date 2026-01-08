import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { apiClient } from '../shared/api/apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import './MobilePage.css';

function MobileMyTasks() {
  const { currentUser } = useLocalSession();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch tasks assigned to current user
  const fetchMyTasks = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const data = await apiClient.get(`/api/tasks/my-tasks/${currentUser.id}`);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // Update task status with smart workflow
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      if (newStatus === 'ready_for_review') {
        const response = await apiClient.put(`/api/tasks/${taskId}/submit`, {
          user_id: currentUser.id
        });
        toast.success(response.message || 'Task submitted for review');
      } else {
        await apiClient.put(`/api/tasks/${taskId}/status`, {
          status: newStatus,
          user_id: currentUser.id
        });
        toast.success('Task status updated!');
      }
      setOpenDropdownId(null);
      fetchMyTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error(error.message || 'Failed to update task status');
    }
  };

  // Handle file upload
  const handleFileUpload = async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaded_by', currentUser.id);

      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/files`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      toast.success('File uploaded successfully!');
      fetchMyTasks();
      return Promise.resolve();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
      return Promise.reject(error);
    }
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (taskId, isOpen) => {
    if (isOpen) {
      setOpenDropdownId(taskId);
    } else {
      setOpenDropdownId(null);
    }
  };

  // Filter tasks - EXCLUDE completed tasks
  const filteredTasks = tasks.filter(task => {
    if (task.status === 'completed') return false;
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // Calculate counts for each filter - EXCLUDE completed tasks
  const calculateCounts = () => {
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    
    return {
      all: activeTasks.length,
      pending: activeTasks.filter(task => task.status === 'pending').length,
      in_progress: activeTasks.filter(task => task.status === 'in_progress').length,
      ready_for_review: activeTasks.filter(task => task.status === 'ready_for_review').length
    };
  };

  const counts = calculateCounts();

  // Helper function to get role name
  const getRoleName = (userType) => {
    switch(userType) {
      case 0: return 'Administrator';
      case 1: return 'Senior Manager';
      case 2: return 'Manager';
      case 3: return 'Supervisor';
      case 4: return 'Employee';
      case 5: return 'Trainee';
      default: return 'User';
    }
  };

  if (!currentUser) {
    return (
      <div className="mobile-page">
        <div className="mobile-page-content">
          <div className="text-center py-8 text-gray-400">
            Please log in to view your tasks
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mobile-page">
        <div className="mobile-page-content">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page">
      <Toaster position="top-center" />
      <div className="mobile-page-header">
        <h1 className="mobile-page-title">My Tasks</h1>
        <p className="text-sm text-gray-400 mt-1">
          {currentUser?.username} ({getRoleName(currentUser?.user_type ?? 5)})
        </p>
      </div>
      
      <div className="mobile-page-content">
        {/* Filter Tabs */}
        <div className="mobile-filter-tabs">
          {[
            { value: 'all', label: 'All', emoji: '📋', count: counts.all },
            { value: 'pending', label: 'Pending', emoji: '⏳', count: counts.pending },
            { value: 'in_progress', label: 'In Progress', emoji: '🔄', count: counts.in_progress },
            { value: 'ready_for_review', label: 'Review', emoji: '📤', count: counts.ready_for_review }
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`mobile-filter-tab ${filter === filterOption.value ? 'active' : ''}`}
            >
              <span className="mr-1">{filterOption.emoji}</span>
              <span>{filterOption.label}</span>
              <span className="ml-1 text-xs opacity-75">({filterOption.count})</span>
            </button>
          ))}
        </div>

        {/* Summary Stats - Enhanced */}
        {tasks.length > 0 && (
          <div className="mobile-card" style={{ 
            marginBottom: '20px', 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.1)'
          }}>
            <div className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span>Active Tasks Summary</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                <div className="text-xl font-bold text-white mb-1">{counts.all}</div>
                <div className="text-xs text-gray-400 font-medium">Total</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20">
                <div className="text-xl font-bold text-yellow-300 mb-1">{counts.pending}</div>
                <div className="text-xs text-gray-400 font-medium">Pending</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-blue-500/10 backdrop-blur-sm border border-blue-500/20">
                <div className="text-xl font-bold text-blue-300 mb-1">{counts.in_progress}</div>
                <div className="text-xs text-gray-400 font-medium">Active</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-purple-500/10 backdrop-blur-sm border border-purple-500/20">
                <div className="text-xl font-bold text-purple-300 mb-1">{counts.ready_for_review}</div>
                <div className="text-xs text-gray-400 font-medium">Review</div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="mobile-empty-state">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-gray-400 text-center">
              {filter === 'all' ? 'No active tasks assigned' : `No ${filter.replace('_', ' ')} tasks`}
            </div>
          </div>
        ) : (
          <div className="mobile-task-list">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onFileUpload={handleFileUpload}
                onDropdownToggle={handleDropdownToggle}
                isDropdownOpen={openDropdownId === task.id}
                hasOpenDropdown={!!openDropdownId}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onStatusChange, onFileUpload, onDropdownToggle, isDropdownOpen, hasOpenDropdown, currentUser }) {
  const [showFiles, setShowFiles] = useState(false);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const statusStyles = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-400', progress: 'bg-yellow-500' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400', progress: 'bg-blue-500' },
    ready_for_review: { bg: 'bg-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400', progress: 'bg-purple-500' },
    approved: { bg: 'bg-green-500/20', text: 'text-green-300', dot: 'bg-green-400', progress: 'bg-green-500' }
  };

  const priorityStyles = {
    low: 'bg-gray-500/20 text-gray-300',
    medium: 'bg-blue-500/20 text-blue-300',
    high: 'bg-orange-500/20 text-orange-300',
    critical: 'bg-red-500/20 text-red-300'
  };

  const styles = statusStyles[task.status] || statusStyles.pending;
  const priorityStyle = priorityStyles[task.priority] || priorityStyles.medium;

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressPercentage = () => {
    switch (task.status) {
      case 'pending': return 0;
      case 'in_progress': return 50;
      case 'ready_for_review': return 75;
      case 'approved': return 90;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const statusOptions = [
    { 
      value: 'in_progress', 
      label: 'Start Working', 
      emoji: '🔄',
      allowedFrom: ['pending']
    },
    { 
      value: 'ready_for_review', 
      label: 'Submit for Review', 
      emoji: '📤',
      allowedFrom: ['in_progress']
    }
  ];

  const availableOptions = statusOptions.filter(option => 
    option.allowedFrom.includes(task.status)
  );

  // Fetch files when showing files
  useEffect(() => {
    if (showFiles && (task.status === 'in_progress' || task.status === 'ready_for_review')) {
      fetchFiles();
    }
  }, [showFiles, task.id, task.status]);

  const fetchFiles = async () => {
    try {
      setLoadingFiles(true);
      const data = await apiClient.get(`/api/tasks/${task.id}/files`);
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    try {
      await onFileUpload(task.id, file);
      fetchFiles();
    } catch (error) {
      // Error already handled in parent
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons = {
      pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗',
      txt: '📄', csv: '📊', zip: '📦', rar: '📦',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️'
    };
    return icons[ext] || '📄';
  };

  return (
    <div
      className={`mobile-card ${hasOpenDropdown && !isDropdownOpen ? 'opacity-50' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${styles.bg.replace('/20', '/10')} 0%, ${styles.bg.replace('/20', '/5')} 100%)`,
        borderColor: styles.bg.replace('/20', '/30')
      }}
    >
      <div className="mobile-task-header">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className={`w-2 h-2 rounded-full ${styles.dot}`} style={{ animation: 'pulse 2s infinite' }} />
            <span className={`text-xs font-semibold uppercase ${styles.text}`}>
              {task.status.replace(/_/g, ' ')}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs border ${priorityStyle}`}>
              {task.priority}
            </span>
            {task.project_title && (
              <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-300 border border-gray-500/30">
                {task.project_title}
              </span>
            )}
          </div>
          
          <h3 className="mobile-task-title">{task.task}</h3>
          
          {/* Task Details */}
          <div className="flex flex-wrap gap-3 text-xs mb-3 mt-2">
            <div className="flex items-center gap-1 text-gray-400">
              <span>👤</span>
              <span>By {task.assigned_by_name}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span>📅</span>
              <span>{new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            {task.estimated_time_minutes && (
              <div className="flex items-center gap-1 text-gray-400">
                <span>⏱️</span>
                <span>Est: {formatTime(task.estimated_time_minutes)}</span>
              </div>
            )}
            {task.actual_time_minutes && (
              <div className="flex items-center gap-1 text-gray-400">
                <span>⏰</span>
                <span>Actual: {formatTime(task.actual_time_minutes)}</span>
              </div>
            )}
          </div>

          {/* Rejection Notes */}
          {task.rejection_notes && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-3">
              <div className="flex items-center gap-1 text-red-300 mb-1">
                <span>⚠️</span>
                <span className="font-semibold text-xs">Revision Required</span>
              </div>
              <p className="text-red-200 text-xs">{task.rejection_notes}</p>
            </div>
          )}
        </div>
        
        {/* Status Dropdown */}
        <div className="relative">
          {availableOptions.length > 0 ? (
            <button
              onClick={() => onDropdownToggle(task.id, !isDropdownOpen)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium ${styles.bg} ${styles.text} border-current`}
            >
              {task.status === 'pending' ? '⏳' : task.status === 'in_progress' ? '🔄' : '📤'}
              <span className="ml-1 hidden sm:inline">{task.status.replace('_', ' ')}</span>
            </button>
          ) : (
            <span className={`px-3 py-2 rounded-lg border text-xs ${styles.bg} ${styles.text} border-current opacity-50`}>
              {task.status.replace('_', ' ')}
            </span>
          )}

          {/* Dropdown Menu */}
          {isDropdownOpen && availableOptions.length > 0 && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => onDropdownToggle(task.id, false)}
              />
              <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50">
                <div className="p-2 space-y-1">
                  {availableOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onStatusChange(task.id, option.value);
                        onDropdownToggle(task.id, false);
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{option.emoji}</span>
                        <span className="font-medium text-sm">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Upload Section */}
      {(task.status === 'in_progress' || task.status === 'ready_for_review') && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <span>📎</span>
              <span>{showFiles ? 'Hide Files' : 'Show Files'}</span>
              {files.length > 0 && <span className="text-xs">({files.length})</span>}
            </button>
            {task.status === 'in_progress' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-xs hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : '+ Upload'}
              </button>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z"
          />

          {showFiles && (
            <div className="mt-2">
              {loadingFiles ? (
                <div className="text-center py-4 text-gray-400 text-sm">Loading files...</div>
              ) : files.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm border border-dashed border-gray-600 rounded-lg">
                  <div className="text-2xl mb-2">📎</div>
                  <p>No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600/50"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xl">{getFileIcon(file.file_name)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{file.file_name}</div>
                          <div className="text-gray-400 text-xs">
                            {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`http://localhost:5000${file.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-xs hover:bg-blue-500/30 transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 bg-black/20 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-1.5 rounded-full transition-all duration-1000 ${styles.progress}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${styles.text} min-w-16 text-right`}>
          {getProgressPercentage()}%
        </span>
      </div>
    </div>
  );
}

export default MobileMyTasks;
