import React, { useState } from 'react';
import { X, CreditCard, DollarSign } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import '../../styles/MobileStore.css';

const stripePromise = loadStripe('pk_test_51StRAnCINXEdDi8CSzEQXvzkvpoYxi17Cu1BtkrmuRBivTwkdtATA1yezgc42tvkaUdlYBHOITif9VBmtihZY0VI00i33GbV8F');

function CheckoutForm({ cartTotal, onCheckoutSubmit, cartItems, onClose, paymentMethod }) {
  const stripe = useStripe();
  const elements = useElements();
  const [billingAddress, setBillingAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const validateBillingAddress = () => {
    const newErrors = {};
    if (!billingAddress.trim()) {
      newErrors.billingAddress = 'Billing address is required';
    }
    return newErrors;
  };

  const handleVisaSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateBillingAddress();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    
    try {
      const paymentIntentResponse = await fetch('http://localhost:5000/api/store/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cartTotal })
      });

      const paymentIntentData = await paymentIntentResponse.json();

      if (!paymentIntentData.success) {
        throw new Error(paymentIntentData.message || 'Failed to create payment intent');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              address: {
                line1: billingAddress
              }
            }
          }
        }
      );

      if (confirmError) {
        setErrors({ form: confirmError.message });
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        const result = await onCheckoutSubmit({
          paymentMethod: 'visa',
          paymentIntentId: paymentIntent.id,
          billingAddress,
          amount: cartTotal,
          cartItems: cartItems || []
        });
        
        if (result && result.success) {
          setBillingAddress('');
          setErrors({});
          toast.success('Payment successful! Your order has been placed.');
          onClose();
        } else {
          setErrors({
            form: result?.message || 'Order creation failed, but payment was processed. Please contact support.'
          });
        }
      } else {
        setErrors({
          form: 'Payment was not successful. Please try again.'
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setErrors({
        form: error.message || 'An error occurred during payment'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCashOnDeliverySubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateBillingAddress();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setProcessing(true);
    
    try {
      const result = await onCheckoutSubmit({
        paymentMethod: 'cash_on_delivery',
        billingAddress,
        amount: cartTotal,
        cartItems: cartItems || []
      });
      
      if (result && result.success) {
        setBillingAddress('');
        setErrors({});
        setOrderConfirmed(true);
      } else {
        setErrors({
          form: result?.message || 'Order submission failed'
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setErrors({
        form: 'An error occurred during order submission'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (paymentMethod === 'cash_on_delivery' && orderConfirmed) {
    return (
      <div className="mobile-confirmation-container">
        <div className="mobile-confirmation-message">
          <div className="mobile-success-icon">✓</div>
          <h2>Order Confirmed!</h2>
          <p>Thank you for your order. We will contact you soon to confirm the delivery details.</p>
          <button 
            className="mobile-btn-primary" 
            onClick={onClose}
            style={{ marginTop: '20px' }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (paymentMethod === 'visa') {
    return (
      <form onSubmit={handleVisaSubmit} className="mobile-checkout-form">
        {errors.form && (
          <div className="mobile-form-error">
            {errors.form}
          </div>
        )}
        
        <div className="mobile-checkout-summary">
          <div className="mobile-checkout-total">
            <span>Order Total:</span>
            <span className="mobile-checkout-amount">${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mobile-form-section">
          <h3>Card Details</h3>
          <div className="mobile-form-group">
            <div className="mobile-card-element">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#fff',
                      '::placeholder': {
                        color: '#aaa',
                      },
                    },
                    invalid: {
                      color: '#ef4444',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="mobile-form-section">
          <h3>Billing Address</h3>
          <div className="mobile-form-group">
            <textarea
              id="billingAddress"
              value={billingAddress}
              onChange={(e) => {
                setBillingAddress(e.target.value);
                if (errors.billingAddress) setErrors({...errors, billingAddress: ''});
              }}
              placeholder="Street address, city, state, ZIP code"
              rows={3}
              className={errors.billingAddress ? 'input-error' : ''}
              disabled={processing}
            />
            {errors.billingAddress && (
              <span className="mobile-error-message">{errors.billingAddress}</span>
            )}
          </div>
        </div>
        
        <button 
          type="submit" 
          className="mobile-btn-primary"
          disabled={processing || !stripe}
        >
          {processing ? 'Processing Payment...' : `Pay $${cartTotal.toFixed(2)}`}
        </button>
      </form>
    );
  }

  if (paymentMethod === 'cash_on_delivery') {
    return (
      <form onSubmit={handleCashOnDeliverySubmit} className="mobile-checkout-form">
        {errors.form && (
          <div className="mobile-form-error">
            {errors.form}
          </div>
        )}
        
        <div className="mobile-checkout-summary">
          <div className="mobile-checkout-total">
            <span>Order Total:</span>
            <span className="mobile-checkout-amount">${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mobile-form-section">
          <h3>Billing Address</h3>
          <p style={{ color: '#aaa', marginBottom: '15px', fontSize: '14px' }}>
            Please provide your delivery address. Payment will be collected upon receipt.
          </p>
          <div className="mobile-form-group">
            <textarea
              id="billingAddress"
              value={billingAddress}
              onChange={(e) => {
                setBillingAddress(e.target.value);
                if (errors.billingAddress) setErrors({...errors, billingAddress: ''});
              }}
              placeholder="Street address, city, state, ZIP code"
              rows={3}
              className={errors.billingAddress ? 'input-error' : ''}
              disabled={processing}
            />
            {errors.billingAddress && (
              <span className="mobile-error-message">{errors.billingAddress}</span>
            )}
          </div>
        </div>
        
        <button 
          type="submit" 
          className="mobile-btn-primary"
          disabled={processing}
        >
          {processing ? 'Confirming Order...' : 'Confirm Order'}
        </button>
      </form>
    );
  }

  return null;
}

export default function MobileCheckout({ isOpen, onClose, cartTotal, onCheckoutSubmit, cartItems }) {
  const [paymentMethod, setPaymentMethod] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setPaymentMethod(null);
    onClose();
  };

  const handleBack = () => {
    setPaymentMethod(null);
  };

  return (
    <div className="mobile-modal-overlay" onClick={handleClose}>
      <div className="mobile-modal-content mobile-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-modal-header">
          <h2>{paymentMethod ? 'Checkout' : 'Select Payment Method'}</h2>
          {paymentMethod && (
            <button className="mobile-back-btn" onClick={handleBack}>
              ← Back
            </button>
          )}
          <button className="mobile-modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>
        
        {!paymentMethod ? (
          <div className="mobile-payment-method-selection">
            <div className="mobile-payment-method-card" onClick={() => setPaymentMethod('visa')}>
              <div className="mobile-payment-icon">
                <CreditCard size={48} />
              </div>
              <h3>Pay with Visa</h3>
              <p>Secure card payment via Stripe</p>
            </div>
            
            <div className="mobile-payment-method-card" onClick={() => setPaymentMethod('cash_on_delivery')}>
              <div className="mobile-payment-icon">
                <DollarSign size={48} />
              </div>
              <h3>Payment upon Receipt</h3>
              <p>Pay when you receive your order</p>
            </div>
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              cartTotal={cartTotal}
              onCheckoutSubmit={onCheckoutSubmit}
              cartItems={cartItems}
              onClose={handleClose}
              paymentMethod={paymentMethod}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
