// components/POS/SearchAndSort.jsx
import React from 'react';

const SearchAndSort = ({ query, setQuery, sortBy, setSortBy }) => {
  return (
    <div className="mb-6">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 placeholder-gray-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors duration-200"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">📊</span>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="appearance-none pl-10 pr-8 py-3 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 cursor-pointer"
          >
            <option value="relevance" className="bg-gray-800">Relevance</option>
            <option value="price-asc" className="bg-gray-800">Price: Low → High</option>
            <option value="price-desc" className="bg-gray-800">Price: High → Low</option>
            <option value="name-asc" className="bg-gray-800">Name: A → Z</option>
            <option value="name-desc" className="bg-gray-800">Name: Z → A</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500">▼</span>
          </div>
        </div>
      </div>
      
      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={() => setQuery('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            query === '' 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Products
        </button>
        {/*<button
          onClick={() => setQuery('phone')}
          className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-full text-sm font-medium hover:bg-gray-700 transition-all duration-200"
        >
          📱 Phones
        </button>
        <button
          onClick={() => setQuery('laptop')}
          className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-full text-sm font-medium hover:bg-gray-700 transition-all duration-200"
        >
          💻 Laptops
        </button>*/}
        <button
          onClick={() => setQuery('sale')}
          className="px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 rounded-full text-sm font-medium hover:from-orange-500/30 hover:to-red-500/30 transition-all duration-200 border border-orange-500/30"
        >
          🔥 On Sale
        </button>
      </div>
    </div>
  );
};

export default SearchAndSort;