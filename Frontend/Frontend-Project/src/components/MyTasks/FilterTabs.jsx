import React from 'react';

const FilterTabs = ({ filter, setFilter, counts }) => {
  const filterOptions = [
    { value: 'all', label: 'All Tasks', emoji: '📋', count: counts.all },
    { value: 'pending', label: 'Pending', emoji: '⏳', count: counts.pending },
    { value: 'in_progress', label: 'In Progress', emoji: '🔄', count: counts.in_progress },
    { value: 'completed', label: 'Completed', emoji: '✅', count: counts.completed }
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-8 p-1 bg-gray-800/30 rounded-2xl border border-gray-700/50 w-fit">
      {filterOptions.map((filterOption) => (
        <button
          key={filterOption.value}
          onClick={() => setFilter(filterOption.value)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            filter === filterOption.value
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
              : 'hover:bg-gray-700/50 border border-transparent'
          }`}
        >
          <span className="text-lg">{filterOption.emoji}</span>
          <div className="text-left">
            <div className="font-medium text-sm">{filterOption.label}</div>
            <div className={`text-xs ${
              filter === filterOption.value ? 'text-blue-300' : 'text-gray-400'
            }`}>
              {filterOption.count} tasks
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;