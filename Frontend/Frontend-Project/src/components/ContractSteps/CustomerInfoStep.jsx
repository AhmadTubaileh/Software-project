import React, { useCallback, useState } from 'react';
import ImageModal from './ImageModal';
import toast from 'react-hot-toast';

const CustomerInfoStep = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [viewingImage, setViewingImage] = useState(false);

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
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      handleCustomerChange('id_card_image', file);
    }
  };

  const handleViewImage = () => {
    if (formData.customer.id_card_image) {
      setViewingImage(true);
    }
  };

  const handleCloseImageModal = () => {
    setViewingImage(false);
  };

  const getImageSrc = () => {
    if (!formData.customer.id_card_image) return null;
    
    if (typeof formData.customer.id_card_image === 'string') {
      return `data:image/jpeg;base64,${formData.customer.id_card_image}`;
    } else if (formData.customer.id_card_image instanceof File) {
      return URL.createObjectURL(formData.customer.id_card_image);
    }
    return null;
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
    const imageSrc = getImageSrc();
    if (imageSrc) {
      return (
        <div className="mt-2">
          <p className="text-sm text-green-400 mb-2">ID Card Image:</p>
          <div className="flex items-center gap-4">
            <img 
              src={imageSrc} 
              alt="ID Card"
              className="w-32 h-20 object-cover rounded border border-gray-600 cursor-pointer hover:border-blue-500 transition-colors duration-200"
              onClick={handleViewImage}
            />
            <div>
              <button
                type="button"
                onClick={handleViewImage}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors duration-200 mb-2"
              >
                🔍 View Full Size
              </button>
              <p className="text-xs text-gray-400">
                {typeof formData.customer.id_card_image === 'string' 
                  ? 'Existing image from database'
                  : 'New image selected'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Step 2: Customer Information</h2>
      
      <div className="space-y-6">
        {/* Source Information */}
        {formData.existingCustomer && (
          <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-blue-400 text-xl">ℹ️</div>
              <div>
                <h3 className="font-semibold text-blue-400">Data Source</h3>
                <p className="text-sm text-gray-300 mt-1">
                  Found in: <strong>{formData.existingCustomer.source_table}</strong> as <strong>{formData.existingCustomer.type}</strong>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Information will be used for this contract only
                </p>
              </div>
            </div>
          </div>
        )}

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
              readOnly
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
            {formData.customer.id_card_image && formData.customer.id_card_image instanceof File && !renderExistingImage() && (
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

        {/* Image Modal */}
        {viewingImage && (
          <ImageModal
            isOpen={viewingImage}
            imageSrc={getImageSrc()}
            customer={formData.customer}
            onClose={handleCloseImageModal}
            type="customer"
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
            Continue to Sponsors →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoStep;