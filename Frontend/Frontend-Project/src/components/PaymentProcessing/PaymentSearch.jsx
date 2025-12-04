import React from 'react';

const PaymentSearch = ({ searchTerm, setSearchTerm, loading, onSearch, searchType, setSearchType }) => {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 mb-6">
      <h2 className="text-xl font-semibold mb-4">Search Customer Contracts</h2>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Type Selector */}
        <div className="flex-shrink-0">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 w-full md:w-auto"
          >
            <option value="name">Customer Name</option>
            <option value="id_card">ID Card Number</option>
          </select>
        </div>
        
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              searchType === 'name' 
                ? "Enter customer name..." 
                : "Enter ID card number..."
            }
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        
        {/* Search Button */}
        <button
          onClick={onSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 flex-shrink-0"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Searching...
            </>
          ) : (
            '🔍 Search'
          )}
        </button>
      </div>
      
      {/* Search Hint */}
      <p className="text-xs text-gray-400 mt-3">
        {searchType === 'name' 
          ? '💡 Search by customer full name (partial matches allowed)' 
          : '💡 Search by exact ID card number (requires complete number)'}
      </p>
    </div>
  );
};

export default PaymentSearch;