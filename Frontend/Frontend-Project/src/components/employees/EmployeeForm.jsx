import React, { useState, useEffect } from 'react';

// API Base URL (same as in Employees.jsx)
const API_BASE_URL = 'http://localhost:5000/api';

function EmployeeForm({ employee, onSubmit, onCancel, currentUser, allBranches, loadAccessibleBranches }) {
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    id_card: '',
    password: '',
    user_type: '5',
    primary_branch_id: '',
    branch_ids: []
  });

  // UI states
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessibleBranches, setAccessibleBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Fetch accessible branches on component mount
  useEffect(() => {
    const fetchAccessibleBranches = async () => {
      try {
        setLoadingBranches(true);
        
        // Use the passed function or fetch directly
        let accessible = [];
        if (loadAccessibleBranches) {
          accessible = await loadAccessibleBranches(currentUser.id);
        } else {
          // Fallback: fetch directly
          const response = await fetch(`${API_BASE_URL}/employees/branches/accessible?userId=${currentUser.id}`);
          if (response.ok) {
            accessible = await response.json();
          } else {
            // If fails, use all branches for admin, or filter based on user type
            if (currentUser.user_type === 0) {
              accessible = allBranches || [];
            } else {
              // For non-admin, we should only show accessible branches
              // For now, use all branches as fallback
              accessible = allBranches || [];
            }
          }
        }
        
        setAccessibleBranches(accessible);
      } catch (error) {
        console.error('Error fetching accessible branches:', error);
        // Use all branches as fallback
        setAccessibleBranches(allBranches || []);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchAccessibleBranches();
  }, [currentUser, allBranches, loadAccessibleBranches]);

  // Initialize form with employee data when editing
  useEffect(() => {
    if (employee) {
      console.log('Loading employee data:', employee);
      
      // Safely set all form fields
      setFormData({
        username: employee.username || '',
        email: employee.email || '',
        phone: employee.phone || '',
        id_card: employee.id_card || '',
        password: '', // Always empty for security
        user_type: employee.user_type ? employee.user_type.toString() : '5',
        primary_branch_id: employee.primary_branch_id ? employee.primary_branch_id.toString() : '',
        branch_ids: employee.accessible_branches || []
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
        user_type: '5',
        primary_branch_id: '',
        branch_ids: []
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

  // Handle branch selection
  const handleBranchToggle = (branchId) => {
    const branchIdNum = parseInt(branchId);
    setFormData(prev => {
      const newBranchIds = prev.branch_ids.includes(branchIdNum)
        ? prev.branch_ids.filter(id => id !== branchIdNum)
        : [...prev.branch_ids, branchIdNum];
      
      // If primary branch is being removed, clear it
      const primaryBranchId = parseInt(prev.primary_branch_id);
      let newPrimaryBranchId = prev.primary_branch_id;
      if (!newBranchIds.includes(primaryBranchId) && primaryBranchId === branchIdNum) {
        newPrimaryBranchId = '';
      }
      
      return {
        ...prev,
        branch_ids: newBranchIds,
        primary_branch_id: newPrimaryBranchId.toString()
      };
    });
  };

  // Handle primary branch change
  const handlePrimaryBranchChange = (branchId) => {
    const branchIdNum = parseInt(branchId);
    
    // Ensure selected branch is in accessible branches
    if (!formData.branch_ids.includes(branchIdNum) && branchId) {
      setFormData(prev => ({
        ...prev,
        branch_ids: [...prev.branch_ids, branchIdNum],
        primary_branch_id: branchId
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        primary_branch_id: branchId
      }));
    }
  };

  // Handle file input changes
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

  // Remove image
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
    if (!formData.primary_branch_id) errors.push('Primary branch is required');
    if (formData.branch_ids.length === 0) errors.push('At least one branch must be selected');
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

    // User type hierarchy validation
    const currentUserType = currentUser.user_type;
    const targetUserType = parseInt(formData.user_type);
    
    if (currentUserType !== 0) { // Not admin
      if (currentUserType === 1 && (targetUserType < 2 || targetUserType > 10)) {
        errors.push('Senior Managers can only assign user types 2-10');
      }
      if (currentUserType === 2 && (targetUserType < 3 || targetUserType > 10)) {
        errors.push('Managers can only assign user types 3-10');
      }
    }

    return errors;
  };

  // Handle form submission
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
      // Create FormData
      const submitData = new FormData();
      
      // Append basic fields
      submitData.append('username', formData.username);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('id_card', formData.id_card);
      submitData.append('user_type', formData.user_type);
      submitData.append('primary_branch_id', formData.primary_branch_id);
      submitData.append('branch_ids', formData.branch_ids.join(','));

      // Append password only if provided
      if (formData.password) {
        submitData.append('password', formData.password);
      }

      // Handle image
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
        primary_branch_id: formData.primary_branch_id,
        branch_ids: formData.branch_ids,
        hasPassword: !!formData.password,
        hasImage: !!selectedFile
      });

      // Call the onSubmit prop with currentUser.id
      await onSubmit(submitData, currentUser.id);

    } catch (error) {
      console.error('Error in form submission:', error);
      alert(error.message || 'Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available user types based on current user's role
  const getAvailableUserTypes = () => {
    const currentUserType = currentUser.user_type;
    
    const allTypes = [
      { value: '0', label: 'Level 0 - Admin' },
      { value: '1', label: 'Level 1 - Senior Manager' },
      { value: '2', label: 'Level 2 - Manager' },
      { value: '3', label: 'Level 3 - Supervisor' },
      { value: '4', label: 'Level 4 - Team Lead' },
      { value: '5', label: 'Level 5 - Employee' },
      { value: '6', label: 'Level 6 - Junior Employee' },
      { value: '7', label: 'Level 7 - Trainee' },
      { value: '8', label: 'Level 8 - Intern' },
      { value: '9', label: 'Level 9 - Contractor' },
      { value: '10', label: 'Level 10 - Customer' }
    ];

    if (currentUserType === 0) return allTypes; // Admin sees all
    
    if (currentUserType === 1) {
      // Senior Manager sees 2-10
      return allTypes.filter(type => parseInt(type.value) >= 2);
    }
    
    if (currentUserType === 2) {
      // Manager sees 3-10
      return allTypes.filter(type => parseInt(type.value) >= 3);
    }
    
    return [];
  };

  // Get filtered accessible branches (if current user is not admin)
  const getFilteredBranches = () => {
    if (currentUser.user_type === 0) {
      // Admin sees all branches
      return allBranches || [];
    }
    // Non-admin users see only accessible branches
    return accessibleBranches || [];
  };

  const filteredBranches = getFilteredBranches();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
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
            <option value="">Select user type</option>
            {getAvailableUserTypes().map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {currentUser.user_type === 0 && 'Admin can assign all types'}
            {currentUser.user_type === 1 && 'Senior Manager can assign types 2-10'}
            {currentUser.user_type === 2 && 'Manager can assign types 3-10'}
          </p>
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

      {/* Branch Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Accessible Branches *
          </label>
          {loadingBranches ? (
            <div className="text-gray-400 text-sm">Loading branches...</div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-red-400 text-sm">
              No branches available. You need branch access to create employees.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredBranches.map(branch => (
                <div key={branch.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`branch-${branch.id}`}
                    checked={formData.branch_ids.includes(branch.id)}
                    onChange={() => handleBranchToggle(branch.id)}
                    className="h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded cursor-pointer transition-all duration-200 hover:bg-gray-650 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  />
                  <label
                    htmlFor={`branch-${branch.id}`}
                    className="ml-3 text-sm font-medium text-gray-200 cursor-pointer hover:text-white transition-colors duration-150"
                  >
                    {branch.name}
                  </label>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Select all branches this employee can access
            {currentUser.user_type !== 0 && ' (Only showing branches you have access to)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Primary Branch *
          </label>
          <select
            name="primary_branch_id"
            value={formData.primary_branch_id}
            onChange={(e) => handlePrimaryBranchChange(e.target.value)}
            required
            disabled={formData.branch_ids.length === 0}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Select primary branch</option>
            {filteredBranches
              .filter(branch => formData.branch_ids.includes(branch.id))
              .map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Primary branch must be selected from accessible branches
          </p>
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
          disabled={isSubmitting || filteredBranches.length === 0}
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