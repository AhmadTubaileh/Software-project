import React from 'react';
import DateInput from '../AdminDutyHours/DateInput.jsx';

const DateFilters = ({ filter, setFilter, isLoading }) => {
  const handleStartDateChange = (e) => {
    setFilter(prev => ({ ...prev, startDate: e.target.value }));
  };

  const handleEndDateChange = (e) => {
    setFilter(prev => ({ ...prev, endDate: e.target.value }));
  };

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <DateInput
          label="Start Date"
          value={filter.startDate}
          onChange={handleStartDateChange}
          type="start"
        />
        
        <DateInput
          label="End Date"
          value={filter.endDate}
          onChange={handleEndDateChange}
          type="end"
        />
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading sessions...
        </div>
      )}
    </div>
  );
};

export default DateFilters;