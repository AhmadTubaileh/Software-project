// components/POS/CartItem.jsx
import React from 'react';

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const hasCustomPrice = item.price_cash !== item.original_price;
  const itemTotal = item.price_cash * item.qty;
  const originalTotal = item.original_price * item.qty;
  const isOnSale = item.on_sale_price && item.on_sale_price < item.price_cash;

  // Format price safely
  const formatPrice = (price) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  return (
    <div
      className={`relative bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
        hasCustomPrice ? 'border-l-4 border-l-green-500' : 'border-gray-700'
      } ${isOnSale ? 'border-r-2 border-r-orange-500' : ''}`}
    >
      {/* Sale Indicator */}
      {isOnSale && (
        <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
          SALE
        </div>
      )}

      {/* Custom Price Indicator */}
      {hasCustomPrice && (
        <div className="absolute -top-1 -left-1 px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full">
          EDITED
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <div className={`p-2 rounded-lg ${isOnSale ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}>
              {isOnSale ? '🔥' : '📦'}
            </div>
            <div>
              <h4 className="font-bold text-white truncate">{item.name}</h4>
              <div className="text-sm">
                {hasCustomPrice ? (
                  <div>
                    <span className="text-green-400 font-semibold">
                      ${formatPrice(item.price_cash)} 
                    </span>
                    <span className="text-gray-400 line-through text-xs ml-2">
                      was ${formatPrice(item.original_price)}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-300">${formatPrice(item.price_cash)} each</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="ml-2 p-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg text-white text-sm transition-all duration-200 shadow-md hover:shadow-lg"
          title="Remove from cart"
        >
          ✕ Remove
        </button>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(item.qty - 1)}
            className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center hover:from-gray-600 hover:to-gray-700 text-white font-bold shadow-md transition-all duration-200 hover:scale-105"
          >
            −
          </button>
          <div className="w-10 h-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
            <span className="font-bold text-white">{item.qty}</span>
          </div>
          <button
            onClick={() => onUpdateQuantity(item.qty + 1)}
            disabled={item.qty >= item.quantity}
            className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center hover:from-gray-600 hover:to-gray-700 text-white font-bold shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl text-white">
            ${formatPrice(itemTotal)}
          </p>
          {hasCustomPrice && (
            <p className="text-xs text-gray-400 line-through">
              ${formatPrice(originalTotal)}
            </p>
          )}
          {item.qty > 1 && (
            <p className="text-xs text-gray-400">
              {item.qty} × ${formatPrice(item.price_cash)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;