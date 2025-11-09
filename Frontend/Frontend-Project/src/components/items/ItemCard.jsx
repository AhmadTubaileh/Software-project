import React from 'react';

function ItemCard({ item, onEdit, onDelete, onViewImage }) {
  const getImageSrc = () => {
    if (item.item_image) {
      return typeof item.item_image === 'string'
        ? `data:image/jpeg;base64,${item.item_image}`
        : URL.createObjectURL(item.item_image);
    }
    return null;
  };

  const imageSrc = getImageSrc();

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
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Cash Price:</span>
            <span className="text-white">${item.price_cash}</span>
          </div>
          
          {item.price_installment_total && (
            <div className="flex justify-between">
              <span className="text-gray-400">Installment Total:</span>
              <span className="text-white">${item.price_installment_total}</span>
            </div>
          )}
          
          {item.installment_first_payment > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">First Payment:</span>
              <span className="text-white">${item.installment_first_payment}</span>
            </div>
          )}
          
          {item.installment_per_month && (
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly Payment:</span>
              <span className="text-white">${item.installment_per_month}</span>
            </div>
          )}
          
          {item.installment_months > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Installment Months:</span>
              <span className="text-white">{item.installment_months}</span>
            </div>
          )}
          
          <div className="flex justify-between">
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
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm transition-all duration-200 hover:scale-105"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded text-sm transition-all duration-200 hover:scale-105"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default ItemCard;