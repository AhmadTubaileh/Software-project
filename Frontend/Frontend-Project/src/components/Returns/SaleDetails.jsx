import React from 'react';

const SaleDetails = ({ saleData, onSelectCashRecord }) => {
  if (!saleData || !saleData.items || saleData.items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-4">📄</div>
          <p>No sale details available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Sale #{saleData.saleId}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {saleData.totalItems} unique items
            </p>
          </div>
          <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg border border-blue-500/30">
            <span className="text-blue-400 font-bold">Cash Sale</span>
          </div>
        </div>
      </div>
      
      {/* Items List */}
      <div className="overflow-y-auto max-h-[500px]">
        {saleData.items.map((item, index) => (
          <div 
            key={item.item_id} 
            className={`p-6 ${index < saleData.items.length - 1 ? 'border-b border-gray-700' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{item.item_name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{item.item_description}</p>
              </div>
              
              {/* Available for Return Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                item.available_for_return > 0
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gradient-to-r from-gray-600/20 to-gray-700/20 text-gray-400 border border-gray-600/30'
              }`}>
                Available: {item.available_for_return}
              </div>
            </div>
            
            {/* Quantity Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400">Original</p>
                <p className="text-xl font-bold text-blue-400">{item.original_quantity}</p>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400">Returned</p>
                <p className="text-xl font-bold text-orange-400">{item.returned_quantity}</p>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400">Remaining</p>
                <p className={`text-xl font-bold ${
                  item.available_for_return > 0 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {item.available_for_return}
                </p>
              </div>
            </div>
            
            {/* Cash Records (Can be returned) */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <span>💰</span>
                Cash Sale Records
              </h4>
              
              {item.cash_records.map((record) => (
                <div 
                  key={record.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    item.available_for_return > 0
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/50 hover:border-blue-500 hover:shadow-lg'
                      : 'bg-gray-900/50 border-gray-600 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (item.available_for_return > 0) {
                      onSelectCashRecord(record, item);
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">Quantity: {record.quantity}</p>
                      <p className="text-sm text-gray-400">
                        Price: ${record.price} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">Worker: {record.worker_name}</p>
                    </div>
                  </div>
                  
                  {item.available_for_return > 0 ? (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-green-400">
                        Click to return this record
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                        SELECT
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-500">
                      No items available for return from this record
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Retrieve Records (Previous returns) */}
            {item.retrieve_records.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <span>🔄</span>
                  Previous Returns
                </h4>
                <div className="mt-2 space-y-2">
                  {item.retrieve_records.map((record) => (
                    <div 
                      key={record.id}
                      className="p-2 bg-gray-900/30 rounded border border-gray-700"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Returned: {record.quantity}</span>
                        <span className="text-gray-400">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Processed by: {record.worker_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Make sure this export is at the bottom
export default SaleDetails;