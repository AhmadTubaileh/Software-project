import React from 'react';

function ItemCard({ item, onEdit, onUpdate, onDelete, onViewImage, onViewPriceHistory, onDuplicate, isAdmin }) {
  const getImageSrc = () => {
    if (item.item_image) {
      return typeof item.item_image === 'string'
        ? `data:image/jpeg;base64,${item.item_image}`
        : URL.createObjectURL(item.item_image);
    }
    return null;
  };

  const imageSrc = getImageSrc();

  // Calculate profit
  const calculateProfit = () => {
    if (!item.price_cash || !item.buy_price) return null;
    const profit = parseFloat(item.price_cash) - parseFloat(item.buy_price);
    const profitPercentage = (profit / parseFloat(item.buy_price)) * 100;
    return { profit, profitPercentage };
  };

  const profit = calculateProfit();

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:scale-105 transform-gpu">
      {/* Image Section with Click to View */}
      <div className="mb-4 relative">
        {imageSrc ? (
          <div 
            className="cursor-pointer group relative overflow-hidden rounded-lg border-2 border-gray-600"
            onClick={() => onViewImage(item)}
          >
            <img
              src={imageSrc}
              alt={item.name}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 px-3 py-1 rounded-lg text-sm">
                Click to view
              </span>
            </div>
          </div>
        ) : (
          <div 
            className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center text-6xl cursor-pointer hover:bg-gray-600 transition-colors duration-200"
            onClick={() => onViewImage(item)}
          >
            📦
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-white mb-1">{item.name}</h3>
          <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
          {item.branch_name && (
            <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
              <span>🏢</span> {item.branch_name}
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {/* Price Information */}
          <div className="flex justify-between">
            <span className="text-gray-400">Sell Price:</span>
            <span className="text-white">${item.price_cash}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Buy Price:</span>
            <span className="text-orange-400">${item.buy_price}</span>
          </div>
          
          {/* Profit Display */}
          {profit && (
            <div className="flex justify-between bg-gray-900 p-2 rounded">
              <span className="text-gray-400">Profit:</span>
              <div className="text-right">
                <span className="text-green-400 font-medium">${profit.profit.toFixed(2)}</span>
                <span className="text-green-300 text-xs ml-2">({profit.profitPercentage.toFixed(1)}%)</span>
              </div>
            </div>
          )}
          
          {item.on_sale_price && (
            <div className="flex justify-between">
              <span className="text-gray-400">Sale Price:</span>
              <span className="text-green-400">${item.on_sale_price}</span>
            </div>
          )}
          
          {/* Installment Information */}
          {item.price_installment_total && (
            <div className="space-y-1 mt-2 pt-2 border-t border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Installment Total:</span>
                <span className="text-white">${item.price_installment_total}</span>
              </div>
              
              {item.installment_first_payment > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Down Payment:</span>
                  <span className="text-white">${item.installment_first_payment}</span>
                </div>
              )}
              
              {item.installment_months > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Months:</span>
                  <span className="text-white">{item.installment_months}</span>
                </div>
              )}
              
              {item.installment_per_month > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Payment:</span>
                  <span className="text-white">${item.installment_per_month}</span>
                </div>
              )}
              
              {item.installment_last_payment > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Payment:</span>
                  <span className="text-white">${item.installment_last_payment}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Stock Information */}
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-700">
            <span className="text-gray-400">Quantity:</span>
            <span className={`font-medium ${item.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {item.quantity}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Available:</span>
            <span className={`font-medium ${item.available ? 'text-green-400' : 'text-red-400'}`}>
              {item.available ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Installment:</span>
            <span className={`font-medium ${item.installment ? 'text-blue-400' : 'text-gray-400'}`}>
              {item.installment ? 'Available' : 'Not Available'}
            </span>
          </div>
          
          {/* Updated Information */}
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Last Updated:</span>
              <span className="text-gray-400">{formatDate(item.price_date)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">By:</span>
              <span className="text-gray-400">{item.updated_by || 'System'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700 flex-wrap">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm transition-all duration-200 hover:scale-105"
        >
          Edit
        </button>
        <button
          onClick={() => onUpdate(item)}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 py-2 rounded text-sm transition-all duration-200 hover:scale-105"
        >
          Update
        </button>
        {isAdmin && (
          <button
            onClick={() => onDuplicate(item)}
            className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded text-sm transition-all duration-200 hover:scale-105"
            title="Duplicate item to another branch"
          >
            Duplicate
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded text-sm transition-all duration-200 hover:scale-105"
        >
          Delete
        </button>
      </div>
      
      {/* Price History Button */}
      <button
        onClick={() => onViewPriceHistory(item)}
        className="w-full mt-2 bg-purple-600 hover:bg-purple-700 py-2 rounded text-sm transition-all duration-200 hover:scale-105"
      >
        View Price History
      </button>
    </div>
  );
}

export default ItemCard;