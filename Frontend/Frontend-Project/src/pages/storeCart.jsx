import React from "react";
import Header from "../components/store/Header";
import Footer from "../components/store/Footer";
import Checkout from "../components/store/Checkout";
import { useLocalSession } from "../hooks/useLocalSession";
import toast from "react-hot-toast";

import "../styles/cart.css";


export default function StoreCart() {
  const [cartItems, setCartItems] = React.useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const { currentUser } = useLocalSession();
  
  const total = cartItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const fetchCartItems = React.useCallback(async () => {
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

  React.useEffect(() => {
    if (currentUser?.id) {
      fetchCartItems();
    } else {
      setLoading(false);
    }
  }, [currentUser, fetchCartItems]);

  async function delet(itemToDelete){
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
        setCartItems(copy => copy.filter(item => item.id !== itemToDelete.id));
        toast.success('Item removed from cart');
      } else {
        toast.error(data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Error removing item from cart');
    }
  }

  const handleCheckout = React.useCallback(async (paymentData) => {
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

      console.log("Processing checkout with payment data:", paymentData);
      
      const response = await fetch('http://localhost:5000/api/store/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          cartItems: paymentData.cartItems,
          billingAddress: paymentData.billingAddress,
          totalAmount: paymentData.amount,
          userId: currentUser.id
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
      <div className="mars-page">
        <Header />
        <div className="cart-container">
          <div className="empty-cart">Loading cart...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="mars-page">
      <Header />

      <div className="cart-container">
        {cartItems.length === 0 ? (

          <div className="empty-cart">Your cart is empty.</div>
        ) : (
          <>
            {/* MAPPING CART PRODUCTS */}
            {cartItems.map((item, index) => (
              <div key={index} className="cart-product">

                <div className="cart-product-img">
                  <img src={item.img} alt={item.name} />
                </div>

                <div className="cart-product-name">
                  name: <br />
                  {item.name}
                </div>

                <div className="cart-product-price">
                  price: <br />
                  ${item.price}
                </div>

                <div className="cart-product-quantity">
                  quantity: <br />
                  {item.quantity}
                </div>

                <div className="cart-product-subtotal">
                  subtotal: <br />
                  ${item.subtotal}
                </div>

                <div className="cart-product-delete">
                  <button
                    className="cart-delete-btn"
                    onClick={() => delet(item)}
                    aria-label="Remove item"
                  >
                    ❌
                  </button>
                </div>


              </div>
            ))}

            {/* TOTAL SECTION (if cart item exists it will be visible) */}
            <div className="cart-total">
              <div className="cart-total-row">
                <span className="cart-total-label">Subtotal:</span>
                <span className="cart-total-value">
                  ${total}
                </span>
              </div>

              <button className="cart-checkout-btn" onClick={() => setIsCheckoutOpen(true)}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>

      <Footer />
      
      {/* CHECKOUT MODAL */}
      <Checkout 
      isOpen={isCheckoutOpen} 
      onClose={() => setIsCheckoutOpen(false)} 
      cartTotal={total} 
      onCheckoutSubmit={handleCheckout} 
      cartItems={cartItems}
      />

    </div>
  );
}
