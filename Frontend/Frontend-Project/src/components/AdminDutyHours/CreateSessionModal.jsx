import React, { useState, useEffect } from 'react';

const CreateSessionModal = ({ newSession, setNewSession, workers, onCreate, onClose, currentUser }) => {
  const [timeSlots, setTimeSlots] = useState({
    inTime: { hour: '09', minute: '00', period: 'AM' },
    outTime: { hour: '05', minute: '00', period: 'PM' }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to add one day to a date
  const addOneDay = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateString;
    }
  };

  // Initialize with default date (+1 day from today)
  useEffect(() => {
    const today = new Date();
    const defaultDate = addOneDay(today.toISOString().split('T')[0]);
    
    setNewSession(prev => ({
      ...prev,
      date: defaultDate
    }));
  }, [setNewSession]);

  // Parse time string (HH:MM:SS) to time object
  const parseTimeString = (timeString) => {
    if (!timeString) return null;
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours);
      
      return {
        hour: String(hourNum % 12 || 12).padStart(2, '0'),
        minute: minutes || '00',
        period: hourNum >= 12 ? 'PM' : 'AM'
      };
    } catch (error) {
      return null;
    }
  };

  // Convert time object to time string (HH:MM:SS)
  const timeToTimeString = (timeObj) => {
    if (!timeObj) return '';
    
    let hour24 = parseInt(timeObj.hour);
    
    if (timeObj.period === 'PM' && hour24 < 12) {
      hour24 += 12;
    } else if (timeObj.period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${String(hour24).padStart(2, '0')}:${timeObj.minute}:00`;
  };

  // Handle time change
  const handleTimeChange = (field, type, value) => {
    setTimeSlots(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value
      }
    }));
  };

  // Handle date change
  const handleDateChange = (e) => {
    setNewSession(prev => ({
      ...prev,
      date: e.target.value
    }));
  };

  // Handle other input changes
  const handleInputChange = (field, value) => {
    setNewSession(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!newSession.user_id) {
      newErrors.user_id = 'Employee is required';
    }

    if (!newSession.date) {
      newErrors.date = 'Date is required';
    }

    const inTimeStr = timeToTimeString(timeSlots.inTime);
    const outTimeStr = timeToTimeString(timeSlots.outTime);

    if (!inTimeStr) {
      newErrors.in_time = 'Start time is required';
    }

    if (outTimeStr && inTimeStr) {
      const inDateTime = new Date(`${newSession.date} ${inTimeStr}`);
      const outDateTime = new Date(`${newSession.date} ${outTimeStr}`);
      
      if (outDateTime <= inDateTime) {
        newErrors.out_time = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const inTimeStr = timeToTimeString(timeSlots.inTime);
      const outTimeStr = timeToTimeString(timeSlots.outTime);

      const sessionData = {
        user_id: newSession.user_id,
        session_type: newSession.session_type,
        date: newSession.date,
        in_time: inTimeStr,
        out_time: outTimeStr,
        notes: newSession.notes,
        update_by: currentUser?.id
      };

      await onCreate(sessionData);
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Time options
  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return { value: String(hour).padStart(2, '0'), label: String(hour).padStart(2, '0') };
  });

  const minutes = Array.from({ length: 60 }, (_, i) => {
    return { value: String(i).padStart(2, '0'), label: String(i).padStart(2, '0') };
  });

  const periods = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
  ];

  // Professional Dropdown Components
  const TimeDropdown = ({ value, onChange, options, placeholder, className = "" }) => (
    <select
      value={value}
      onChange={onChange}
      className={`w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem'
      }}
    >
      <option value="" disabled className="bg-gray-800">{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value} className="bg-gray-800">
          {option.label}
        </option>
      ))}
    </select>
  );

  const EmployeeDropdown = ({ value, onChange, options, placeholder, className = "" }) => (
    <select
      value={value}
      onChange={onChange}
      className={`w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem'
      }}
      required
    >
      <option value="" disabled className="bg-gray-800">{placeholder}</option>
      {options.map(worker => (
        <option key={worker.id} value={worker.id} className="bg-gray-800">
          {worker.username} (Level {worker.user_type})
        </option>
      ))}
    </select>
  );

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'No date set';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700/50 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400 text-lg">➕</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Create New Session
              </h2>
              <p className="text-gray-400 text-sm">
                Add a new duty session for an employee
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-gray-800 rounded-lg"
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Employee & Session Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Employee * {errors.user_id && (
                    <span className="text-red-400 text-xs ml-2">• {errors.user_id}</span>
                  )}
                </label>
                <EmployeeDropdown
                  value={newSession.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  options={workers}
                  placeholder="Select Employee"
                />
              </div>

              {/* Session Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Session Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('session_type', 'work')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium ${
                      newSession.session_type === 'work' 
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10' 
                        : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                    }`}
                  >
                    💼 Work
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('session_type', 'break')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium ${
                      newSession.session_type === 'break' 
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/10' 
                        : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                    }`}
                  >
                    ☕ Break
                  </button>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Session Date * {errors.date && (
                  <span className="text-red-400 text-xs ml-2">• {errors.date}</span>
                )}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={newSession.date}
                  onChange={handleDateChange}
                  className="w-full bg-gray-800/50 border-2 border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <div className="bg-gray-800/50 border-2 border-gray-600/50 rounded-lg p-3">
                  <div className="text-white font-semibold text-sm">
                    {formatDisplayDate(newSession.date)}
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">Time Schedule</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Start Time */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Start Time * {errors.in_time && (
                      <span className="text-red-400 text-xs ml-2">• {errors.in_time}</span>
                    )}
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <TimeDropdown
                          value={timeSlots.inTime.hour}
                          onChange={(e) => handleTimeChange('inTime', 'hour', e.target.value)}
                          options={hours}
                          placeholder="HH"
                        />
                      </div>
                      <span className="text-gray-400 text-lg font-medium mx-1">:</span>
                      <div className="flex-1">
                        <TimeDropdown
                          value={timeSlots.inTime.minute}
                          onChange={(e) => handleTimeChange('inTime', 'minute', e.target.value)}
                          options={minutes}
                          placeholder="MM"
                        />
                      </div>
                      <div className="flex-1">
                        <TimeDropdown
                          value={timeSlots.inTime.period}
                          onChange={(e) => handleTimeChange('inTime', 'period', e.target.value)}
                          options={periods}
                          placeholder="AM"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-800/30 rounded px-3 py-2">
                      <span className="text-green-400 font-medium">Output:</span> {timeToTimeString(timeSlots.inTime) || '--:--:--'}
                    </div>
                  </div>
                </div>

                {/* End Time */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    End Time {errors.out_time && (
                      <span className="text-red-400 text-xs ml-2">• {errors.out_time}</span>
                    )}
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <TimeDropdown
                          value={timeSlots.outTime.hour}
                          onChange={(e) => handleTimeChange('outTime', 'hour', e.target.value)}
                          options={hours}
                          placeholder="HH"
                        />
                      </div>
                      <span className="text-gray-400 text-lg font-medium mx-1">:</span>
                      <div className="flex-1">
                        <TimeDropdown
                          value={timeSlots.outTime.minute}
                          onChange={(e) => handleTimeChange('outTime', 'minute', e.target.value)}
                          options={minutes}
                          placeholder="MM"
                        />
                      </div>
                      <div className="flex-1">
                        <TimeDropdown
                          value={timeSlots.outTime.period}
                          onChange={(e) => handleTimeChange('outTime', 'period', e.target.value)}
                          options={periods}
                          placeholder="PM"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-800/30 rounded px-3 py-2">
                      <span className="text-green-400 font-medium">Output:</span> {timeToTimeString(timeSlots.outTime) || '--:--:--'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">Additional Notes</h3>
              </div>
              <textarea
                value={newSession.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows="3"
                placeholder="Enter any notes or comments about this session..."
                className="w-full bg-gray-800/50 border-2 border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              />
            </div>

            {/* Data Format Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center">
                  <span className="text-blue-400 text-xs">ℹ️</span>
                </div>
                <h4 className="text-sm font-medium text-blue-300">Data Format</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-blue-400 font-medium">Date</div>
                  <div className="text-blue-300">{newSession.date}</div>
                </div>
                <div>
                  <div className="text-blue-400 font-medium">Start Time</div>
                  <div className="text-blue-300">{timeToTimeString(timeSlots.inTime) || '--:--:--'}</div>
                </div>
                <div>
                  <div className="text-blue-400 font-medium">End Time</div>
                  <div className="text-blue-300">{timeToTimeString(timeSlots.outTime) || '--:--:--'}</div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Created by:</span>
              <span className="text-white font-medium">{currentUser?.username}</span>
              <span className="text-gray-500">•</span>
              <span>ID: {currentUser?.id}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create Session'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSessionModal;