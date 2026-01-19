import React, { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import '../../styles/store.css';

const StoreSponsorsStep = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [verifyingSponsors, setVerifyingSponsors] = useState({});

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
      id_card_image: null,
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
      isDuplicate: false
    };
    
    updateFormData({ sponsors: updatedSponsors });
    
    // Check for duplicates
    if (idCardNumber.trim() && isIdCardDuplicate(idCardNumber, index)) {
      updatedSponsors[index].isDuplicate = true;
      updateFormData({ sponsors: updatedSponsors });
    }
  };

  const verifySponsorIdCard = async (index) => {
    const sponsor = formData.sponsors[index];
    
    if (!sponsor.id_card_number.trim()) {
      toast.error('Please enter an ID card number');
      return;
    }

    if (sponsor.id_card_number.trim().length < 5) {
      toast.error('Please enter a valid ID card number');
      return;
    }

    // Check for duplicates before verifying
    if (isIdCardDuplicate(sponsor.id_card_number, index)) {
      if (formData.customer.id_card_number === sponsor.id_card_number) {
        toast.error('This ID card belongs to the customer. Customer cannot be a sponsor.');
      } else {
        toast.error('This ID card already exists in another sponsor. Duplicate sponsors are not allowed.');
      }
      
      // Mark as duplicate but DON'T disable fields
      const updatedSponsors = [...formData.sponsors];
      updatedSponsors[index].isDuplicate = true;
      updateFormData({ sponsors: updatedSponsors });
      return;
    }

    setVerifyingSponsors(prev => ({ ...prev, [index]: true }));
    
    try {
      const response = await fetch('http://localhost:5000/api/customers/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id_card_number: sponsor.id_card_number,
          target_type: 'sponsor' 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (data.exists && data.customerData) {
        // Person found - auto-fill ONLY empty fields, preserve existing values
        const customerData = data.customerData;
        
        const updatedSponsor = {
          ...sponsor, // Keep existing values
          full_name: sponsor.full_name || customerData.full_name || '',
          phone: sponsor.phone || customerData.phone || '',
          address: sponsor.address || customerData.address || '',
          id_card_image: sponsor.id_card_image || customerData.id_card_image || null,
          existingCustomer: customerData,
          searched: true,
          isDuplicate: false
        };

        const updatedSponsors = [...formData.sponsors];
        updatedSponsors[index] = updatedSponsor;
        
        updateFormData({ 
          sponsors: updatedSponsors 
        });
        
        toast.success('Sponsor information updated');
      } else {
        // Person not found - keep all existing fields, just mark as searched
        const updatedSponsor = {
          ...sponsor, // Keep all existing values
          existingCustomer: null,
          searched: true,
          isDuplicate: false
        };
        
        const updatedSponsors = [...formData.sponsors];
        updatedSponsors[index] = updatedSponsor;
        
        updateFormData({ 
          sponsors: updatedSponsors 
        });
        
        toast.success('ID card verified. Please fill in sponsor information.');
      }
    } catch (error) {
      console.error('Sponsor verification error:', error);
      toast.error(error.message || 'Failed to verify sponsor ID card');
      
      // Keep existing values on error
      const updatedSponsor = {
        ...sponsor, // Keep all existing values
        searched: true,
        isDuplicate: false
      };
      
      const updatedSponsors = [...formData.sponsors];
      updatedSponsors[index] = updatedSponsor;
      updateFormData({ sponsors: updatedSponsors });
    } finally {
      setVerifyingSponsors(prev => ({ ...prev, [index]: false }));
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

  const canProceed = () => {
    if (formData.sponsors.length === 0) return false;
    
    return formData.sponsors.every(sponsor => 
      sponsor.full_name.trim() && 
      sponsor.phone.trim() && 
      sponsor.id_card_number.trim() && 
      sponsor.address.trim() &&
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
                  disabled={verifyingSponsors[index]}
                />
                <button
                  onClick={() => verifySponsorIdCard(index)}
                  disabled={verifyingSponsors[index] || !sponsor.id_card_number.trim()}
                  className="mars-header-button"
                  style={{ whiteSpace: 'nowrap', opacity: (verifyingSponsors[index] || !sponsor.id_card_number.trim()) ? 0.6 : 1 }}
                >
                  {verifyingSponsors[index] ? 'Verifying...' : 'Verify'}
                </button>
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
            <div>
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
