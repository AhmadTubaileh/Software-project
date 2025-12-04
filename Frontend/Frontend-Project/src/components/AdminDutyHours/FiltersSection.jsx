import React from 'react';
import EmployeeDropdown from './EmployeeDropdown.jsx';
import DateInput from './DateInput.jsx';

const FiltersSection = ({ filter, setFilter, workers, isLoading }) => {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
      </div>
      
      {isLoading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading sessions...
        </div>
      )}
    </div>
  );
};

export default FiltersSection;