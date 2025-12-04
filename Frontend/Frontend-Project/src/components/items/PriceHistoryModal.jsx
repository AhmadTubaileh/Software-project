import React from 'react';

function PriceHistoryModal({ isOpen, itemId, priceHistory, loading, onClose }) {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `$${parseFloat(amount).toFixed(2)}`;
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
              <h2 className="text-2xl font-bold text-white">Price History</h2>
              <p className="text-gray-400">Item ID: {itemId}</p>
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
              <p className="mt-4 text-gray-400">Loading price history...</p>
            </div>
          )}

          {/* Price History Table */}
          {!loading && priceHistory.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-400">
                
                    <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                    <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Updated By</th>
                        <th className="px-6 py-3">Sell Price</th>
                        <th className="px-6 py-3">Buy Price</th>
                        <th className="px-6 py-3">Installment Total</th>
                        <th className="px6 py-3">Down Payment</th>
                        <th className="px-6 py-3">Months</th>
                        <th className="px-6 py-3">Monthly</th>
                        <th className="px-6 py-3">Last Payment</th>
                        <th className="px-6 py-3">Sale Price</th>
                    </tr>
                    </thead>
                <tbody>
                  {priceHistory.map((price, index) => (
                    <tr 
                      key={price.id} 
                      className={`border-b border-gray-700 ${
                        index === 0 ? 'bg-green-900 bg-opacity-20' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        {formatDate(price.date)}
                      </td>
                      <td className="px-6 py-4">
                        {price.updated_by || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {formatCurrency(price.price_cash)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(price.price_installment_total)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(price.installment_first_payment)}
                      </td>
                      <td className="px-6 py-4">
                        {price.installment_months || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(price.installment_per_month)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(price.installment_last_payment)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(price.on_sale_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Legend */}
              <div className="mt-4 p-3 bg-gray-800 rounded text-sm">
                <p className="text-gray-400">
                  <span className="inline-block w-3 h-3 bg-green-900 mr-2"></span>
                  <strong>Green row</strong> indicates the current active price
                </p>
                <p className="text-gray-400 mt-1">
                  Total history entries: <strong>{priceHistory.length}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && priceHistory.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg">No price history found</p>
              <p className="text-sm">Price history will appear after updates</p>
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

export default PriceHistoryModal;