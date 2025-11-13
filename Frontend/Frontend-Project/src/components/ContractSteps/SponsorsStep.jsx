import React, { useCallback, useState } from 'react';
import ImageModal from './ImageModal';
import toast from 'react-hot-toast';

const SponsorsStep = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [viewingImage, setViewingImage] = useState(null);
  const [verifyingSponsors, setVerifyingSponsors] = useState({});

  const addSponsor = () => {
    const newSponsor = {
      full_name: '',
      phone: '',
      id_card_number: '',
      relationship: '',
      address: '',
      id_card_image: null,
      existingCustomer: null,
      searched: false
    };
    
    updateFormData({
      sponsors: [...formData.sponsors, newSponsor]
    });
  };

  const removeSponsor = (index) => {
    const updatedSponsors = formData.sponsors.filter((_, i) => i !== index);
    updateFormData({ sponsors: updatedSponsors });
  };

  const updateSponsor = (index, field, value) => {
    const updatedSponsors = formData.sponsors.map((sponsor, i) => 
      i === index ? { ...sponsor, [field]: value } : sponsor
    );
    
    updateFormData({ sponsors: updatedSponsors });
  };

  const handleSponsorIdCardChange = (index, e) => {
    const idCardNumber = e.target.value;
    updateSponsor(index, 'id_card_number', idCardNumber);
    
    // Reset search status when ID card number changes
    if (formData.sponsors[index].searched) {
      updateSponsor(index, 'searched', false);
    }
    if (formData.sponsors[index].existingCustomer) {
      updateSponsor(index, 'existingCustomer', null);
    }
  };

  const handleSponsorKeyPress = (index, e) => {
    if (e.key === 'Enter') {
      verifySponsorIdCard(index);
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

    setVerifyingSponsors(prev => ({ ...prev, [index]: true }));
    
    try {
      console.log('Verifying sponsor ID:', sponsor.id_card_number);
      
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
      console.log('Sponsor verification response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (data.exists && data.customerData) {
        // Pre-fill sponsor data if exists (BUT DON'T SAVE TO DATABASE)
        const customerData = data.customerData;
        console.log('Found existing customer:', customerData);
        
        // Create updated sponsor object with all changes
        const updatedSponsor = {
          ...sponsor,
          full_name: customerData.full_name || '',
          phone: customerData.phone || '',
          address: customerData.address || '',
          id_card_image: customerData.id_card_image || null,
          existingCustomer: customerData,
          searched: true
        };

        // Update the entire sponsor at once
        const updatedSponsors = [...formData.sponsors];
        updatedSponsors[index] = updatedSponsor;
        
        updateFormData({ 
          sponsors: updatedSponsors 
        });
        
        let sourceInfo = '';
        if (data.source_table === 'contract_customers') {
          sourceInfo = ' (found in customers table)';
        } else if (data.source_table === 'users') {
          sourceInfo = ' (found in users table)';
        } else if (data.source_table === 'contract_sponsors') {
          sourceInfo = ' (found in sponsors table)';
        }
        
        toast.success(`Sponsor found!${sourceInfo}`);
      } else {
        console.log('No existing customer found');
        // Update only the searched status
        const updatedSponsors = [...formData.sponsors];
        updatedSponsors[index] = {
          ...sponsor,
          existingCustomer: null,
          searched: true
        };
        
        updateFormData({ 
          sponsors: updatedSponsors 
        });
        
        toast.success('ID card not found. Please fill in sponsor information.');
      }
    } catch (error) {
      console.error('Sponsor verification error:', error);
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        toast.error('Network error: Cannot connect to server');
      } else {
        toast.error(error.message || 'Failed to verify sponsor ID card');
      }
    } finally {
      setVerifyingSponsors(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSponsorFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      updateSponsor(index, 'id_card_image', file);
    }
  };

  const handleViewSponsorImage = (sponsor, index) => {
    if (sponsor.id_card_image) {
      setViewingImage({ sponsor, index, type: 'sponsor' });
    }
  };

  const handleCloseImageModal = () => {
    setViewingImage(null);
  };

  const getSponsorImageSrc = (sponsor) => {
    if (!sponsor.id_card_image) return null;
    
    if (typeof sponsor.id_card_image === 'string') {
      return `data:image/jpeg;base64,${sponsor.id_card_image}`;
    } else if (sponsor.id_card_image instanceof File) {
      return URL.createObjectURL(sponsor.id_card_image);
    }
    return null;
  };

  const renderSponsorImage = (sponsor, index) => {
    const imageSrc = getSponsorImageSrc(sponsor);
    if (imageSrc) {
      return (
        <div className="mt-2">
          <p className="text-sm text-green-400 mb-2">ID Card Image:</p>
          <div className="flex items-center gap-4">
            <img 
              src={imageSrc} 
              alt="Sponsor ID Card"
              className="w-24 h-16 object-cover rounded border border-gray-600 cursor-pointer hover:border-blue-500 transition-colors duration-200"
              onClick={() => handleViewSponsorImage(sponsor, index)}
            />
            <div>
              <button
                type="button"
                onClick={() => handleViewSponsorImage(sponsor, index)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors duration-200 mb-1"
              >
                🔍 View
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const canProceed = () => {
    if (formData.sponsors.length === 0) return false;
    
    return formData.sponsors.every(sponsor => 
      sponsor.full_name.trim() && 
      sponsor.phone.trim() && 
      sponsor.id_card_number.trim() && 
      sponsor.address.trim()
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Step 3: Sponsors Information</h2>
      
      <div className="space-y-6">
        {/* Sponsors List */}
        {formData.sponsors.map((sponsor, index) => (
          <div key={index} className="bg-gray-700/50 p-6 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Sponsor {index + 1}</h3>
              {formData.sponsors.length > 1 && (
                <button
                  onClick={() => removeSponsor(index)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors duration-200"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Source Information */}
            {sponsor.existingCustomer && (
              <div className="bg-blue-900/20 border border-blue-500 p-3 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-blue-400 text-lg">ℹ️</div>
                  <div>
                    <h3 className="font-semibold text-blue-400 text-sm">Data Source</h3>
                    <p className="text-xs text-gray-300 mt-1">
                      Found in: <strong>{sponsor.existingCustomer.source_table}</strong> as <strong>{sponsor.existingCustomer.type}</strong>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Information will be used for this contract only
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ID Card Verification */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID Card Number *
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={sponsor.id_card_number}
                  onChange={(e) => handleSponsorIdCardChange(index, e)}
                  onKeyPress={(e) => handleSponsorKeyPress(index, e)}
                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Enter sponsor's ID card number"
                  disabled={verifyingSponsors[index]}
                />
                <button
                  onClick={() => verifySponsorIdCard(index)}
                  disabled={verifyingSponsors[index] || !sponsor.id_card_number.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  {verifyingSponsors[index] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
            </div>

            {/* Verification Result */}
            {sponsor.searched && (
              <div className={`p-3 rounded-lg border mb-4 ${
                sponsor.existingCustomer 
                  ? 'bg-green-900/20 border-green-500' 
                  : 'bg-blue-900/20 border-blue-500'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`text-xl ${
                    sponsor.existingCustomer ? 'text-green-400' : 'text-blue-400'
                  }`}>
                    {sponsor.existingCustomer ? '✅' : '🆕'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {sponsor.existingCustomer 
                        ? 'Sponsor Found!' 
                        : 'New Sponsor'}
                    </h3>
                    <p className="text-xs text-gray-300 mt-1">
                      {sponsor.existingCustomer 
                        ? `Existing ${sponsor.existingCustomer.type} found. You can review and update their information.`
                        : 'This is a new sponsor. Please fill in their information.'}
                    </p>
                    {sponsor.existingCustomer && (
                      <div className="mt-1 text-xs text-gray-400">
                        <p><strong>Name:</strong> {sponsor.full_name}</p>
                        <p><strong>Phone:</strong> {sponsor.phone}</p>
                        {sponsor.address && (
                          <p><strong>Address:</strong> {sponsor.address}</p>
                        )}
                        {sponsor.id_card_image && (
                          <p><strong>ID Card Image:</strong> ✅ Already on file</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={sponsor.full_name}
                  onChange={(e) => updateSponsor(index, 'full_name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Sponsor's full name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={sponsor.phone}
                  onChange={(e) => updateSponsor(index, 'phone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Relationship */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={sponsor.relationship}
                  onChange={(e) => updateSponsor(index, 'relationship', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Father, Mother, Friend"
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address *
              </label>
              <textarea
                value={sponsor.address}
                onChange={(e) => updateSponsor(index, 'address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Full residential address"
              />
            </div>

            {/* ID Card Image */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID Card Image
              </label>
              
              {/* Show existing image if available */}
              {renderSponsorImage(sponsor, index)}
              
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSponsorFileChange(index, e)}
                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                {sponsor.id_card_image && sponsor.id_card_image instanceof File && !renderSponsorImage(sponsor, index) && (
                  <span className="text-green-400 text-sm">
                    ✅ Image selected
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {sponsor.existingCustomer && sponsor.id_card_image && typeof sponsor.id_card_image === 'string' 
                  ? 'Upload a new image only if you need to update the existing one. Leave empty to keep the current image.'
                  : 'Upload a clear photo of the sponsor\'s ID card (max 5MB)'}
              </p>
            </div>
          </div>
        ))}

        {/* Add Sponsor Button */}
        <div className="flex justify-center">
          <button
            onClick={addSponsor}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <span>+</span>
            Add Another Sponsor
          </button>
        </div>

        {/* Minimum Sponsor Requirement */}
        {formData.sponsors.length === 0 && (
          <div className="bg-yellow-900/20 border border-yellow-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl text-yellow-400">⚠️</div>
              <div>
                <h3 className="font-semibold text-yellow-400">Sponsors Required</h3>
                <p className="text-sm text-yellow-300 mt-1">
                  At least one sponsor is required for installment contracts. 
                  Click "Add Sponsor" above to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal for Sponsors */}
        {viewingImage && (
          <ImageModal
            isOpen={!!viewingImage}
            imageSrc={getSponsorImageSrc(viewingImage.sponsor)}
            customer={viewingImage.sponsor}
            onClose={handleCloseImageModal}
            type="sponsor"
          />
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <button
            onClick={prevStep}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            ← Back
          </button>
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100"
          >
            Continue to Contract Details →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SponsorsStep;