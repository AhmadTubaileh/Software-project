import React, { useState } from 'react';

function EmployeeForm({ employee, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    username: employee?.username || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    password: '',
    userType: employee?.userType || 5,
    cardImage: employee?.cardImage || null
  });

  const [previewImage, setPreviewImage] = useState(employee?.cardImage || null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // DEBUG: Log what we're sending
    console.log('Submitting employee data:', {
      ...formData,
      userType: formData.userType,
      userTypeType: typeof formData.userType
    });
    
    try {
      const submitData = {
        ...formData,
        cardImage: selectedFile || formData.cardImage
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error in form submission:', error);
      alert(error.message || 'Error submitting form');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
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
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            User Type (0-10) *
          </label>
          <select
            name="userType"
            value={formData.userType}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
          >
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
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
          placeholder={employee ? "Leave blank to keep current password" : ""}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Card Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
        />
        {(previewImage || employee?.cardImage) && (
          <div className="mt-2">
            <img 
              src={previewImage || employee.cardImage} 
              alt="Preview" 
              className="w-32 h-32 object-cover rounded-md border border-gray-600"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200"
        >
          {employee ? 'Update Employee' : 'Add Employee'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default EmployeeForm;