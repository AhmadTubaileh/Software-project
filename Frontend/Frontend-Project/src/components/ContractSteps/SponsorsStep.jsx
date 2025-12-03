import React, { useCallback, useState, useEffect } from 'react';
import ImageModal from './ImageModal';
import toast from 'react-hot-toast';

// Image compression function
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    // If file is already small (< 500KB), skip compression
    if (file.size <= 500 * 1024) {
      console.log(`Image already small (${Math.round(file.size / 1024)}KB), skipping compression`);
      resolve(file);
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 800px on the longest side)
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        const MAX_FILE_SIZE = 500 * 1024; // 500KB
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with white background for transparent PNGs
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine compression quality based on original size
        let quality = 0.8; // Start with 80% quality
        if (file.size > 2 * 1024 * 1024) { // > 2MB
          quality = 0.6;
        } else if (file.size > 1 * 1024 * 1024) { // > 1MB
          quality = 0.7;
        }
        
        // Convert to JPEG (smaller than PNG)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + '.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          console.log(`✅ Image compressed: ${Math.round(file.size / 1024)}KB → ${Math.round(blob.size / 1024)}KB (${Math.round((blob.size / file.size) * 100)}%)`);
          
          // If still too large, reduce quality further
          if (blob.size > MAX_FILE_SIZE) {
            console.log('Image still large, reducing quality further...');
            canvas.toBlob(
              (finalBlob) => {
                if (!finalBlob) {
                  resolve(compressedFile); // Return previous version
                  return;
                }
                
                const finalFile = new File([finalBlob], compressedFile.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                
                console.log(`✅ Further compressed: ${Math.round(finalBlob.size / 1024)}KB`);
                resolve(finalFile);
              },
              'image/jpeg',
              0.5 // 50% quality
            );
          } else {
            resolve(compressedFile);
          }
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => {
        console.error('Failed to load image for compression');
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = (error) => {
      console.error('Failed to read file:', error);
      reject(error);
    };
  });
};

const SponsorsStep = ({ formData, updateFormData, nextStep, prevStep, isReapplication = false }) => {
  const [viewingImage, setViewingImage] = useState(null);
  const [verifyingSponsors, setVerifyingSponsors] = useState({});
  const [compressingImages, setCompressingImages] = useState({});

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
    // Check maximum sponsors limit
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
      i === index ? { ...sponsor, [field]: value } : sponsor
    );
    
    updateFormData({ sponsors: updatedSponsors });
  };

  const handleSponsorIdCardChange = (index, e) => {
    const idCardNumber = e.target.value;
    
    // Clear all fields when ID card changes
    const clearedSponsor = {
      full_name: '',
      phone: '',
      id_card_number: idCardNumber,
      relationship: formData.sponsors[index].relationship || '', // Keep relationship
      address: '',
      id_card_image: null,
      existingCustomer: null,
      searched: false,
      isDuplicate: false
    };
    
    const updatedSponsors = [...formData.sponsors];
    updatedSponsors[index] = clearedSponsor;
    
    updateFormData({ sponsors: updatedSponsors });
    
    // Check for duplicates
    if (idCardNumber.trim() && isIdCardDuplicate(idCardNumber, index)) {
      updatedSponsors[index].isDuplicate = true;
      updateFormData({ sponsors: updatedSponsors });
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

    // Check for duplicates before verifying
    if (isIdCardDuplicate(sponsor.id_card_number, index)) {
      if (formData.customer.id_card_number === sponsor.id_card_number) {
        toast.error('This ID card belongs to the customer. Customer cannot be a sponsor.');
      } else {
        toast.error('This ID card already exists in another sponsor. Duplicate sponsors are not allowed.');
      }
      
      // Mark as duplicate
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
        // Person found - auto-fill all fields
        const customerData = data.customerData;
        
        const updatedSponsor = {
          ...sponsor,
          full_name: customerData.full_name || '',
          phone: customerData.phone || '',
          address: customerData.address || '',
          id_card_image: customerData.id_card_image || null,
          existingCustomer: customerData,
          searched: true,
          isDuplicate: false
        };

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
        // Person not found - keep ID card but clear other fields
        const updatedSponsor = {
          ...sponsor,
          full_name: '',
          phone: '',
          address: '',
          id_card_image: null,
          existingCustomer: null,
          searched: true,
          isDuplicate: false
        };
        
        const updatedSponsors = [...formData.sponsors];
        updatedSponsors[index] = updatedSponsor;
        
        updateFormData({ 
          sponsors: updatedSponsors 
        });
        
        toast.success('ID card not found. Please fill in sponsor information manually.');
      }
    } catch (error) {
      console.error('Sponsor verification error:', error);
      toast.error(error.message || 'Failed to verify sponsor ID card');
      
      // Clear fields on error
      const updatedSponsor = {
        ...sponsor,
        full_name: '',
        phone: '',
        address: '',
        id_card_image: null,
        existingCustomer: null,
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

  const handleSponsorFileChange = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Check if sponsor has duplicate ID
    const sponsor = formData.sponsors[index];
    if (sponsor.isDuplicate) {
      toast.error('Cannot upload image for duplicate ID card');
      return;
    }
    
    // Set compressing state
    setCompressingImages(prev => ({ ...prev, [index]: true }));
    
    try {
      // Show loading toast
      const loadingToastId = toast.loading('Compressing image...', {
        id: `compressing-${index}`,
        duration: 5000
      });
      
      // Compress the image
      const compressedFile = await compressImage(file);
      
      // Update sponsor with compressed file
      updateSponsor(index, 'id_card_image', compressedFile);
      
      // Show success message
      toast.dismiss(loadingToastId);
      
      const sizeReduction = Math.round((1 - (compressedFile.size / file.size)) * 100);
      if (sizeReduction > 10) {
        toast.success(`Image compressed by ${sizeReduction}%`);
      } else {
        toast.success('Image ready for upload');
      }
      
    } catch (error) {
      console.error('Image compression error:', error);
      toast.dismiss(`compressing-${index}`);
      
      if (error.message === 'Failed to load image') {
        toast.error('Invalid image file. Please try another image.');
      } else {
        toast.error('Failed to compress image. Using original file.');
        // Fallback to original file
        updateSponsor(index, 'id_card_image', file);
      }
    } finally {
      setCompressingImages(prev => ({ ...prev, [index]: false }));
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
      // Check if it's a data URL
      if (sponsor.id_card_image.startsWith('data:')) {
        return sponsor.id_card_image;
      }
      // Assume it's base64 from database
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
              <p className="text-xs text-gray-400">
                {sponsor.id_card_image instanceof File 
                  ? `Size: ${Math.round(sponsor.id_card_image.size / 1024)}KB`
                  : 'From database'
                }
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Check if all required fields are filled for each sponsor
  const validateSponsors = () => {
    if (formData.sponsors.length === 0) return false;
    
    return formData.sponsors.every(sponsor => 
      sponsor.full_name.trim() && 
      sponsor.phone.trim() && 
      sponsor.id_card_number.trim() && 
      sponsor.address.trim() &&
      !sponsor.isDuplicate
    );
  };

  // Check for duplicates on component mount and when sponsors change
  useEffect(() => {
    const updatedSponsors = formData.sponsors.map((sponsor, index) => ({
      ...sponsor,
      isDuplicate: isIdCardDuplicate(sponsor.id_card_number, index)
    }));
    
    // Only update if there are changes
    const hasChanges = updatedSponsors.some((sponsor, index) => 
      sponsor.isDuplicate !== formData.sponsors[index]?.isDuplicate
    );
    
    if (hasChanges) {
      updateFormData({ sponsors: updatedSponsors });
    }
  }, [formData.sponsors, formData.customer.id_card_number, isIdCardDuplicate, updateFormData]);

  const canProceed = () => {
    if (formData.sponsors.length === 0) return false;
    
    return validateSponsors();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024) * 10) / 10 + ' MB';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Step 3: Sponsors Information</h2>
      
      {/* Reapplication Notice */}
      {isReapplication && (
        <div className="bg-green-900/20 border border-green-500 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <div className="text-green-400 text-xl">👥</div>
            <div>
              <h3 className="font-semibold text-green-400">Edit Sponsors</h3>
              <p className="text-sm text-green-300 mt-1">
                You can add, remove, or edit sponsors for the new contract.
              </p>
              {formData.sponsors.length > 0 && (
                <p className="text-xs text-green-400 mt-2">
                  Current sponsors: {formData.sponsors.length} sponsor(s)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Sponsors List */}
        {formData.sponsors.map((sponsor, index) => (
          <div key={index} className={`bg-gray-700/50 p-6 rounded-lg border ${
            sponsor.isDuplicate ? 'border-red-500' : 'border-gray-600'
          }`}>
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

            {/* Duplicate Warning */}
            {sponsor.isDuplicate && (
              <div className="bg-red-900/20 border border-red-500 p-3 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-red-400 text-lg">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-red-400 text-sm">Duplicate ID Card</h3>
                    <p className="text-xs text-red-300 mt-1">
                      {formData.customer.id_card_number === sponsor.id_card_number
                        ? 'This ID card belongs to the customer. Customer cannot be a sponsor.'
                        : 'This ID card already exists in another sponsor. Please use a different ID card.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Source Information */}
            {sponsor.existingCustomer && !sponsor.isDuplicate && (
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
                  className={`flex-1 px-3 py-2 bg-gray-600 border ${
                    sponsor.isDuplicate ? 'border-red-500' : 'border-gray-500'
                  } rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500`}
                  placeholder="Enter sponsor's ID card number"
                  disabled={verifyingSponsors[index] || sponsor.isDuplicate}
                />
                <button
                  onClick={() => verifySponsorIdCard(index)}
                  disabled={verifyingSponsors[index] || !sponsor.id_card_number.trim() || sponsor.isDuplicate}
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
              <p className="text-xs text-gray-400 mt-2">
                Note: Changing ID card will clear all fields
              </p>
            </div>

            {/* Verification Result */}
            {sponsor.searched && !sponsor.isDuplicate && (
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
                        ? `Existing ${sponsor.existingCustomer.type} found.`
                        : 'This is a new sponsor. Please fill in their information.'}
                    </p>
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
                  className={`w-full px-3 py-2 bg-gray-600 border ${
                    sponsor.isDuplicate ? 'border-red-500' : 'border-gray-500'
                  } rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500`}
                  placeholder="Sponsor's full name"
                  disabled={sponsor.isDuplicate}
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
                  className={`w-full px-3 py-2 bg-gray-600 border ${
                    sponsor.isDuplicate ? 'border-red-500' : 'border-gray-500'
                  } rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500`}
                  placeholder="Phone number"
                  disabled={sponsor.isDuplicate}
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
                  className={`w-full px-3 py-2 bg-gray-600 border ${
                    sponsor.isDuplicate ? 'border-red-500' : 'border-gray-500'
                  } rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500`}
                  placeholder="e.g., Father, Mother, Friend"
                  disabled={sponsor.isDuplicate}
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
                className={`w-full px-3 py-2 bg-gray-600 border ${
                  sponsor.isDuplicate ? 'border-red-500' : 'border-gray-500'
                } rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500`}
                placeholder="Full residential address"
                disabled={sponsor.isDuplicate}
              />
            </div>

            {/* ID Card Image */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID Card Image
                {sponsor.id_card_image && (
                  <span className="text-green-400 text-sm ml-2">
                    ✅ Selected ({formatFileSize(
                      sponsor.id_card_image instanceof File 
                        ? sponsor.id_card_image.size 
                        : sponsor.id_card_image.length * 0.75 // Estimate for base64
                    )})
                  </span>
                )}
              </label>
              
              {/* Show existing image if available */}
              {renderSponsorImage(sponsor, index)}
              
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSponsorFileChange(index, e)}
                  className={`flex-1 px-3 py-2 bg-gray-600 border ${
                    sponsor.isDuplicate ? 'border-red-500' : 'border-gray-500'
                  } rounded text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700`}
                  disabled={sponsor.isDuplicate || compressingImages[index]}
                />
                {compressingImages[index] && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-blue-400 text-sm">Compressing...</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {sponsor.existingCustomer && sponsor.id_card_image && typeof sponsor.id_card_image === 'string' 
                  ? 'Upload a new image only if you need to update the existing one.'
                  : 'Upload a clear photo of the sponsor\'s ID card (max 5MB). Images are automatically compressed.'
                }
                {isReapplication && (
                  <span className="text-green-400 block mt-1">
                    • For reapplication: You can update sponsor details as needed.
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}

        {/* Add Sponsor Button */}
        <div className="flex justify-center">
          <button
            onClick={addSponsor}
            disabled={formData.sponsors.length >= 5}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <span>+</span>
            Add Sponsor ({formData.sponsors.length}/5)
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

        {/* Sponsor Summary */}
        {formData.sponsors.length > 0 && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold text-white mb-2">Sponsor Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Sponsors: </span>
                <span className="text-white font-semibold">{formData.sponsors.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Verified: </span>
                <span className="text-green-400 font-semibold">
                  {formData.sponsors.filter(s => s.searched && s.existingCustomer).length}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Issues: </span>
                <span className={`font-semibold ${
                  formData.sponsors.filter(s => s.isDuplicate).length > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {formData.sponsors.filter(s => s.isDuplicate).length} duplicate(s)
                </span>
              </div>
            </div>
            {formData.sponsors.some(s => s.isDuplicate) && (
              <p className="text-red-400 text-xs mt-2">
                ⚠️ Please fix duplicate ID cards before proceeding
              </p>
            )}
            {isReapplication && (
              <p className="text-green-400 text-xs mt-2">
                ✅ You can add, remove, or edit sponsors for the new contract
              </p>
            )}
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