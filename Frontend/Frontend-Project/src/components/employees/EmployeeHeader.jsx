import React from 'react';

function EmployeeHeader({ searchQuery, onSearchChange, onAddEmployee, levelFilter, onLevelFilterChange }) {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Employee Management</h1>
          <p className="text-gray-400 mt-2">Manage your team members and their access levels</p>
        </div>
        <button
          onClick={onAddEmployee}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
        >
          <span>+</span> Add Employee
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Level Filter */}
        <div className="flex gap-4">
          <select
            value={levelFilter}
            onChange={onLevelFilterChange}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500 min-w-[150px]"
          >
            <option value="all">All Levels</option>
            <option value="0">Level 0</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
            <option value="5">Level 5</option>
            <option value="6">Level 6</option>
            <option value="7">Level 7</option>
            <option value="8">Level 8</option>
            <option value="9">Level 9</option>
            <option value="10">Level 10</option>
          </select>
        </div>
      </div>
    </>
  );
}

export default EmployeeHeader;