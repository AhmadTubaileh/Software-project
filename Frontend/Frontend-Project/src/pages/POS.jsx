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

  // Access control
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

  // Fetch all items with latest prices
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
      (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
    );

    // Handle sale filter
  if (query === 'sale' || query === '__sale__' || query === '🔥') {
    filtered = items.filter(item => {
      const priceCash = parseFloat(item.price_cash) || 0;
      const onSalePrice = item.on_sale_price ? parseFloat(item.on_sale_price) : null;
      return onSalePrice !== null && onSalePrice > 0 && onSalePrice < priceCash;
    });
  } 
  // Regular search
  else if (query) {
    filtered = items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
    );
  }

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
          return (a.display_price || a.price_cash || 0) - (b.display_price || b.price_cash || 0);
        case 'price-desc':
          return (b.display_price || b.price_cash || 0) - (a.display_price || a.price_cash || 0);
        case 'relevance':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [items, query, sortBy]);

  // In POS.jsx - Fix the getDisplayPrice function
const getDisplayPrice = (product) => {
  const priceCash = typeof product.price_cash === 'number' 
    ? product.price_cash 
    : parseFloat(product.price_cash) || 0;
  
  const onSalePrice = product.on_sale_price 
    ? (typeof product.on_sale_price === 'number' 
        ? product.on_sale_price 
        : parseFloat(product.on_sale_price))
    : null;
  
  // Return on_sale_price only if it exists AND is lower than price_cash
  if (onSalePrice !== null && onSalePrice < priceCash) {
    return onSalePrice;
  }
  return priceCash;
};

// Add this function to check if item is on sale
const isItemOnSale = (product) => {
  const priceCash = typeof product.price_cash === 'number' 
    ? product.price_cash 
    : parseFloat(product.price_cash) || 0;
  
  const onSalePrice = product.on_sale_price 
    ? (typeof product.on_sale_price === 'number' 
        ? product.on_sale_price 
        : parseFloat(product.on_sale_price))
    : null;
  
  return onSalePrice !== null && onSalePrice < priceCash;
};

  // In POS.jsx, update the addToCart function:
const addToCart = (product) => {
  // Check if product is available and has quantity
  if (product.available !== 1 || product.quantity <= 0) {
    toast.error(`${product.name} is out of stock`);
    return;
  }

  const displayPrice = getDisplayPrice(product);

  // Ensure price is a valid number
  if (isNaN(displayPrice) || displayPrice <= 0) {
    toast.error(`${product.name} has invalid price`);
    return;
  }

  // Ensure price_id is available
  if (!product.price_id) {
    console.warn('Product missing price_id:', product);
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
      // Store original price for reference
      original_price: displayPrice,
      price_cash: displayPrice, // Use display price as default
      price_id: product.price_id || null, // Make sure price_id is included
      display_price: displayPrice
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
    const currentPrice = cartItem ? cartItem.price_cash : getDisplayPrice(item);
    
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

    toast.success(`Sale price updated to $${newPrice.toFixed(2)}`);
    setEditingItem(null);
    setPriceEdit('');
  };

  // Process checkout
  const processCheckout = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to process sales');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setProcessing(true);
    try {
      // Send checkout data to POS API
      const result = await PosApi.checkout(cart, currentUser.id);
      
      toast.success(`Sale #${result.saleId} processed successfully!`);
      setCart([]);
      // Refresh items to get updated quantities
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
  const total = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price_cash * item.qty), 0),
    [cart]
  );

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
                getDisplayPrice={getDisplayPrice}
                isItemOnSale={isItemOnSale} // Add this prop
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