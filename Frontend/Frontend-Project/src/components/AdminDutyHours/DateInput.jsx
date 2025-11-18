import React, { useRef, useState, useEffect } from 'react';

const DateInput = ({ label, value, onChange, type = 'start' }) => {
  const dateInputRef = useRef(null);
  const containerRef = useRef(null);
  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    // Ensure the input is properly positioned after mount
    if (containerRef.current && dateInputRef.current && !isPositioned) {
      const containerRect = containerRef.current.getBoundingClientRect();
      dateInputRef.current.style.position = 'fixed';
      dateInputRef.current.style.top = `${containerRect.top}px`;
      dateInputRef.current.style.left = `${containerRect.left}px`;
      dateInputRef.current.style.width = `${containerRect.width}px`;
      dateInputRef.current.style.height = `${containerRect.height}px`;
      setIsPositioned(true);
    }
  }, [isPositioned]);

  const handleClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const handleDateChange = (e) => {
    onChange(e);
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      
      {/* Hidden but properly positioned date input */}
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        onChange={handleDateChange}
        className="opacity-0 cursor-pointer z-20"
        style={{ 
          position: 'fixed',
          pointerEvents: 'none'
        }}
      />
      
      {/* Custom date display container */}
      <div 
        ref={containerRef}
        onClick={handleClick}
        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white transition-colors duration-200 cursor-pointer hover:bg-gray-600/50 group relative z-10"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-300 group-hover:text-white transition-colors">
            {formatDisplayDate(value)}
          </span>
          
          {/* Calendar Icon */}
          <div className="flex items-center gap-1 text-gray-400 group-hover:text-blue-400 transition-colors">
            <span className="text-lg">📅</span>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateInput;