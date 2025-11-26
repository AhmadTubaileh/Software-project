import React, { useRef, useEffect } from 'react';

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

const StatusDropdown = ({ task, onStatusChange, onDropdownToggle, isOpen }) => {
  const dropdownRef = useRef(null);
  const currentStatus = statusOptions.find(opt => opt.value === task.status);

  const handleTriggerClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    onDropdownToggle(task.id, !isOpen);
  };

  const handleOptionClick = (newStatus) => {
    onStatusChange(task.id, newStatus);
    onDropdownToggle(task.id, false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onDropdownToggle(task.id, false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when dropdown is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, task.id, onDropdownToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={handleTriggerClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg ${
          statusStyles[task.status].container
        } ${statusStyles[task.status].text} group relative z-30`}
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

      {/* Dropdown Menu with Backdrop */}
      {isOpen && (
        <>
          {/* Invisible backdrop that covers entire screen but allows dropdown clicks */}
          <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => onDropdownToggle(task.id, false)}
          />
          
          {/* Dropdown Menu - Higher z-index than backdrop */}
          <div 
            className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dropdown
          >
            <div className="p-3 border-b border-gray-600 bg-gray-750">
              <h4 className="font-semibold text-white text-sm">Update Status</h4>
              <p className="text-gray-300 text-xs">Change task progress</p>
            </div>
            
            <div className="p-2 space-y-1 bg-gray-800">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                    task.status === option.value
                      ? `${statusStyles[option.value].container} ${statusStyles[option.value].text}`
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                      task.status === option.value 
                        ? 'bg-white/20' 
                        : 'bg-gray-700 group-hover:bg-gray-600'
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
        </>
      )}
    </div>
  );
};

export default StatusDropdown;