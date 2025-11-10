import React, { useCallback } from 'react';

const SponsorsStep = ({ formData, updateFormData, nextStep, prevStep }) => {
  const addSponsor = () => {
    const newSponsor = {
      full_name: '',
      phone: '',
      id_card_number: '',
      relationship: '',
      address: '',
      id_card_image: null
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
              {/* ID Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID Card Number *
                </label>
                <input
                  type="text"
                  value={sponsor.id_card_number}
                  onChange={(e) => updateSponsor(index, 'id_card_number', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="ID card number"
                />
              </div>

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
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSponsorFileChange(index, e)}
                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                {sponsor.id_card_image && (
                  <span className="text-green-400 text-sm">
                    ✅ Image selected
                  </span>
                )}
              </div>
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