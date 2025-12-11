import React, { useState, useEffect } from 'react';

function BranchForm({ branch, onSubmit, onCancel }) {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form with branch data when editing
  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
        phone: branch.phone || ''
      });
    } else {
      // Reset form for new branch
      setFormData({
        name: '',
        address: '',
        phone: ''
      });
    }
    setErrors({});
  }, [branch]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Branch name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Branch name must be at least 2 characters';
    }
    
    if (formData.phone && !/^[\d\s\-+()]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error in form submission:', error);
      // Handle API errors
      if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      } else {
        setErrors({ submit: 'Failed to save branch. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-300">
            <span className="text-xl">⚠️</span>
            <span>{errors.submit}</span>
          </div>
        </div>
      )}

      {/* Branch Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Branch Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="Enter branch name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <span>⚠️</span> {errors.name}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Address
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Enter full address"
        />
        <p className="mt-1 text-xs text-gray-400">
          Optional but recommended for customer directions
        </p>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            errors.phone ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="Enter phone number"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <span>⚠️</span> {errors.phone}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Optional contact number for the branch
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed px-4 py-3 rounded-md transition-colors duration-200 font-medium flex items-center justify-center gap-2"
        >
          <span>←</span> Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-3 rounded-md transition-colors duration-200 font-medium flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {branch ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <span>💾</span>
              {branch ? 'Update Branch' : 'Create Branch'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default BranchForm;