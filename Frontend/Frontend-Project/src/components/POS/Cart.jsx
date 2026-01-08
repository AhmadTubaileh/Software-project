// components/POS/Cart.jsx
import React from 'react';
import CartItem from './CartItem.jsx';

const Cart = ({ cart, processing, onRemoveFromCart, onUpdateQuantity, onProcessCheckout, onClearCart, total }) => {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const originalTotal = cart.reduce((sum, item) => sum + (item.original_price * item.qty), 0);
  const hasCustomPrices = cart.some(item => item.price_cash !== item.original_price);
  const discountAmount = originalTotal - total;
  const hasSaleItems = cart.some(item => item.on_sale_price && item.on_sale_price < item.price_cash);

  // Format price safely
  const formatPrice = (price) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 flex flex-col shadow-2xl border border-gray-700">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-white">Shopping Cart</h2>
          <p className="text-gray-400 text-sm mt-1">Items will be processed together</p>
        </div>
        <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl border border-blue-500/30">
          <span className="text-blue-400 font-bold text-lg">{totalItems}</span>
          <span className="text-gray-400 text-sm ml-1">items</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 max-h-[50vh] pr-2">
        {cart.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-6xl mb-4 opacity-50">🛒</div>
            <p className="text-lg font-medium text-gray-300">Your cart is empty</p>
            <p className="text-sm text-gray-500">Add products from the left panel</p>
          </div>
        ) : (
          cart.map(item => (
            <CartItem
              key={`${item.id}-${item.price_cash}`}
              item={item}
              onRemove={() => onRemoveFromCart(item.id)}
              onUpdateQuantity={(newQty) => onUpdateQuantity(item.id, newQty)}
            />
          ))
        )}
      </div>

      <div className="border-t border-gray-700 mt-6 pt-6 space-y-4">
        {/* Summary Section */}
        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="text-gray-300">Subtotal:</span>
            <span className="font-semibold text-white">${formatPrice(originalTotal)}</span>
          </div>
          
          {/* Discount Summary */}
          {hasCustomPrices && (
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4 rounded-xl border border-green-500/30">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-400">Discount Applied:</span>
                <span className="text-green-400 font-bold">
                  -${formatPrice(discountAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Includes price adjustments</span>
                <span>{cart.filter(item => item.price_cash !== item.original_price).length} items edited</span>
              </div>
            </div>
          )}

          {/* Sale Items Indicator */}
          {hasSaleItems && (
            <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 p-3 rounded-lg border border-orange-500/30">
              <div className="flex items-center gap-2">
                <span className="text-orange-400">🔥</span>
                <span className="text-orange-300 text-sm">
                  Sale items included in cart
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Total Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm">Total Amount</p>
              <p className="text-3xl font-bold text-white">${formatPrice(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{cart.length} unique items</p>
              <p className="text-xs text-gray-400">{totalItems} total units</p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            disabled={cart.length === 0 || processing}
            onClick={onProcessCheckout}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
              cart.length === 0 || processing
                ? 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-[1.02] hover:shadow-xl'
            }`}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Sale...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>💰</span>
                Complete Sale (${formatPrice(total)})
              </span>
            )}
          </button>

          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
            >
              🗑️ Clear Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;