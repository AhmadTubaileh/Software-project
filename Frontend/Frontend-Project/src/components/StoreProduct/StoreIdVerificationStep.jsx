import React, { useState } from 'react';
import toast from 'react-hot-toast';
import '../../styles/store.css';

const StoreIdVerificationStep = ({ currentUser, formData, updateFormData, nextStep }) => {
  const [verifying, setVerifying] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleIdCardChange = (e) => {
    const idCardNumber = e.target.value;
    updateFormData({ idCardNumber });
    setSearched(false);
  };

  const verifyIdCard = async () => {
    if (!formData.idCardNumber.trim()) {
      toast.error('Please enter an ID card number');
      return;
    }

    if (formData.idCardNumber.trim().length < 5) {
      toast.error('Please enter a valid ID card number');
      return;
    }

    // Validate against logged-in account: if user already has id_card, it must match
    if (currentUser?.id_card && currentUser.id_card !== formData.idCardNumber.trim()) {
      toast.error('ID card number does not match your account. Please enter the correct ID card number.');
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('http://localhost:5000/api/customers/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_card_number: formData.idCardNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSearched(true);

      // Prefer contract_customers record for prefill, otherwise treat as new customer
      if (data.exists && data.customerData && data.source_table === 'contract_customers') {
        const customerData = data.customerData;
        updateFormData({
          existingCustomer: customerData,
          customer: {
            ...formData.customer,
            full_name: customerData.full_name || formData.customer.full_name || '',
            phone: customerData.phone || formData.customer.phone || '',
            id_card_number: formData.idCardNumber,
            address: customerData.address || formData.customer.address || '',
            email: customerData.email || formData.customer.email || '',
            id_card_image: null
          }
        });
        toast.success('ID verified successfully');
      } else {
        updateFormData({
          existingCustomer: null,
          customer: {
            ...formData.customer,
            id_card_number: formData.idCardNumber
          }
        });

        toast.success('ID card verified. Please fill in your information.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        toast.error('Network error: Cannot connect to server');
      } else {
        toast.error(error.message || 'Failed to verify ID card');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verifyIdCard();
    }
  };

  const canProceed = searched && formData.idCardNumber.trim().length > 0;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: 'rgb(181,62,32)', fontSize: '1.5rem', marginBottom: '20px' }}>
        Step 1: ID Card Verification
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
            ID Card Number *
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={formData.idCardNumber}
              onChange={handleIdCardChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your ID card number"
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.9rem'
              }}
              disabled={verifying}
            />
            <button
              onClick={verifyIdCard}
              disabled={verifying || !formData.idCardNumber.trim()}
              className="mars-header-button"
              style={{ whiteSpace: 'nowrap', opacity: (verifying || !formData.idCardNumber.trim()) ? 0.6 : 1 }}
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Verification Result */}
        {searched && (
          <div style={{
            padding: '15px',
            borderRadius: '8px',
            backgroundColor: formData.existingCustomer 
              ? 'rgba(16, 185, 129, 0.1)' 
              : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${formData.existingCustomer ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>
                {formData.existingCustomer ? '✅' : '🆕'}
              </span>
              <div>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1rem' }}>
                  {formData.existingCustomer ? 'ID Verified!' : 'New Customer'}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: '5px 0 0 0', fontSize: '0.85rem' }}>
                  {formData.existingCustomer 
                    ? 'Your information will be pre-filled in the next step.'
                    : 'Please fill in your information in the next step.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={nextStep}
            disabled={!canProceed}
            className="mars-order-add-btn"
            style={{ 
              opacity: canProceed ? 1 : 0.5,
              cursor: canProceed ? 'pointer' : 'not-allowed'
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreIdVerificationStep;
