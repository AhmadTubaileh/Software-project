import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import MobileStoreHeader from '../../components/store/MobileStoreHeader';
import MobileStoreFooter from '../../components/store/MobileStoreFooter';
import MobileCheckout from '../../components/store/MobileCheckout';
import { useLocalSession } from '../../hooks/useLocalSession';
import '../../styles/MobileStore.css';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useLocalSession();
  const navigate = useNavigate();
  
  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/cart/${currentUser.id}`);
      const data = await response.json();
      
      if (data.success) {
        setCartItems(data.items);
      } else {
        console.error('Failed to fetch cart:', data.message);
        toast.error('Failed to load cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Error loading cart');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchCartItems();
    } else {
      setLoading(false);
      toast.error('Please login to view cart');
      navigate('/store');
    }
  }, [currentUser, fetchCartItems, navigate]);

  async function removeItem(itemToDelete) {
    try {
      const response = await fetch('http://localhost:5000/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemId: itemToDelete.itemId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCartItems(items => items.filter(item => item.id !== itemToDelete.id));
        toast.success('Item removed from cart');
      } else {
        toast.error(data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Error removing item from cart');
    }
  }

  const handleCheckout = useCallback(async (paymentData) => {
    try {
      if (!currentUser || !currentUser.id) {
        return {
          success: false,
          message: 'Please login to complete checkout'
        };
      }

      if (!paymentData.cartItems || paymentData.cartItems.length === 0) {
        return {
          success: false,
          message: 'Your cart is empty'
        };
      }

      const response = await fetch('http://localhost:5000/api/store/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          cartItems: paymentData.cartItems,
          billingAddress: paymentData.billingAddress,
          totalAmount: paymentData.amount,
          userId: currentUser.id,
          paymentMethod: paymentData.paymentMethod,
          paymentIntentId: paymentData.paymentIntentId
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Payment processing failed');
      }
      
      const clearResponse = await fetch(`http://localhost:5000/api/cart/clear/${currentUser.id}`, {
        method: 'DELETE'
      });
      
      if (clearResponse.ok) {
        setCartItems([]);
      }
      
      return {
        success: true,
        message: result.message || 'Payment processed successfully'
      };
    } catch (error) {
      console.error('Checkout error:', error);
      return {
        success: false,
        message: error.message || 'Payment processing failed'
      };
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="mobile-store-container">
        <MobileStoreHeader />
        <div className="mobile-store-loading">
          <div className="loading-spinner"></div>
          <p>Loading cart...</p>
        </div>
        <MobileStoreFooter />
      </div>
    );
  }

  return (
    <div className="mobile-store-container">
      <MobileStoreHeader />
      
      <div className="mobile-cart-page">
        <div className="mobile-cart-header">
          <button className="mobile-back-btn" onClick={() => navigate('/store')}>
            <ArrowLeft size={24} />
          </button>
          <h1>Shopping Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="mobile-empty-state">
            <ShoppingCart size={64} />
            <p>Your cart is empty</p>
            <button onClick={() => navigate('/store')} className="mobile-btn-primary">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="mobile-cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="mobile-cart-item">
                  <div className="mobile-cart-item-image">
                    <img src={item.img} alt={item.name} />
                  </div>
                  
                  <div className="mobile-cart-item-info">
                    <h3>{item.name}</h3>
                    <p className="mobile-cart-item-price">${item.price}</p>
                    <p className="mobile-cart-item-qty">Quantity: {item.quantity}</p>
                    <p className="mobile-cart-item-subtotal">
                      Subtotal: ${item.subtotal.toFixed(2)}
                    </p>
                  </div>
                  
                  <button
                    className="mobile-cart-item-delete"
                    onClick={() => removeItem(item)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mobile-cart-summary">
              <div className="mobile-cart-total">
                <span>Total:</span>
                <span className="mobile-cart-total-amount">${total.toFixed(2)}</span>
              </div>
              
              <button 
                className="mobile-btn-primary mobile-checkout-btn" 
                onClick={() => setIsCheckoutOpen(true)}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>

      <MobileStoreFooter />
      
      <MobileCheckout 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        cartTotal={total} 
        onCheckoutSubmit={handleCheckout} 
        cartItems={cartItems}
      />
    </div>
  );
}
