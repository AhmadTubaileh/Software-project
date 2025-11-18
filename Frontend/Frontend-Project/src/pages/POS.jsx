import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import PosApi from '../services/posApi.js';
import Header from '../components/POS/Header.jsx';
import SearchAndSort from '../components/POS/SearchAndSort.jsx';
import ProductGrid from '../components/POS/ProductGrid.jsx';
import Cart from '../components/POS/Cart.jsx';

function POS() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [priceEdit, setPriceEdit] = useState('');
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
  const addToCart = (product) => {
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
        // Use original price from database
        original_price: product.price_cash,
        price_cash: product.price_cash
      }];
    });
    toast.success(`${product.name} added to cart`);
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Update quantity in cart
  const updateQuantity = (productId, newQty) => {
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
  };

  // Start editing item price for this sale only
  const startEditPrice = (item) => {
    const cartItem = cart.find(cartItem => cartItem.id === item.id);
    const currentPrice = cartItem ? cartItem.price_cash : item.price_cash;
    
    setEditingItem(item);
    setPriceEdit(currentPrice.toString());
  };

  // Cancel editing price
  const cancelEditPrice = () => {
    setEditingItem(null);
    setPriceEdit('');
  };

  // Save edited price for this sale only
  const savePrice = async () => {
    if (!editingItem || !priceEdit) return;

    const newPrice = parseFloat(priceEdit);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    // Update price in cart only (not in database)
    setCart(prev => prev.map(item =>
      item.id === editingItem.id
        ? { ...item, price_cash: newPrice }
        : item
    ));

    toast.success(`Sale price updated to $${newPrice.toFixed(2)} (original: $${editingItem.price_cash})`);
    setEditingItem(null);
    setPriceEdit('');
  };

  // Process checkout using PosApi
  const processCheckout = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to process sales');
      return;
    }

    setProcessing(true);
    try {
      // Send the cart with custom prices to backend
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

  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price_cash * item.qty), 0);

  // Function to check if item is available
  const isItemAvailable = (item) => {
    return item.available === 1 && item.quantity > 0;
  };

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
          <Header 
            currentUser={currentUser}
            items={items}
            isItemAvailable={isItemAvailable}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section: Products */}
            <div className="lg:col-span-2">
              <SearchAndSort
                query={query}
                setQuery={setQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />

              <ProductGrid
                loading={loading}
                filteredProducts={filteredProducts}
                cart={cart}
                editingItem={editingItem}
                currentUser={currentUser}
                onAddToCart={addToCart}
                onStartEditPrice={startEditPrice}
                onSavePrice={savePrice}
                onCancelEditPrice={cancelEditPrice}
                priceEdit={priceEdit}
                setPriceEdit={setPriceEdit}
                isItemAvailable={isItemAvailable}
              />
            </div>

            {/* Right Section: Cart */}
            <Cart
              cart={cart}
              processing={processing}
              onRemoveFromCart={removeFromCart}
              onUpdateQuantity={updateQuantity}
              onProcessCheckout={processCheckout}
              onClearCart={() => setCart([])}
              total={total}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default POS;