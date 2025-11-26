import React from 'react';
import StatusDropdown from './StatusDropdown.jsx';

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
  completed: {
    container: 'bg-green-500/20 border-green-500/30',
    text: 'text-green-300',
    dot: 'bg-green-400',
    gradient: 'from-green-500/10 to-emerald-500/10',
    progress: 'bg-green-500'
  }
};

const TaskCard = ({ task, onStatusChange, onDropdownToggle, isDropdownOpen, hasOpenDropdown }) => {
  const styles = statusStyles[task.status];

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
              {task.status.replace('_', ' ')}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-gray-100 transition-colors">
            {task.task}
          </h3>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
              <span className="text-gray-400">👤</span>
              <span className="text-gray-300">Assigned by <span className="font-medium text-white">{task.assigned_by_name}</span></span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
              <span className="text-gray-400">📅</span>
              <span className="text-gray-300">{new Date(task.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 ml-4">
          <StatusDropdown 
            task={task} 
            onStatusChange={onStatusChange}
            onDropdownToggle={onDropdownToggle}
            isOpen={isDropdownOpen}
          />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 bg-black/20 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
              styles.progress
            } ${
              task.status === 'completed' ? 'w-full' :
              task.status === 'in_progress' ? 'w-2/3' :
              'w-1/3'
            }`}
          />
        </div>
        <span className={`text-xs font-medium ${styles.text} min-w-12 text-right`}>
          {task.status === 'completed' ? '100% Complete' :
            task.status === 'in_progress' ? 'In Progress' :
            'Just Started'}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;