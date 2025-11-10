import React, { useCallback, useEffect } from 'react';

const CustomerInfoStep = ({ formData, updateFormData, nextStep, prevStep }) => {
  const handleCustomerChange = (field, value) => {
    updateFormData({
      customer: {
        ...formData.customer,
        [field]: value
      }
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      handleCustomerChange('id_card_image', file);
    }
  };

  const canProceed = () => {
    const { customer } = formData;
    return customer.full_name.trim() && 
           customer.phone.trim() && 
           customer.id_card_number.trim() && 
           customer.address.trim();
  };

  // Display existing image if available
  const renderExistingImage = () => {
    if (formData.customer.id_card_image && typeof formData.customer.id_card_image === 'string') {
      // This is a base64 image from existing customer
      return (
        <div className="mt-2">
          <p className="text-sm text-green-400 mb-2">Existing ID Card Image:</p>
          <img 
            src={`data:image/jpeg;base64,${formData.customer.id_card_image}`} 
            alt="Existing ID Card"
            className="w-32 h-20 object-cover rounded border border-gray-600"
          />
          <p className="text-xs text-gray-400 mt-1">
            This image is already on file. Upload a new one only if you need to update it.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Step 2: Customer Information</h2>
      
      <div className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.customer.full_name}
            onChange={(e) => handleCustomerChange('full_name', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Enter customer's full name"
          />
        </div>

        {/* Phone & ID Card Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.customer.phone}
              onChange={(e) => handleCustomerChange('phone', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID Card Number *
            </label>
            <input
              type="text"
              value={formData.customer.id_card_number}
              onChange={(e) => handleCustomerChange('id_card_number', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="ID card number"
              readOnly // ID card number is set from previous step and shouldn't be changed
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.customer.email}
            onChange={(e) => handleCustomerChange('email', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="email@example.com"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Address *
          </label>
          <textarea
            value={formData.customer.address}
            onChange={(e) => handleCustomerChange('address', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Full residential address"
          />
        </div>

        {/* ID Card Image */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ID Card Image
          </label>
          
          {/* Show existing image if available */}
          {renderExistingImage()}
          
          <div className="flex items-center gap-4 mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {formData.customer.id_card_image && formData.customer.id_card_image instanceof File && (
              <span className="text-green-400 text-sm">
                ✅ New image selected
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            {formData.existingCustomer && formData.customer.id_card_image && typeof formData.customer.id_card_image === 'string' 
              ? 'Upload a new image only if you need to update the existing one. Leave empty to keep the current image.'
              : 'Upload a clear photo of the customer\'s ID card (max 5MB)'}
          </p>
        </div>

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
            Continue to Sponsors →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoStep;