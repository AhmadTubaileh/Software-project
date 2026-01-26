import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../../styles/checkout.css';

// Replace with your actual Stripe publishable key from https://dashboard.stripe.com/test/apikeys
const stripePromise = loadStripe('pk_test_51StRAnCINXEdDi8CSzEQXvzkvpoYxi17Cu1BtkrmuRBivTwkdtATA1yezgc42tvkaUdlYBHOITif9VBmtihZY0VI00i33GbV8F');

function CheckoutForm({ onClose, cartTotal, onCheckoutSubmit, cartItems, paymentMethod }) {
    const stripe = useStripe();
    const elements = useElements();
    const [billingAddress, setBillingAddress] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
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
        
        setIsProcessing(true);
        
        try {
            // Step 1: Create Payment Intent on backend
            const paymentIntentResponse = await fetch('http://localhost:5000/api/store/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: cartTotal })
            });

            const paymentIntentData = await paymentIntentResponse.json();

            if (!paymentIntentData.success) {
                throw new Error(paymentIntentData.message || 'Failed to create payment intent');
            }

            // Step 2: Confirm payment with Stripe (THIS WILL CHARGE THE CARD)
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
                setIsProcessing(false);
                return;
            }

            // Step 3: Payment successful, save order to database
            if (paymentIntent.status === 'succeeded') {
                if (onCheckoutSubmit) {
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
                        alert('Payment successful! Your order has been placed and your card has been charged.');
                        
                        if (onClose) {
                            onClose();
                        }
                    } else {
                        setErrors({
                            form: result?.message || 'Order creation failed, but payment was processed. Please contact support.'
                        });
                    }
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
            setIsProcessing(false);
        }
    };

    const handleCashOnDeliverySubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = validateBillingAddress();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setIsProcessing(true);
        
        try {
            if (onCheckoutSubmit) {
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
            }
        } catch (error) {
            console.error('Checkout error:', error);
            setErrors({
                form: 'An error occurred during order submission'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    if (paymentMethod === 'cash_on_delivery' && orderConfirmed) {
        return (
            <div className="confirmation-container">
                <div className="confirmation-message">
                    <div className="success-icon">✓</div>
                    <h2>Order Confirmed!</h2>
                    <p>Thank you for your order. We will contact you soon to confirm the delivery details.</p>
                    <button 
                        className="submit-payment-btn" 
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
            <form onSubmit={handleVisaSubmit} className="checkout-form">
                {errors.form && (
                    <div className="form-error-message">
                        {errors.form}
                    </div>
                )}
                
                <div className="order-summary-box">
                    <div className="summary-item">
                        <span>Order Total:</span>
                        <span className="order-total">${cartTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="section-title">Card Details</h3>
                    <div className="form-group">
                        <label>Card Information</label>
                        <div className="stripe-card-element">
                            <CardElement 
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#ffffff',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                        },
                                        invalid: {
                                            color: '#fa755a',
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="form-section">
                    <h3 className="section-title">Billing Address</h3>
                    <div className="form-group">
                        <label htmlFor="billingAddress">Full Address</label>
                        <textarea
                            id="billingAddress"
                            value={billingAddress}
                            onChange={(e) => {
                                setBillingAddress(e.target.value);
                                if (errors.billingAddress) setErrors({...errors, billingAddress: ''});
                            }}
                            placeholder="Street address, city, state, ZIP code"
                            rows="3"
                            className={errors.billingAddress ? 'input-error' : ''}
                            disabled={isProcessing}
                        />
                        {errors.billingAddress && (
                            <span className="error-message">{errors.billingAddress}</span>
                        )}
                    </div>
                </div>
                
                <div className="checkout-info">
                    <div className="terms-agreement">
                        <input
                            type="checkbox"
                            id="terms"
                            required
                            disabled={isProcessing}
                        />
                        <label htmlFor="terms">
                            I agree to the <a href="/terms">Terms of Service</a> and authorize this charge
                        </label>
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    className="submit-payment-btn"
                    disabled={isProcessing || !stripe}
                >
                    {isProcessing ? (
                        <>
                            <span className="spinner"></span>
                            Processing Payment...
                        </>
                    ) : (
                        `Pay $${cartTotal.toFixed(2)}`
                    )}
                </button>
            </form>
        );
    }

    if (paymentMethod === 'cash_on_delivery') {
        return (
            <form onSubmit={handleCashOnDeliverySubmit} className="checkout-form">
                {errors.form && (
                    <div className="form-error-message">
                        {errors.form}
                    </div>
                )}
                
                <div className="order-summary-box">
                    <div className="summary-item">
                        <span>Order Total:</span>
                        <span className="order-total">${cartTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="section-title">Billing Address</h3>
                    <p style={{ color: '#aab7c4', marginBottom: '15px' }}>
                        Please provide your delivery address. Payment will be collected upon receipt.
                    </p>
                    <div className="form-group">
                        <label htmlFor="billingAddress">Full Address</label>
                        <textarea
                            id="billingAddress"
                            value={billingAddress}
                            onChange={(e) => {
                                setBillingAddress(e.target.value);
                                if (errors.billingAddress) setErrors({...errors, billingAddress: ''});
                            }}
                            placeholder="Street address, city, state, ZIP code"
                            rows="3"
                            className={errors.billingAddress ? 'input-error' : ''}
                            disabled={isProcessing}
                        />
                        {errors.billingAddress && (
                            <span className="error-message">{errors.billingAddress}</span>
                        )}
                    </div>
                </div>
                
                <div className="checkout-info">
                    <div className="terms-agreement">
                        <input
                            type="checkbox"
                            id="terms"
                            required
                            disabled={isProcessing}
                        />
                        <label htmlFor="terms">
                            I agree to the <a href="/terms">Terms of Service</a>
                        </label>
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    className="submit-payment-btn"
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <span className="spinner"></span>
                            Confirming Order...
                        </>
                    ) : (
                        'Confirm Order'
                    )}
                </button>
            </form>
        );
    }

    return null;
}

export default function Checkout({ isOpen, onClose, cartTotal, onCheckoutSubmit, cartItems }) {
    const [paymentMethod, setPaymentMethod] = useState(null);

    if (!isOpen) {
        return null;
    }

    const handleClose = () => {
        setPaymentMethod(null);
        onClose();
    };

    const handleBack = () => {
        setPaymentMethod(null);
    };

    return (
        <div className="checkout-modal-overlay" onClick={handleClose}>
            <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
                <div className="checkout-modal-header">
                    <h2>{paymentMethod ? 'Checkout' : 'Select Payment Method'}</h2>
                    {paymentMethod && (
                        <button 
                            className="back-btn" 
                            onClick={handleBack}
                            aria-label="Go back"
                        >
                            ← Back
                        </button>
                    )}
                    <button 
                        className="close-checkout-btn" 
                        onClick={handleClose}
                        aria-label="Close checkout modal"
                    >
                        ×
                    </button>
                </div>
                
                {!paymentMethod ? (
                    <div className="payment-method-selection">
                        <div className="payment-method-card" onClick={() => setPaymentMethod('visa')}>
                            <div className="payment-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                    <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                            </div>
                            <h3>Pay with Visa</h3>
                            <p>Secure card payment via Stripe</p>
                        </div>
                        
                        <div className="payment-method-card" onClick={() => setPaymentMethod('cash_on_delivery')}>
                            <div className="payment-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23"></line>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                            </div>
                            <h3>Payment upon Receipt</h3>
                            <p>Pay when you receive your order</p>
                        </div>
                    </div>
                ) : (
                    <Elements stripe={stripePromise}>
                        <CheckoutForm 
                            onClose={handleClose}
                            cartTotal={cartTotal}
                            onCheckoutSubmit={onCheckoutSubmit}
                            cartItems={cartItems}
                            paymentMethod={paymentMethod}
                        />
                    </Elements>
                )}
            </div>
        </div>
    );
}