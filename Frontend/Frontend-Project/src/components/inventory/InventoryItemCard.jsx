import React from 'react';

function InventoryItemCard({ item, onQuickAdd, onQuickRemove, onAdjustClick, onViewLogs, currentWorkerId }) {
  // Determine stock status color
  const getStockStatus = () => {
    if (item.quantity === 0) return 'red';
    if (item.quantity <= 10) return 'yellow';
    return 'green';
  };

  const stockStatus = getStockStatus();
  const statusColors = {
    red: 'bg-red-900/20 border-red-700/50',
    yellow: 'bg-yellow-900/20 border-yellow-700/50',
    green: 'bg-green-900/20 border-green-700/50'
  };

  return (
    <div className={`rounded-lg p-4 border ${statusColors[stockStatus]} transition-all duration-200 hover:scale-[1.02]`}>
      {/* Item Header */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-white truncate">{item.name}</h3>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            stockStatus === 'green' ? 'bg-green-800/50 text-green-300' :
            stockStatus === 'yellow' ? 'bg-yellow-800/50 text-yellow-300' :
            'bg-red-800/50 text-red-300'
          }`}>
            {item.quantity} in stock
          </span>
        </div>
        {item.description && (
          <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg mb-3">
          <div className="text-center">
            <p className="text-gray-400 text-xs">Current</p>
            <p className="text-white font-bold text-xl">{item.quantity}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onQuickRemove(item)}
              disabled={item.quantity <= 0}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                item.quantity <= 0 
                  ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                  : 'bg-red-600 hover:bg-red-700 hover:scale-105'
              }`}
            >
              -1
            </button>
            <button
              onClick={() => onQuickAdd(item)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold hover:scale-105 transition-all"
            >
              +1
            </button>
          </div>
        </div>

        {/* Custom Adjustment Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => onAdjustClick(item, 'remove')}
            disabled={item.quantity <= 0}
            className={`py-2 rounded-lg transition-all ${
              item.quantity <= 0 
                ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                : 'bg-red-700 hover:bg-red-800 hover:scale-105'
            }`}
          >
            Remove Stock
          </button>
          <button
            onClick={() => onAdjustClick(item, 'add')}
            className="py-2 bg-green-700 hover:bg-green-800 rounded-lg hover:scale-105 transition-all"
          >
            Add Stock
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-700 pt-3">
        <div className="flex justify-between items-center text-sm mb-3">
          <div>
            <span className="text-gray-400">Price:</span>
            <span className="text-white ml-2">${item.price_cash || '0.00'}</span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className={`ml-2 ${
              item.available ? 'text-green-400' : 'text-red-400'
            }`}>
              {item.available ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
        
        {/* View Logs Button */}
        <button
          onClick={() => onViewLogs(item)}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-all hover:scale-105"
        >
          View Inventory Logs
        </button>
      </div>
    </div>
  );
}

export default InventoryItemCard;