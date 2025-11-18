import React from 'react';
import EmployeeDropdown from './EmployeeDropdown.jsx';
import DateInput from './DateInput.jsx';

const FiltersSection = ({ filter, setFilter, workers, fetchDutyHours, isLoading }) => {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <EmployeeDropdown
          filter={filter}
          setFilter={setFilter}
          workers={workers}
        />

        <DateInput
          label="Start Date"
          value={filter.startDate}
          onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
          type="start"
        />

        <DateInput
          label="End Date"
          value={filter.endDate}
          onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
          type="end"
        />

        <div>
          <button
            onClick={fetchDutyHours}
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
                <span>🔍</span>
                Apply Filters
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersSection;