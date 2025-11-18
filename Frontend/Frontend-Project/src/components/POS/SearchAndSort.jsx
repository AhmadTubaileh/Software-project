import React from 'react';

const SearchAndSort = ({ query, setQuery, sortBy, setSortBy }) => {
  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        placeholder="Search products by name or description..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="flex-1 px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
      />
      <select
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
      >
        <option value="relevance">Relevance</option>
        <option value="price-asc">Price: Low → High</option>
        <option value="price-desc">Price: High → Low</option>
      </select>
    </div>
  );
};

export default SearchAndSort;