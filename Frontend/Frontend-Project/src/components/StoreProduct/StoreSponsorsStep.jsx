import React, { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import '../../styles/store.css';

const StoreSponsorsStep = ({ formData, updateFormData, nextStep, prevStep }) => {
  // Check if ID card number already exists (customer or other sponsors)
  const isIdCardDuplicate = useCallback((idCardNumber, currentSponsorIndex) => {
    if (!idCardNumber.trim()) return false;
    
    // Check against customer ID card
    if (formData.customer.id_card_number === idCardNumber) {
      return true;
    }
    
    // Check against other sponsors (excluding current sponsor)
    return formData.sponsors.some((sponsor, index) => 
      index !== currentSponsorIndex && 
      sponsor.id_card_number === idCardNumber
    );
  }, [formData.customer.id_card_number, formData.sponsors]);

  // Add this new function to handle image upload
  const handleImageUpload = (index, file) => {
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      
      const updatedSponsors = [...formData.sponsors];
      updatedSponsors[index] = {
        ...updatedSponsors[index],
        id_card_image: imageDataUrl // Store as base64 data URL
      };
      
      updateFormData({ sponsors: updatedSponsors });
      toast.success('Image uploaded successfully');
    };
    
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    
    reader.readAsDataURL(file);
  };

  // Add this function to remove image
  const removeImage = (index) => {
    const updatedSponsors = [...formData.sponsors];
    updatedSponsors[index] = {
      ...updatedSponsors[index],
      id_card_image: null
    };
    
    updateFormData({ sponsors: updatedSponsors });
    toast.success('Image removed');
  };

  const addSponsor = () => {
    if (formData.sponsors.length >= 5) {
      toast.error('Maximum 5 sponsors allowed');
      return;
    }
    
    const newSponsor = {
      full_name: '',
      phone: '',
      id_card_number: '',
      relationship: '',
      address: '',
      id_card_image: null, // Add image field
      existingCustomer: null,
      searched: false,
      isDuplicate: false
    };
    
    updateFormData({
      sponsors: [...formData.sponsors, newSponsor]
    });
  };

  const removeSponsor = (index) => {
    const updatedSponsors = formData.sponsors.filter((_, i) => i !== index);
    updateFormData({ sponsors: updatedSponsors });
    toast.success('Sponsor removed');
  };

  const updateSponsor = (index, field, value) => {
    const updatedSponsors = formData.sponsors.map((sponsor, i) => 
      i === index ? { ...sponsor, [field]: value, isDuplicate: false } : sponsor
    );
    
    updateFormData({ sponsors: updatedSponsors });
  };

  const handleSponsorIdCardChange = (index, e) => {
    const idCardNumber = e.target.value;
    
    // Update ID card but preserve other fields
    const updatedSponsors = [...formData.sponsors];
    updatedSponsors[index] = {
      ...updatedSponsors[index],
      id_card_number: idCardNumber,
      isDuplicate: false,
      id_card_image: null // Clear image when ID changes
    };
    
    updateFormData({ sponsors: updatedSponsors });
    
    // Check for duplicates
    if (idCardNumber.trim() && isIdCardDuplicate(idCardNumber, index)) {
      updatedSponsors[index].isDuplicate = true;
      updateFormData({ sponsors: updatedSponsors });
    }
  };

  // Check for duplicates on component mount and when sponsors change
  useEffect(() => {
    const updatedSponsors = formData.sponsors.map((sponsor, index) => ({
      ...sponsor,
      isDuplicate: sponsor.id_card_number.trim() ? isIdCardDuplicate(sponsor.id_card_number, index) : false
    }));
    
    const hasChanges = updatedSponsors.some((sponsor, index) => 
      sponsor.isDuplicate !== formData.sponsors[index]?.isDuplicate
    );
    
    if (hasChanges) {
      updateFormData({ sponsors: updatedSponsors });
    }
  }, [formData.sponsors, formData.customer.id_card_number, isIdCardDuplicate, updateFormData]);

  // Update the canProceed function to check for image
  const canProceed = () => {
    if (formData.sponsors.length === 0) return false;
    
    return formData.sponsors.every(sponsor => 
      sponsor.full_name.trim() && 
      sponsor.phone.trim() && 
      sponsor.id_card_number.trim() && 
      sponsor.address.trim() &&
      sponsor.id_card_image && // Check if image exists
      !sponsor.isDuplicate
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: 'rgb(181,62,32)', fontSize: '1.5rem', marginBottom: '20px' }}>
        Step 3: Sponsors Information
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Sponsors List */}
        {formData.sponsors.map((sponsor, index) => (
          <div key={index} style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${sponsor.isDuplicate ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.1)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: 'white', fontSize: '1.1rem', margin: 0 }}>Sponsor {index + 1}</h3>
              {formData.sponsors.length > 1 && (
                <button
                  onClick={() => removeSponsor(index)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgb(239, 68, 68)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Duplicate Warning */}
            {sponsor.isDuplicate && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '15px'
              }}>
                <div style={{ color: 'rgb(239, 68, 68)', fontSize: '0.9rem' }}>
                  ⚠️ {formData.customer.id_card_number === sponsor.id_card_number
                    ? 'This ID card belongs to the customer. Customer cannot be a sponsor.'
                    : 'This ID card already exists in another sponsor. Please use a different ID card.'}
                </div>
              </div>
            )}

            {/* ID Card Verification */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
                ID Card Number *
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={sponsor.id_card_number}
                  onChange={(e) => handleSponsorIdCardChange(index, e)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: sponsor.isDuplicate ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.6)',
                    border: `1px solid ${sponsor.isDuplicate ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="Enter sponsor's ID card number"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={sponsor.full_name}
                  onChange={(e) => updateSponsor(index, 'full_name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                  placeholder="Sponsor's full name"
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={sponsor.phone}
                  onChange={(e) => updateSponsor(index, 'phone', e.target.value)}
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
            </div>

            {/* Relationship */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
                Relationship
              </label>
              <input
                type="text"
                value={sponsor.relationship}
                onChange={(e) => updateSponsor(index, 'relationship', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
                placeholder="e.g., Father, Mother, Friend"
              />
            </div>

            {/* Address */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
                Address *
              </label>
              <textarea
                value={sponsor.address}
                onChange={(e) => updateSponsor(index, 'address', e.target.value)}
                rows={2}
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

            {/* ID Card Image Upload - NEW SECTION */}
            <div>
              <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>
                ID Card Image *
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginLeft: '5px' }}>
                  (Required - Upload front side of ID card)
                </span>
              </label>
              
              {sponsor.id_card_image ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ position: 'relative', maxWidth: '200px' }}>
                    <img
                      src={sponsor.id_card_image}
                      alt="ID Card"
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '2px solid rgba(59, 130, 246, 0.5)'
                      }}
                    />
                    <button
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <p style={{ color: 'rgb(34, 197, 94)', fontSize: '0.85rem' }}>
                    ✓ Image uploaded successfully
                  </p>
                </div>
              ) : (
                <div style={{
                  border: '2px dashed rgba(59, 130, 246, 0.5)',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    id={`sponsor-image-${index}`}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleImageUpload(index, file);
                      e.target.value = ''; // Reset input
                    }}
                  />
                  <label htmlFor={`sponsor-image-${index}`} style={{ cursor: 'pointer' }}>
                    <div style={{ color: 'rgb(59, 130, 246)', marginBottom: '8px' }}>
                      <svg style={{ width: '48px', height: '48px', margin: '0 auto' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div style={{ color: 'white', fontSize: '0.9rem', marginBottom: '4px' }}>
                      Click to upload ID card image
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                      JPG, PNG (Max 5MB)
                    </div>
                  </label>
                </div>
              )}
              
              {/* Image requirement message */}
              {!sponsor.id_card_image && (
                <p style={{ color: 'rgb(239, 68, 68)', fontSize: '0.8rem', marginTop: '8px' }}>
                  ⚠️ ID card image is required for each sponsor
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Add Sponsor Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={addSponsor}
            disabled={formData.sponsors.length >= 5}
            className="mars-header-button"
            style={{ opacity: formData.sponsors.length >= 5 ? 0.5 : 1 }}
          >
            + Add Sponsor ({formData.sponsors.length}/5)
          </button>
        </div>

        {/* Minimum Sponsor Requirement */}
        {formData.sponsors.length === 0 && (
          <div style={{
            backgroundColor: 'rgba(255, 178, 0, 0.1)',
            border: '1px solid rgba(255, 178, 0, 0.3)',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <div style={{ color: 'rgb(255, 178, 0)', fontSize: '0.9rem' }}>
              ⚠️ At least one sponsor is required for installment contracts. Click "Add Sponsor" above to continue.
            </div>
          </div>
        )}

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

export default StoreSponsorsStep;