import React from 'react';
import DateInput from '../AdminDutyHours/DateInput.jsx';

const DateFilters = ({ filter, setFilter, onGenerateReport, isLoading }) => {
  const handleStartDateChange = (e) => {
    setFilter(prev => ({ ...prev, startDate: e.target.value }));
  };

  const handleEndDateChange = (e) => {
    setFilter(prev => ({ ...prev, endDate: e.target.value }));
  };

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
        
        <div>
          <button
            onClick={onGenerateReport}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <span>📊</span>
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateFilters;