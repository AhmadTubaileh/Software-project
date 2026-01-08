import React, { useState, useEffect } from 'react';
import WorkerDropdown from '../TaskManagement/WorkerDropdown.jsx';

const AddTaskModal = ({ projectId, workers, currentUser, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    assigned_to: '',
    task: '',
    priority: 'medium',
    estimated_time_minutes: '',
    start_time: '',
    end_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [dismissedConflicts, setDismissedConflicts] = useState(false);

  const calculateEstimatedTime = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMinutes = Math.round((end - start) / (1000 * 60));
    
    return diffMinutes > 0 ? diffMinutes : '';
  };

  // Check for scheduling conflicts
  const checkForConflicts = async (workerId, startTime, endTime) => {
    if (!workerId || !startTime || !endTime) {
      setConflicts([]);
      return;
    }

    setCheckingConflicts(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/worker/${workerId}/conflicts?start_time=${startTime}&end_time=${endTime}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setConflicts(data);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const handleTimeChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value
    };

    // Auto-calculate estimated time when both start and end times are set
    if (newFormData.start_time && newFormData.end_time) {
      const estimatedMinutes = calculateEstimatedTime(newFormData.start_time, newFormData.end_time);
      newFormData.estimated_time_minutes = estimatedMinutes;
    }

    setFormData(newFormData);

    // Check for conflicts when all time data is available
    if (newFormData.assigned_to && newFormData.start_time && newFormData.end_time) {
      checkForConflicts(newFormData.assigned_to, newFormData.start_time, newFormData.end_time);
    }
  };

  const handleWorkerChange = (workerId) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: workerId
    }));

    // Check for conflicts when worker is selected and times are set
    if (workerId && formData.start_time && formData.end_time) {
      checkForConflicts(workerId, formData.start_time, formData.end_time);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.assigned_to || !formData.task.trim()) {
      alert('Please fill all required fields');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      alert('Please set both start and end times');
      return;
    }

    const start = new Date(formData.start_time);
    const end = new Date(formData.end_time);
    if (end <= start) {
      alert('End time must be after start time');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        estimated_time_minutes: formData.estimated_time_minutes ? parseInt(formData.estimated_time_minutes) : null,
        assigned_to: parseInt(formData.assigned_to),
        start_time: formData.start_time,
        end_time: formData.end_time
      });
      // Clear conflicts after successful submission
      setConflicts([]);
      setDismissedConflicts(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatTimeDisplay = (minutes) => {
    if (!minutes) return 'Not calculated';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700/50 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <WorkerDropdown
            value={formData.assigned_to}
            onChange={(e) => handleWorkerChange(e.target.value)}
            workers={workers}
            label="Assign To *"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Task Description *
            </label>
            <textarea
              value={formData.task}
              onChange={(e) => handleChange('task', e.target.value)}
              rows="4"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Describe the task in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estimated Time (auto-calculated)
              </label>
              <div className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white">
                {formatTimeDisplay(formData.estimated_time_minutes)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Calculated from start and end times
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleTimeChange('end_time', e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Conflict Warning */}
          {conflicts.length > 0 && !dismissedConflicts && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 relative">
              <button
                type="button"
                onClick={() => setDismissedConflicts(true)}
                className="absolute top-2 right-2 text-orange-400 hover:text-orange-300 transition-colors text-lg"
                title="Dismiss warning"
              >
                ✕
              </button>
              <div className="flex items-center gap-2 text-orange-300 mb-3">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold text-base">Scheduling Conflict Detected</span>
              </div>
              <div className="text-sm text-orange-200 space-y-3">
                <p className="font-medium">
                  This worker has <span className="font-bold text-orange-300">{conflicts.length}</span> conflicting task(s) during this time period.
                </p>
                <div className="bg-orange-500/20 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {conflicts.map((conflict, index) => (
                    <div key={index} className="bg-gray-800/50 rounded p-3 border border-orange-500/20">
                      <div className="font-medium text-orange-200 mb-1">{conflict.task}</div>
                      <div className="text-xs text-orange-300/80 space-y-1">
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>
                            {new Date(conflict.start_time).toLocaleDateString()} - {new Date(conflict.end_time).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>⏰</span>
                          <span>
                            {new Date(conflict.start_time).toLocaleTimeString()} - {new Date(conflict.end_time).toLocaleTimeString()}
                          </span>
                        </div>
                        {conflict.status && (
                          <div className="flex items-center gap-2">
                            <span>📊</span>
                            <span className="capitalize">{conflict.status.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-orange-300/70 italic">
                  You can still create the task, but the worker will have overlapping assignments.
                </p>
              </div>
            </div>
          )}

          {/* Time Information */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-300 mb-2">
              <span>⏱️</span>
              <span className="font-medium">Time Information</span>
            </div>
            <div className="text-sm text-blue-200 space-y-1">
              <div>Start: {formData.start_time ? new Date(formData.start_time).toLocaleString() : 'Not set'}</div>
              <div>End: {formData.end_time ? new Date(formData.end_time).toLocaleString() : 'Not set'}</div>
              <div>Estimated Duration: {formatTimeDisplay(formData.estimated_time_minutes)}</div>
              {checkingConflicts && (
                <div className="text-orange-300">Checking for scheduling conflicts...</div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.estimated_time_minutes}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;