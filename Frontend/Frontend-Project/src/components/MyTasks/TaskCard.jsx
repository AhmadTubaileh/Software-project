import React, { useState } from 'react';
import StatusDropdown from './StatusDropdown.jsx';
import FileUpload from './FileUpload.jsx';
import TaskFiles from './TaskFiles.jsx';

const statusStyles = {
  pending: {
    container: 'bg-yellow-500/20 border-yellow-500/30',
    text: 'text-yellow-300',
    dot: 'bg-yellow-400',
    gradient: 'from-yellow-500/10 to-amber-500/10',
    progress: 'bg-yellow-500'
  },
  in_progress: {
    container: 'bg-blue-500/20 border-blue-500/30',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    progress: 'bg-blue-500'
  },
  ready_for_review: {
    container: 'bg-purple-500/20 border-purple-500/30',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
    gradient: 'from-purple-500/10 to-pink-500/10',
    progress: 'bg-purple-500'
  },
  approved: {
    container: 'bg-green-500/20 border-green-500/30',
    text: 'text-green-300',
    dot: 'bg-green-400',
    gradient: 'from-green-500/10 to-emerald-500/10',
    progress: 'bg-green-500'
  },
  completed: {
    container: 'bg-gray-500/20 border-gray-500/30',
    text: 'text-gray-300',
    dot: 'bg-gray-400',
    gradient: 'from-gray-500/10 to-gray-500/10',
    progress: 'bg-gray-500'
  }
};

const priorityStyles = {
  low: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-300 border-red-500/30'
};

const TaskCard = ({ task, onStatusChange, onFileUpload, onDropdownToggle, isDropdownOpen, hasOpenDropdown, currentUser }) => {
  const [showFiles, setShowFiles] = useState(false);
  
  // Use default styles if task status is not found
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

  return (
    <div
      className={`bg-gradient-to-r ${styles.gradient} rounded-2xl p-6 border transition-all duration-300 group relative ${
        hasOpenDropdown && !isDropdownOpen 
          ? 'opacity-30 pointer-events-none' 
          : 'hover:scale-[1.02] hover:shadow-xl'
      } ${
        isDropdownOpen ? 'z-30 scale-[1.02] shadow-2xl' : 'z-10'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${styles.dot} animate-pulse`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${styles.text}`}>
              {task.status.replace(/_/g, ' ')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs border ${priorityStyle}`}>
              {task.priority}
            </span>
            {task.project_title && (
              <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300 border border-gray-500/30">
                {task.project_title}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-gray-100 transition-colors">
            {task.task}
          </h3>
          
          {/* Time Information */}
          <div className="flex flex-wrap gap-4 text-sm mb-3">
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
              <span className="text-gray-400">👤</span>
              <span className="text-gray-300">Assigned by <span className="font-medium text-white">{task.assigned_by_name}</span></span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
              <span className="text-gray-400">📅</span>
              <span className="text-gray-300">{new Date(task.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              })}</span>
            </div>
            {task.estimated_time_minutes && (
              <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                <span className="text-gray-400">⏱️</span>
                <span className="text-gray-300">Est: {formatTime(task.estimated_time_minutes)}</span>
              </div>
            )}
            {task.actual_time_minutes && (
              <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                <span className="text-gray-400">⏰</span>
                <span className="text-gray-300">Actual: {formatTime(task.actual_time_minutes)}</span>
              </div>
            )}
          </div>

          {/* Rejection Notes */}
          {task.rejection_notes && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 text-red-300 mb-1">
                <span>⚠️</span>
                <span className="font-semibold">Revision Required</span>
              </div>
              <p className="text-red-200 text-sm">{task.rejection_notes}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 ml-4">
          <StatusDropdown 
            task={task} 
            onStatusChange={onStatusChange}
            onDropdownToggle={onDropdownToggle}
            isOpen={isDropdownOpen}
            currentUser={currentUser}
          />
        </div>
      </div>

      {/* File Upload Section */}
      {(task.status === 'in_progress' || task.status === 'ready_for_review') && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <span>📎</span>
              <span className="text-sm">
                {showFiles ? 'Hide Files' : 'Show Files'} 
                {task.file_count > 0 && ` (${task.file_count})`}
              </span>
            </button>
            {task.status === 'in_progress' && (
              <FileUpload onFileUpload={(file) => onFileUpload(task.id, file)} />
            )}
          </div>
          {showFiles && <TaskFiles taskId={task.id} />}
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 bg-black/20 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
              styles.progress
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${styles.text} min-w-12 text-right`}>
          {task.status === 'completed' ? '100% Complete' :
           task.status === 'approved' ? 'Approved' :
           task.status === 'ready_for_review' ? 'Ready for Review' :
           task.status === 'in_progress' ? 'In Progress' :
           'Not Started'}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;