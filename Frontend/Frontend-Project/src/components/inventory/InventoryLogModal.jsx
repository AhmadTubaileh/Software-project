import React from 'react';

function InventoryLogModal({ isOpen, logs, loading, onClose }) {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeColor = (type) => {
    switch(type) {
      case 'add': return 'text-green-400';
      case 'remove': return 'text-red-400';
      case 'sale': return 'text-blue-400';
      case 'return': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getChangeTypeText = (type) => {
    switch(type) {
      case 'add': return 'Stock Added';
      case 'remove': return 'Stock Removed';
      case 'sale': return 'Sold';
      case 'return': return 'Returned';
      default: return type;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Inventory Logs</h2>
              <p className="text-gray-400">Recent stock adjustments</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading inventory logs...</p>
            </div>
          )}

          {/* Logs Table */}
          {!loading && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3">Worker</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Item</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr 
                      key={log.id} 
                      className="border-b border-gray-700 hover:bg-gray-800/50"
                    >
                      <td className="px-6 py-4">
                        {formatDate(log.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">{log.worker_name}</span>
                        <br/>
                        <span className="text-xs text-gray-500">ID: {log.worker_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getChangeTypeColor(log.change_type)}`}>
                          {getChangeTypeText(log.change_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${
                          log.change_type === 'add' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {log.change_type === 'add' ? '+' : '-'}{log.quantity_changed}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">{log.item_name}</span>
                        <br/>
                        <span className="text-xs text-gray-500">ID: {log.item_id}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Summary */}
              <div className="mt-4 p-3 bg-gray-800 rounded text-sm">
                <p className="text-gray-400">
                  Total entries: <strong className="text-white">{logs.length}</strong>
                </p>
                <div className="grid grid-cols-4 gap-4 mt-2 text-xs">
                  <div className="text-center p-2 bg-green-900/30 rounded">
                    <div className="text-green-400 font-bold">
                      {logs.filter(l => l.change_type === 'add').length}
                    </div>
                    <div>Additions</div>
                  </div>
                  <div className="text-center p-2 bg-red-900/30 rounded">
                    <div className="text-red-400 font-bold">
                      {logs.filter(l => l.change_type === 'remove').length}
                    </div>
                    <div>Removals</div>
                  </div>
                  <div className="text-center p-2 bg-blue-900/30 rounded">
                    <div className="text-blue-400 font-bold">
                      {logs.filter(l => l.change_type === 'sale').length}
                    </div>
                    <div>Sales</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-900/30 rounded">
                    <div className="text-yellow-400 font-bold">
                      {logs.filter(l => l.change_type === 'return').length}
                    </div>
                    <div>Returns</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && logs.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg">No inventory logs found</p>
              <p className="text-sm">Logs will appear after stock adjustments</p>
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryLogModal;