import React, { useState } from 'react';

const SearchBySaleId = ({ onSearch, loading }) => {
  const [saleId, setSaleId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!saleId.trim()) {
      return;
    }
    onSearch(saleId.trim());
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🔢</span>
        Search by Sale ID
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Sale ID Number
          </label>
          <input
            type="number"
            value={saleId}
            onChange={(e) => setSaleId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
            placeholder="Enter Sale ID"
            min="1"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !saleId.trim()}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
            loading || !saleId.trim()
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Searching...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🔍 Search Sale
            </span>
          )}
        </button>
      </form>
      
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Instructions:</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Enter the exact Sale ID number</li>
          <li>• Shows all cash and retrieve records for that sale</li>
          <li>• Only cash records can be selected for return</li>
          <li>• Installment sales are excluded</li>
        </ul>
      </div>
    </div>
  );
};

// Make sure this export is at the bottom
export default SearchBySaleId;