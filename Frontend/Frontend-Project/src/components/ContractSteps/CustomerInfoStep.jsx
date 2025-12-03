import React, { useCallback, useState } from 'react';
import ImageModal from './ImageModal';
import toast from 'react-hot-toast';

// Add this function to compress images before upload
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 800px)
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 70% quality
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          console.log(`Image compressed: ${file.size} bytes → ${blob.size} bytes (${Math.round(blob.size / file.size * 100)}%)`);
          
          // If still too large, convert to data URL and limit size
          if (blob.size > 500 * 1024) { // Still > 500KB
            console.warn('Image still too large, further reducing quality...');
            canvas.toBlob(
              (finalBlob) => {
                const finalFile = new File([finalBlob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(finalFile);
              },
              'image/jpeg',
              0.5 // Further reduce quality to 50%
            );
          } else {
            resolve(compressedFile);
          }
        }, 'image/jpeg', 0.7); // 70% quality
      };
      
      img.onerror = reject;
    };
    
    reader.onerror = reject;
  });
};

const CustomerInfoStep = ({ formData, updateFormData, nextStep, prevStep, isReapplication = false }) => {
  const [viewingImage, setViewingImage] = useState(false);

  const handleCustomerChange = (field, value) => {
    updateFormData({
      customer: {
        ...formData.customer,
        [field]: value
      }
    });
  };

  // Update file change handler with compression
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    try {
      // Show loading
      toast.loading('Compressing image...', { id: 'compressing' });
      
      // Compress the image
      const compressedFile = await compressImage(file);
      
      toast.dismiss('compressing');
      
      if (compressedFile.size > 500 * 1024) {
        toast.warning('Image is still large, quality reduced for upload');
      }
      
      // Update form data
      handleCustomerChange('id_card_image', compressedFile);
      
      toast.success('Image ready for upload');
    } catch (error) {
      console.error('Image compression error:', error);
      toast.dismiss('compressing');
      toast.error('Failed to process image');
      
      // Fallback: use original file
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
                  : formData.customer.id_card_image instanceof File 
                    ? `Compressed image: ${Math.round(formData.customer.id_card_image.size / 1024)}KB`
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
      
      {/* Reapplication Notice */}
      {isReapplication && (
        <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <div className="text-blue-400 text-xl">✏️</div>
            <div>
              <h3 className="font-semibold text-blue-400">Edit Customer Information</h3>
              <p className="text-sm text-blue-300 mt-1">
                You can update customer details as needed. All changes will be saved to the new contract.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
              readOnly={isReapplication && formData.existingCustomer}
            />
            {isReapplication && formData.existingCustomer && (
              <p className="text-xs text-yellow-400 mt-1">
                ID card number cannot be changed for existing customer
              </p>
            )}
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
              : 'Upload a clear photo of the customer\'s ID card (max 5MB). Images are automatically compressed for faster upload.'}
            {isReapplication && (
              <span className="text-blue-400 block mt-1">
                • For reapplication: You can update the ID card image if needed.
              </span>
            )}
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