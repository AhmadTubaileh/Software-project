import React from 'react';

function ItemHeader({ searchQuery, onSearchChange, onAddItem, availableFilter, onAvailableFilterChange }) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Item Management</h1>
          <p className="text-gray-400 mt-2">Manage inventory items and their details</p>
        </div>
        <button
          onClick={onAddItem}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
        >
          <span>+</span> Add Item
        </button>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={availableFilter}
            onChange={onAvailableFilterChange}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500 min-w-[150px]"
          >
            <option value="all">All Availability</option>
            <option value="1">Available</option>
            <option value="0">Not Available</option>
          </select>
        </div>
      </div>
    </>
  );
}

export default ItemHeader;
