import React from 'react';

function EmployeeHeader({ searchQuery, onSearchChange, onAddEmployee }) {
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

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search employees by name or email..."
          value={searchQuery}
          onChange={onSearchChange}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
        />
      </div>
    </>
  );
}

export default EmployeeHeader;