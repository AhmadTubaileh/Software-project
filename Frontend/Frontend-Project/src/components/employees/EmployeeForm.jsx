import React, { useState, useEffect } from 'react';

function EmployeeForm({ employee, onSubmit, onCancel }) {
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    id_card: '',
    password: '',
    user_type: '5'
  });

  // Image states (keeping your existing functionality)
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with employee data when editing
  useEffect(() => {
    if (employee) {
      console.log('Loading employee data:', employee);
      
      // Safely set all form fields with fallbacks for null/undefined
      setFormData({
        username: employee.username || '',
        email: employee.email || '',
        phone: employee.phone || '',
        id_card: employee.id_card || '', // Handle null id_card
        password: '', // Always empty for security
        user_type: employee.user_type ? employee.user_type.toString() : '5'
      });

      // Set image preview if card_image exists
      if (employee.card_image) {
        setPreviewImage(`data:image/jpeg;base64,${employee.card_image}`);
      }
    } else {
      // Reset form for new employee
      setFormData({
        username: '',
        email: '',
        phone: '',
        id_card: '',
        password: '',
        user_type: '5'
      });
      setPreviewImage(null);
      setSelectedFile(null);
    }
  }, [employee]);

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input changes (keeping your existing image functionality)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image (keeping your existing functionality)
  const removeImage = () => {
    setPreviewImage(null);
    setSelectedFile(null);
  };

  // Form validation
  const validateForm = () => {
    const errors = [];

    if (!formData.username.trim()) errors.push('Username is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.phone.trim()) errors.push('Phone is required');
    if (!formData.id_card.trim()) errors.push('ID Card is required');
    if (!employee && !formData.password) errors.push('Password is required for new employees');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation for new employees
    if (!employee && formData.password && formData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return errors;
  };

  // Handle form submission (keeping your existing FormData structure)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData (keeping your existing structure)
      const submitData = new FormData();
      
      // Append basic fields
      submitData.append('username', formData.username);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('id_card', formData.id_card); // NEW FIELD
      submitData.append('user_type', formData.user_type);

      // Append password only if provided
      if (formData.password) {
        submitData.append('password', formData.password);
      }

      // Handle image (keeping your existing logic)
      if (selectedFile) {
        submitData.append('card_image', selectedFile);
      } else if (employee?.card_image && !previewImage) {
        // If editing and image was removed
        submitData.append('card_image', '');
      }

      console.log('Submitting employee data:', {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        id_card: formData.id_card,
        user_type: formData.user_type,
        hasPassword: !!formData.password,
        hasImage: !!selectedFile
      });

      // Call the onSubmit prop (keeping your existing function)
      await onSubmit(submitData);

    } catch (error) {
      console.error('Error in form submission:', error);
      alert(error.message || 'Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitt = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      const submitData = new FormData();
      submitData.append('username', formData.username);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('id_card', formData.id_card);
      submitData.append('user_type', formData.user_type);
      
      if (formData.password) {
        submitData.append('password', formData.password);
      }
      
      if (selectedFile) {
        submitData.append('card_image', selectedFile);
      }
  
      // DEBUG: Check the FormData
      console.log('=== FORM DATA DEBUG ===');
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, value);
      }
      console.log('=== END DEBUG ===');
  
      console.log('About to call onSubmit...');
      
      await onSubmit(submitData);
      
      console.log('onSubmit completed successfully');
      
    } catch (error) {
      console.error('Error in form submission:', error);
      console.error('Error stack:', error.stack);
      alert(error.message || 'Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitt} className="space-y-6">
      {/* Username and Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Phone and ID Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ID Card *
          </label>
          <input
            type="text"
            name="id_card"
            value={formData.id_card}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter ID card number"
          />
        </div>
      </div>

      {/* User Type and Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            User Type *
          </label>
          <select
            name="user_type"
            value={formData.user_type}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="0">Level 0 - Admin</option>
            <option value="1">Level 1 - Senior Manager</option>
            <option value="2">Level 2 - Manager</option>
            <option value="3">Level 3 - Supervisor</option>
            <option value="4">Level 4 - Team Lead</option>
            <option value="5">Level 5 - Employee</option>
            <option value="6">Level 6 - Junior Employee</option>
            <option value="7">Level 7 - Trainee</option>
            <option value="8">Level 8 - Intern</option>
            <option value="9">Level 9 - Contractor</option>
            <option value="10">Level 10 - Customer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password {!employee && '*'}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required={!employee}
            placeholder={employee ? "Leave blank to keep current" : "Enter password"}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {!employee && (
            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
          )}
        </div>
      </div>

      {/* Card Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Card Image {!employee && '(Optional)'}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        <p className="text-xs text-gray-400 mt-1">
          Upload ID card image (JPEG, PNG, max 5MB)
        </p>

        {/* Image Preview */}
        {(previewImage || (employee && employee.card_image)) && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">Image Preview</span>
              <button
                type="button"
                onClick={removeImage}
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Remove Image
              </button>
            </div>
            <img 
              src={previewImage || `data:image/jpeg;base64,${employee.card_image}`} 
              alt="Card preview" 
              className="w-32 h-32 object-cover rounded-md border border-gray-600 mx-auto"
            />
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {employee ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            employee ? 'Update Employee' : 'Add Employee'
          )}
        </button>
      </div>
    </form>
  );
}

export default EmployeeForm;