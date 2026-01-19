import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import '../../styles/store.css';

const StoreCustomerInfoStep = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [checkingName, setCheckingName] = useState(false);
  const [nameEditable, setNameEditable] = useState(true);

  // Check if full_name exists in contract_customers when component mounts or when ID changes
  useEffect(() => {
    if (formData.customer.id_card_number && formData.customer.id_card_number.trim()) {
      checkFullNameInDatabase();
    }
  }, [formData.customer.id_card_number, formData.existingCustomer]);

  const checkFullNameInDatabase = async () => {
    if (!formData.customer.id_card_number || !formData.customer.id_card_number.trim()) {
      return;
    }

    // First check if we already have existingCustomer from step 1
    if (formData.existingCustomer && formData.existingCustomer.source_table === 'contract_customers' && formData.existingCustomer.full_name) {
      // Customer found in contract_customers, use their full_name and make it non-editable
      updateFormData({
        customer: {
          ...formData.customer,
          full_name: formData.existingCustomer.full_name
        }
      });
      setNameEditable(false);
      return;
    }

    setCheckingName(true);
    try {
      const response = await fetch('http://localhost:5000/api/customers/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_card_number: formData.customer.id_card_number }),
      });

      const data = await response.json();

      // Check if customer exists in contract_customers table (not users table)
      if (data.exists && data.customerData && data.source_table === 'contract_customers' && data.customerData.full_name) {
        // Name exists in contract_customers, make it non-editable
        updateFormData({
          customer: {
            ...formData.customer,
            full_name: data.customerData.full_name
          }
        });
        setNameEditable(false);
      } else {
        // Name doesn't exist in contract_customers, make it editable
        setNameEditable(true);
      }
    } catch (error) {
      console.error('Error checking full name:', error);
      setNameEditable(true);
    } finally {
      setCheckingName(false);
    }
  };

  const handleCustomerChange = (field, value) => {
    updateFormData({
      customer: {
        ...formData.customer,
        [field]: value
      }
    });
  };

  const canProceed = () => {
    const { customer } = formData;
    return customer.full_name.trim() && 
           customer.phone.trim() && 
           customer.id_card_number.trim() && 
           customer.address.trim();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: 'rgb(181,62,32)', fontSize: '1.5rem', marginBottom: '20px' }}>
        Step 2: Customer Information
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Full Name */}
        <div>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
            Full Name *
          </label>
          {checkingName ? (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Checking...</div>
          ) : (
            <input
              type="text"
              value={formData.customer.full_name}
              onChange={(e) => handleCustomerChange('full_name', e.target.value)}
              disabled={!nameEditable}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: nameEditable ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: nameEditable ? 'white' : 'rgba(255,255,255,0.6)',
                fontSize: '0.9rem',
                cursor: nameEditable ? 'text' : 'not-allowed'
              }}
              placeholder="Enter your full name"
            />
          )}
          {!nameEditable && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '5px' }}>
              Name found in database and cannot be edited
            </p>
          )}
        </div>

        {/* Phone & ID Card Number */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.customer.phone}
              onChange={(e) => handleCustomerChange('phone', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.9rem'
              }}
              placeholder="Phone number"
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
              ID Card Number *
            </label>
            <input
              type="text"
              value={formData.customer.id_card_number}
              readOnly
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.9rem',
                cursor: 'not-allowed'
              }}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
            Email Address
          </label>
          <input
            type="email"
            value={formData.customer.email}
            readOnly
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.9rem',
              cursor: 'not-allowed'
            }}
            placeholder="email@example.com"
          />
        </div>

        {/* Address */}
        <div>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
            Address *
          </label>
          <textarea
            value={formData.customer.address}
            onChange={(e) => handleCustomerChange('address', e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem',
              resize: 'vertical'
            }}
            placeholder="Full residential address"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            onClick={prevStep}
            className="mars-order-installment-btn"
          >
            ← Back
          </button>
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="mars-order-add-btn"
            style={{ 
              opacity: canProceed() ? 1 : 0.5,
              cursor: canProceed() ? 'pointer' : 'not-allowed'
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreCustomerInfoStep;
