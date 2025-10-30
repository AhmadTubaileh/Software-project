import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import PosApi from '../services/posApi.js';

function POS() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { currentUser } = useLocalSession();

  // Access control - same as Employees page
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'employee')) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need admin or employee privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Fetch all items from backend (including out of stock)
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsData = await PosApi.getItems();
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load products');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );

    // Sort products - available items first, then out of stock
    filtered.sort((a, b) => {
      const aAvailable = a.available === 1 && a.quantity > 0;
      const bAvailable = b.available === 1 && b.quantity > 0;
      
      // Available items come first
      if (aAvailable && !bAvailable) return -1;
      if (!aAvailable && bAvailable) return 1;
      
      // Then sort by the selected criteria
      switch (sortBy) {
        case 'price-asc':
          return a.price_cash - b.price_cash;
        case 'price-desc':
          return b.price_cash - a.price_cash;
        case 'relevance':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [items, query, sortBy]);

  // Add product to cart - only if available and quantity > 0
  function addToCart(product) {
    // Check if product is available and has quantity
    if (product.available !== 1 || product.quantity <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      // Check if adding would exceed available quantity
      const newQty = existing ? existing.qty + 1 : 1;
      if (newQty > product.quantity) {
        toast.error(`Only ${product.quantity} ${product.name}(s) available`);
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { 
        ...product, 
        qty: 1,
        price_cash: product.price_cash
      }];
    });
    toast.success(`${product.name} added to cart`);
  }

  // Remove product from cart
  function removeFromCart(productId) {
    setCart(prev => prev.filter(item => item.id !== productId));
  }

  // Update quantity in cart
  function updateQuantity(productId, newQty) {
    if (newQty < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => {
      const product = items.find(p => p.id === productId);
      if (!product || product.available !== 1 || product.quantity <= 0) {
        toast.error(`${product?.name || 'Item'} is no longer available`);
        removeFromCart(productId);
        return prev.filter(item => item.id !== productId);
      }

      if (newQty > product.quantity) {
        toast.error(`Only ${product.quantity} ${product.name}(s) available`);
        return prev;
      }

      return prev.map(item =>
        item.id === productId ? { ...item, qty: newQty } : item
      );
    });
  }

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price_cash * item.qty), 0);

  // Process checkout using PosApi
  const processCheckout = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to process sales');
      return;
    }

    setProcessing(true);
    try {
      const result = await PosApi.checkout(cart, currentUser.id);
      
      toast.success(`Sale #${result.saleId} processed successfully!`);
      setCart([]);
      // Refresh items to get updated quantities and availability
      await fetchItems();
      
    } catch (error) {
      console.error('Checkout error:', error);
      
      if (error.type === 'INSUFFICIENT_QUANTITY') {
        // Handle insufficient quantities
        error.items.forEach(item => {
          toast.error(`Only ${item.available} ${item.name}(s) available (requested: ${item.requested})`);
        });
        // Update cart to reflect available quantities
        const updatedCart = cart.map(cartItem => {
          const insufficient = error.items.find(item => item.id === cartItem.id);
          if (insufficient && cartItem.qty > insufficient.available) {
            return { ...cartItem, qty: insufficient.available };
          }
          return cartItem;
        }).filter(item => item.qty > 0);
        setCart(updatedCart);
      } else {
        toast.error(error.message || 'Failed to process sale');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Function to check if item is available
  const isItemAvailable = (item) => {
    return item.available === 1 && item.quantity > 0;
  };

  // Function to get stock status badge
  const getStockBadge = (item) => {
    if (item.available !== 1) {
      return { text: 'Unavailable', class: 'bg-red-600' };
    }
    if (item.quantity <= 0) {
      return { text: 'Out of stock', class: 'bg-red-600' };
    }
    if (item.quantity <= 5) {
      return { text: `Low stock (${item.quantity})`, class: 'bg-yellow-600' };
    }
    return { text: `${item.quantity} in stock`, class: 'bg-green-600' };
  };

  // Function to get emoji icon for each category
  function getCategoryIcon(item) {
    const name = item.name.toLowerCase();
    if (name.includes('phone')) return '📱';
    if (name.includes('laptop') || name.includes('computer')) return '💻';
    if (name.includes('headphone') || name.includes('earphone')) return '🎧';
    if (name.includes('tv') || name.includes('television')) return '📺';
    if (name.includes('console') || name.includes('game')) return '🎮';
    if (name.includes('watch') || name.includes('smartwatch')) return '⌚';
    return '🔌';
  }

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar for Admin/Employee */}
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}

      {/* Main POS Content */}
      <main
        className={`flex-1 flex flex-col min-h-screen ${
          currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
        }`}
      >
        <div className="p-6 flex-1">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Point of Sale</h1>
              <p className="text-gray-400 text-sm mt-1">
                Welcome, {currentUser?.username || 'User'} • {currentUser?.role || 'Guest'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-green-400">
                Available Items: {items.filter(item => isItemAvailable(item)).length}
              </div>
              <div className="text-sm text-gray-400">
                Total Products: {items.length}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section: Products */}
            <div className="lg:col-span-2">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search products by name or description..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">Loading products...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
                  {filteredProducts.map(product => {
                    const available = isItemAvailable(product);
                    const stockBadge = getStockBadge(product);
                    
                    return (
                      <div
                        key={product.id}
                        className={`p-4 bg-gray-800 rounded-xl border-2 transition-all duration-200 transform ${
                          available 
                            ? 'border-gray-700 hover:border-blue-500 hover:scale-105' 
                            : 'border-red-500 opacity-70'
                        }`}
                      >
                        {/* Product Image or Icon */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-4xl">
                            {product.item_image ? (
                              <img 
                                src={`data:image/jpeg;base64,${product.item_image}`} 
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              getCategoryIcon(product)
                            )}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${stockBadge.class}`}>
                            {stockBadge.text}
                          </div>
                        </div>

                        <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2 h-10">
                          {product.description}
                        </p>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-blue-400 text-xl font-bold">${product.price_cash}</p>
                            {product.price_installment_total && (
                              <p className="text-green-400 text-xs">
                                Installment: ${product.price_installment_total}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={!available}
                            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                              available
                                ? 'bg-blue-600 hover:bg-blue-700 transform hover:scale-110'
                                : 'bg-gray-600 cursor-not-allowed'
                            }`}
                          >
                            {available ? 'Add to Cart' : 'Out of Stock'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Section: Cart */}
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
                    <div
                      key={item.id}
                      className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium truncate">{item.name}</h4>
                          <p className="text-sm text-gray-300">
                            ${item.price_cash} each
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 text-lg transition-colors duration-200 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.qty - 1)}
                            className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center hover:bg-gray-500"
                          >
                            -
                          </button>
                          <span className="font-medium w-8 text-center">{item.qty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.qty + 1)}
                            disabled={item.qty >= item.quantity}
                            className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center hover:bg-gray-500 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${(item.price_cash * item.qty).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-600 mt-4 pt-4 space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Items:</span>
                  <span>{cart.reduce((sum, item) => sum + item.qty, 0)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-400">${total.toFixed(2)}</span>
                </div>
                
                <button
                  disabled={cart.length === 0 || processing}
                  onClick={processCheckout}
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
                    `Process Sale (${cart.reduce((sum, item) => sum + item.qty, 0)} items)`
                  )}
                </button>

                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                  >
                    Clear Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default POS;