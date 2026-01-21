import React, { useState } from 'react';
import toast from 'react-hot-toast';
import '../../styles/store.css';

const StoreCustomerInfoStep = ({ formData, updateFormData, nextStep, currentUser }) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [idCardImage, setIdCardImage] = useState(null);
  const [idCardImagePreview, setIdCardImagePreview] = useState(null);

  const handleCustomerChange = (field, value) => {
    updateFormData({
      customer: {
        ...formData.customer,
        [field]: value
      }
    });
    if (field === 'id_card_number' || field === 'id_card_image') {
      setVerified(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      setIdCardImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setVerified(false);
    }
  };

  const handleVerifyIdCard = async () => {
    if (!idCardImage) {
      toast.error('Please upload your ID card image first');
      return;
    }

    if (!formData.customer.id_card_number || !formData.customer.id_card_number.trim()) {
      toast.error('Please enter your ID card number');
      return;
    }

    if (!currentUser || !currentUser.id) {
      toast.error('User session not found. Please log in again.');
      return;
    }

    setVerifying(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('id_card_image', idCardImage);
      formDataToSend.append('id_card_number', formData.customer.id_card_number.trim());
      formDataToSend.append('user_id', currentUser.id);

      toast.loading('Verifying ID card...', { id: 'verify-id' });

      const response = await fetch('http://localhost:5000/api/ocr/verify-store-customer-id', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();
      toast.dismiss('verify-id');

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (data.verified) {
        setVerified(true);
        updateFormData({
          customer: {
            ...formData.customer,
            id_card_image: idCardImage
          }
        });
        toast.success(data.message || 'ID card verified successfully!');
      } else {
        toast.error(data.message || 'ID verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Failed to verify ID card');
    } finally {
      setVerifying(false);
    }
  };

  const canProceed = () => {
    const { customer } = formData;
    return verified &&
           customer.full_name.trim() && 
           customer.phone.trim() && 
           customer.id_card_number.trim() && 
           customer.address.trim() &&
           idCardImage;
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: 'rgb(181,62,32)', fontSize: '1.5rem', marginBottom: '20px' }}>
        Step 1: Customer Information & ID Verification
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* ID Card Image Upload */}
        <div>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
            ID Card Photo * (Required)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem'
            }}
          />
          {idCardImagePreview && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <img 
                src={idCardImagePreview} 
                alt="ID Card Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }} 
              />
            </div>
          )}
        </div>

        {/* ID Card Number Input */}
        <div>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
            ID Card Number * (Enter manually)
          </label>
          <input
            type="text"
            value={formData.customer.id_card_number}
            onChange={(e) => handleCustomerChange('id_card_number', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem'
            }}
            placeholder="Enter your ID card number"
          />
        </div>

        {/* Verify Button */}
        <div>
          <button
            onClick={handleVerifyIdCard}
            disabled={verifying || !idCardImage || !formData.customer.id_card_number}
            className="mars-header-button"
            style={{ 
              width: '100%',
              opacity: (verifying || !idCardImage || !formData.customer.id_card_number) ? 0.6 : 1,
              backgroundColor: verified ? 'rgb(16, 185, 129)' : undefined
            }}
          >
            {verifying ? 'Verifying...' : verified ? '✓ Verified' : 'Verify ID Card'}
          </button>
          {verified && (
            <p style={{ color: 'rgb(16, 185, 129)', fontSize: '0.85rem', marginTop: '8px', textAlign: 'center' }}>
              ✓ ID card verified successfully! You can now continue.
            </p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
            Full Name *
          </label>
          <input
            type="text"
            value={formData.customer.full_name}
            onChange={(e) => handleCustomerChange('full_name', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem'
            }}
            placeholder="Enter your full name"
          />
        </div>

        {/* Phone Number */}
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

        {/* Email */}
        <div>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={formData.customer.email}
            onChange={(e) => handleCustomerChange('email', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.9rem'
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

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
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
