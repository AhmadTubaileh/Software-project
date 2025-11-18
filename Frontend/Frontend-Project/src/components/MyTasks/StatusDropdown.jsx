import React, { useState } from 'react';

const statusStyles = {
  pending: {
    container: 'bg-yellow-500/20 border-yellow-500/30',
    text: 'text-yellow-300',
    dot: 'bg-yellow-400'
  },
  in_progress: {
    container: 'bg-blue-500/20 border-blue-500/30',
    text: 'text-blue-300',
    dot: 'bg-blue-400'
  },
  completed: {
    container: 'bg-green-500/20 border-green-500/30',
    text: 'text-green-300',
    dot: 'bg-green-400'
  }
};

const statusOptions = [
  { 
    value: 'pending', 
    label: 'Pending', 
    emoji: '⏳',
    description: 'Task is waiting to be started',
    color: 'yellow'
  },
  { 
    value: 'in_progress', 
    label: 'In Progress', 
    emoji: '🔄',
    description: 'Currently working on this task',
    color: 'blue'
  },
  { 
    value: 'completed', 
    label: 'Completed', 
    emoji: '✅',
    description: 'Task has been finished',
    color: 'green'
  }
];

const StatusDropdown = ({ task, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStatus = statusOptions.find(opt => opt.value === task.status);

  const handleOptionClick = (newStatus) => {
    onStatusChange(task.id, newStatus);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg ${
          statusStyles[task.status].container
        } ${statusStyles[task.status].text} group`}
      >
        <span className="text-sm">{currentStatus.emoji}</span>
        <span className="font-medium text-sm capitalize">
          {task.status.replace('_', ' ')}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-10 overflow-hidden">
          <div className="p-3 border-b border-gray-700/50">
            <h4 className="font-semibold text-white text-sm">Update Status</h4>
            <p className="text-gray-400 text-xs">Change task progress</p>
          </div>
          
          <div className="p-2 space-y-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                  task.status === option.value
                    ? `${statusStyles[option.value].container} ${statusStyles[option.value].text}`
                    : 'hover:bg-gray-700/50 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                    task.status === option.value 
                      ? 'bg-white/20' 
                      : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                  }`}>
                    {option.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{option.label}</span>
                      {task.status === option.value && (
                        <div className={`w-2 h-2 rounded-full ${statusStyles[option.value].dot}`} />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 group-hover:text-gray-300">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default StatusDropdown;