import React from 'react';
import CartItem from './CartItem.jsx';

const Cart = ({ cart, processing, onRemoveFromCart, onUpdateQuantity, onProcessCheckout, onClearCart, total }) => {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const originalTotal = cart.reduce((sum, item) => sum + (item.original_price * item.qty), 0);
  const hasCustomPrices = cart.some(item => item.price_cash !== item.original_price);
  const discountAmount = originalTotal - total;

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-blue-400">Shopping Cart</h2>
      
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[50vh]">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🛒</div>
            <p>Your cart is empty</p>
            <p className="text-sm">Add some products to get started</p>
          </div>
        ) : (
          cart.map(item => (
            <CartItem
              key={item.id}
              item={item}
              onRemove={() => onRemoveFromCart(item.id)}
              onUpdateQuantity={(newQty) => onUpdateQuantity(item.id, newQty)}
            />
          ))
        )}
      </div>

      <div className="border-t border-gray-600 mt-4 pt-4 space-y-3">
        <div className="flex justify-between text-lg">
          <span>Items:</span>
          <span>{totalItems}</span>
        </div>
        
        {/* Show discount summary if any custom prices */}
        {hasCustomPrices && (
          <div className="bg-green-900/20 border border-green-500 p-2 rounded">
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Original Total:</span>
              <span className="text-green-400 line-through">
                ${originalTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Discount Applied:</span>
              <span className="text-green-400">
                -${discountAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between text-xl font-bold">
          <span>Total:</span>
          <span className="text-green-400">${total.toFixed(2)}</span>
        </div>
        
        <button
          disabled={cart.length === 0 || processing}
          onClick={onProcessCheckout}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
            cart.length === 0 || processing
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
          }`}
        >
          {processing ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </span>
          ) : (
            `Process Sale (${totalItems} items)`
          )}
        </button>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
          >
            Clear Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default Cart;