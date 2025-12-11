import React from 'react';

function BranchHeader({ searchQuery, onSearchChange, onAddBranch, sortBy, onSortChange, stats }) {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Branch Management</h1>
          <p className="text-gray-400 mt-2">Manage store locations and their details</p>
        </div>
        <button
          onClick={onAddBranch}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
        >
          <span>🏢</span> Add Branch
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search branches by name, address, or phone..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Sort Options */}
        <div className="flex gap-4">
          <select
            value={sortBy}
            onChange={onSortChange}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500 min-w-[150px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>
      </div>
    </>
  );
}

export default BranchHeader;