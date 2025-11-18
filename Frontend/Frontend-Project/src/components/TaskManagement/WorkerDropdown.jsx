import React, { useState } from 'react';

const WorkerDropdown = ({ value, onChange, workers, label = "Assign To" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedWorker = workers.find(worker => worker.id.toString() === value);

  const handleSelect = (workerId) => {
    onChange({ target: { value: workerId } });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-left text-white focus:outline-none focus:border-blue-500 transition-all duration-200 hover:bg-gray-600/50 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          {selectedWorker ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {selectedWorker.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="font-medium text-white">{selectedWorker.username}</div>
                <div className="text-xs text-gray-400">Level {selectedWorker.user_type}</div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-gray-400">
                👥
              </div>
              <span className="text-gray-400">Select a worker</span>
            </div>
          )}
        </div>
        
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="p-3 border-b border-gray-700/50 bg-gray-900/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-sm">👥</span>
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Select Worker</h4>
                <p className="text-gray-400 text-xs">{workers.length} team members</p>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto py-1">
            {workers.map((worker) => (
              <button
                key={worker.id}
                type="button"
                onClick={() => handleSelect(worker.id.toString())}
                className={`w-full text-left p-3 transition-all duration-200 group border-l-2 ${
                  value === worker.id.toString()
                    ? 'bg-blue-500/20 border-blue-500' 
                    : 'border-transparent hover:bg-gray-700/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {worker.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${
                      value === worker.id.toString() 
                        ? 'text-blue-300' 
                        : 'text-white group-hover:text-white'
                    }`}>
                      {worker.username}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">Level {worker.user_type}</span>
                      <span className="text-gray-500">•</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                        worker.user_type === 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : worker.user_type <= 3
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {worker.user_type === 0 ? 'Admin' : 
                         worker.user_type <= 3 ? 'Senior' : 'Junior'}
                      </span>
                    </div>
                  </div>
                  {value === worker.id.toString() && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-700/50 bg-gray-900/50">
            <div className="text-center text-xs text-gray-400">
              {selectedWorker ? `Selected: ${selectedWorker.username}` : 'Choose a team member'}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default WorkerDropdown;