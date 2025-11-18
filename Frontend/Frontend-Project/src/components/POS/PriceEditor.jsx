import React from 'react';

const PriceEditor = ({ priceEdit, setPriceEdit, onSave, onCancel, originalPrice }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">$</span>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={priceEdit}
          onChange={(e) => setPriceEdit(e.target.value)}
          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
          placeholder="Enter sale price"
          autoFocus
        />
      </div>
      <div className="flex gap-1">
        <button
          onClick={onSave}
          className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors duration-200"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Original: ${originalPrice}
      </p>
    </div>
  );
};

export default PriceEditor;