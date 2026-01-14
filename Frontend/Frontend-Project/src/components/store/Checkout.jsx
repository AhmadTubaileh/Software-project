import React, { useState } from 'react';
import '../../styles/checkout.css';

export default function Checkout({ isOpen, onClose, cartTotal, onCheckoutSubmit }) {
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    if (!isOpen) {
        return null;
    }

    const validateForm = () => {
        const newErrors = {};
        
        if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length !== 16) {
            newErrors.cardNumber = 'Please enter a valid 16-digit card number';
        }
        
        if (!cardName.trim()) {
            newErrors.cardName = 'Cardholder name is required';
        }
        
        if (!expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
            newErrors.expiryDate = 'Please enter valid expiry date (MM/YY)';
        }
        
        if (!cvv.trim() || cvv.length !== 3) {
            newErrors.cvv = 'Please enter valid 3-digit CVV';
        }
        
        if (!billingAddress.trim()) {
            newErrors.billingAddress = 'Billing address is required';
        }
        
        return newErrors;
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        setCardNumber(formatted);
        if (errors.cardNumber) setErrors({...errors, cardNumber: ''});
    };

    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        setExpiryDate(value);
        if (errors.expiryDate) setErrors({...errors, expiryDate: ''});
    };

    const handleCvvChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').substring(0, 3);
        setCvv(value);
        if (errors.cvv) setErrors({...errors, cvv: ''});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setIsProcessing(true);
        
        try {
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (onCheckoutSubmit) {
                const result = await onCheckoutSubmit({
                    cardNumber: cardNumber.replace(/\s/g, ''),
                    cardName,
                    expiryDate,
                    cvv,
                    billingAddress,
                    amount: cartTotal
                });
                
                if (result && result.success) {
                    // Reset form on success
                    setCardNumber('');
                    setCardName('');
                    setExpiryDate('');
                    setCvv('');
                    setBillingAddress('');
                    setErrors({});
                    
                    // Show success message
                    alert('Payment successful! Your order has been placed.');
                    
                    // Close modal
                    if (onClose) {
                        onClose();
                    }
                } else {
                    setErrors({
                        form: result?.message || 'Payment failed'
                    });
                }
            } else {
                // For testing without backend
                console.log('Checkout data:', {
                    cardNumber: cardNumber.replace(/\s/g, ''),
                    cardName,
                    expiryDate,
                    cvv,
                    billingAddress,
                    amount: cartTotal
                });
                alert('Payment would be processed here. Check console for data.');
                if (onClose) onClose();
            }
        } catch (error) {
            console.error('Checkout error:', error);
            setErrors({
                form: 'An error occurred during payment'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="checkout-modal-overlay" onClick={onClose}>
            <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
                <div className="checkout-modal-header">
                    <h2>Checkout</h2>
                    <button 
                        className="close-checkout-btn" 
                        onClick={onClose}
                        aria-label="Close checkout modal"
                    >
                        ×
                    </button>
                </div>
                
                <div className="order-summary-box">
                    <div className="summary-item">
                        <span>Order Total:</span>
                        <span className="order-total">${cartTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="checkout-form">
                    {errors.form && (
                        <div className="form-error-message">
                            {errors.form}
                        </div>
                    )}
                    
                    {/* Card Details Section */}
                    <div className="form-section">
                        <h3 className="section-title">Card Details</h3>
                        
                        <div className="form-group">
                            <label htmlFor="cardNumber">Card Number</label>
                            <input
                                id="cardNumber"
                                type="text"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                placeholder="1234 5678 9012 3456"
                                maxLength="19"
                                className={errors.cardNumber ? 'input-error' : ''}
                                disabled={isProcessing}
                            />
                            {errors.cardNumber && (
                                <span className="error-message">{errors.cardNumber}</span>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="cardName">Cardholder Name</label>
                            <input
                                id="cardName"
                                type="text"
                                value={cardName}
                                onChange={(e) => {
                                    setCardName(e.target.value);
                                    if (errors.cardName) setErrors({...errors, cardName: ''});
                                }}
                                placeholder="John Doe"
                                className={errors.cardName ? 'input-error' : ''}
                                disabled={isProcessing}
                            />
                            {errors.cardName && (
                                <span className="error-message">{errors.cardName}</span>
                            )}
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group half">
                                <label htmlFor="expiryDate">Expiry Date (MM/YY)</label>
                                <input
                                    id="expiryDate"
                                    type="text"
                                    value={expiryDate}
                                    onChange={handleExpiryChange}
                                    placeholder="MM/YY"
                                    maxLength="5"
                                    className={errors.expiryDate ? 'input-error' : ''}
                                    disabled={isProcessing}
                                />
                                {errors.expiryDate && (
                                    <span className="error-message">{errors.expiryDate}</span>
                                )}
                            </div>
                            
                            <div className="form-group half">
                                <label htmlFor="cvv">CVV</label>
                                <input
                                    id="cvv"
                                    type="password"
                                    value={cvv}
                                    onChange={handleCvvChange}
                                    placeholder="123"
                                    maxLength="3"
                                    className={errors.cvv ? 'input-error' : ''}
                                    disabled={isProcessing}
                                />
                                {errors.cvv && (
                                    <span className="error-message">{errors.cvv}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Billing Address Section */}
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
                    
                    {/* Terms and Security */}
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
                        
                        {/*<div className="security-info">
                            <div className="secure-badge">
                                🔒 Secure Payment
                            </div>
                            <div className="payment-icons">
                                <span className="payment-icon">💳</span>
                                <span className="payment-icon">🏦</span>
                                <span className="payment-icon">🔐</span>
                            </div>
                        </div>*/}
                    </div>
                    
                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="submit-payment-btn"
                        disabled={isProcessing}
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
                    
                    {/*<div className="alternative-payments">
                        <p className="or-divider">OR</p>
                        <button type="button" className="paypal-btn">
                            <span className="paypal-icon">P</span>
                            Pay with PayPal
                        </button>
                    </div>*/}
                </form>
            </div>
        </div>
    );
}