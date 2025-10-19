import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/products.js'; // Your product data
import { filterProducts } from '../utils/filterProducts.js';
import toast, { Toaster } from 'react-hot-toast';

// Function to get emoji icon for each category
function getCategoryIcon(category) {
  switch (category) {
    case 'phone': return '📱';
    case 'laptop': return '💻';
    case 'headphones': return '🎧';
    case 'tv': return '📺';
    case 'console': return '🎮';
    case 'watch': return '⌚';
    default: return '🔌';
  }
}

function POS() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');

  // Filter and sort products
  const filteredProducts = useMemo(
    () => filterProducts(PRODUCTS, query, sortBy),
    [query, sortBy]
  );

  // Add product to cart
  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  }

  // Remove product from cart
  function removeFromCart(productId) {
    setCart(prev => prev.filter(item => item.id !== productId));
  }

  // Calculate total
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="pos-page min-h-screen bg-[#0e1830] text-white p-6">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand">Point of Sale</h1>
        <button
          onClick={() => navigate('/')} // <- Go back to Home page
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
        >
          Back to Home
        </button>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Section: Products */}
        <div className="col-span-2">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md bg-[#162a4a] border border-brand/30 text-white focus:outline-none"
            />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-[#162a4a] border border-brand/30 rounded-md px-3 py-2"
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="p-3 bg-[#162a4a] rounded-xl shadow-md flex flex-col items-center text-center hover:scale-105 transition-transform"
              >
                {/* Category Icon */}
                <div className="text-5xl mb-2">{getCategoryIcon(product.category)}</div>

                <h3 className="text-sm font-medium">{product.name}</h3>
                <p className="text-brand text-lg font-bold">${product.price}</p>
                <button
                  onClick={() => addToCart(product)}
                  className="mt-2 bg-brand hover:bg-brand/80 px-3 py-1 rounded-full"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Cart */}
        <div className="bg-[#162a4a] rounded-xl p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-3">Cart</h2>
          <div className="flex-1 overflow-y-auto space-y-3">
            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm">No items added.</p>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-[#1b3057] px-3 py-2 rounded-md"
                >
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-300">
                      {item.qty} × ${item.price}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-600 mt-4 pt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              disabled={cart.length === 0}
              onClick={() => {
                toast.success('Payment processed successfully!');
                setCart([]);
              }}
              className={`mt-3 w-full py-2 rounded-md ${
                cart.length === 0
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Confirm Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POS;
