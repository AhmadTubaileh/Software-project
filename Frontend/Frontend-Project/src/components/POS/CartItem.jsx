import React from 'react';

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const hasCustomPrice = item.price_cash !== item.original_price;
  const itemTotal = item.price_cash * item.qty;
  const originalTotal = item.original_price * item.qty;

  return (
    <div
      className={`bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 ${
        hasCustomPrice ? 'border-l-4 border-l-green-500' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium truncate">{item.name}</h4>
          <div className="text-sm">
            {hasCustomPrice ? (
              <div>
                <span className="text-green-400">${item.price_cash} </span>
                <span className="text-gray-400 line-through text-xs">
                  (was ${item.original_price})
                </span>
              </div>
            ) : (
              <span className="text-gray-300">${item.price_cash} each</span>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 text-lg transition-colors duration-200 ml-2"
        >
          ✕
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(item.qty - 1)}
            className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center hover:bg-gray-500"
          >
            -
          </button>
          <span className="font-medium w-8 text-center">{item.qty}</span>
          <button
            onClick={() => onUpdateQuantity(item.qty + 1)}
            disabled={item.qty >= item.quantity}
            className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center hover:bg-gray-500 disabled:opacity-50"
          >
            +
          </button>
        </div>
        <div className="text-right">
          <p className="font-semibold">${itemTotal.toFixed(2)}</p>
          {hasCustomPrice && (
            <p className="text-xs text-gray-400 line-through">
              ${originalTotal.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;