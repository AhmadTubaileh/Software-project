import React, { useState } from 'react';

function ItemForm({ isOpen, item, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price_cash: item?.price_cash || '',
    price_installment_total: item?.price_installment_total || '',
    installment_first_payment: item?.installment_first_payment || '',
    installment_months: item?.installment_months || '',
    installment_per_month: item?.installment_per_month || '',
    available: item?.available !== undefined ? item.available : 1,
    quantity: item?.quantity || 0,
    installment: item?.installment !== undefined ? item.installment : 1,
    item_image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price_cash: item.price_cash || '',
        price_installment_total: item.price_installment_total || '',
        installment_first_payment: item.installment_first_payment || '',
        installment_months: item.installment_months || '',
        installment_per_month: item.installment_per_month || '',
        available: item.available !== undefined ? item.available : 1,
        quantity: item.quantity || 0,
        installment: item.installment !== undefined ? item.installment : 1,
        item_image: null
      });
      
      // Set preview if item has image
      if (item.item_image) {
        setPreviewImage(`data:image/jpeg;base64,${item.item_image}`);
      }
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        description: '',
        price_cash: '',
        price_installment_total: '',
        installment_first_payment: '',
        installment_months: '',
        installment_per_month: '',
        available: 1,
        quantity: 0,
        installment: 1,
        item_image: null
      });
      setPreviewImage(null);
    }
    setSelectedFile(null);
  }, [item]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      
      // Append all form fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price_cash', formData.price_cash);
      submitData.append('price_installment_total', formData.price_installment_total);
      submitData.append('installment_first_payment', formData.installment_first_payment);
      submitData.append('installment_months', formData.installment_months);
      submitData.append('installment_per_month', formData.installment_per_month);
      submitData.append('available', formData.available);
      submitData.append('quantity', formData.quantity);
      submitData.append('installment', formData.installment);
      
      // Append image if selected
      if (selectedFile) {
        submitData.append('item_image', selectedFile);
      }
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {item ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cash Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price_cash"
                  value={formData.price_cash}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Installment Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price_installment_total"
                  value={formData.price_installment_total}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  First Payment
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="installment_first_payment"
                  value={formData.installment_first_payment}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Months
                </label>
                <input
                  type="number"
                  min="0"
                  name="installment_months"
                  value={formData.installment_months}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Monthly Payment
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="installment_per_month"
                  value={formData.installment_per_month}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available == 1}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                />
                <span className="text-gray-300">Available</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="installment"
                  checked={formData.installment == 1}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                />
                <span className="text-gray-300">Installment Available</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {previewImage && (
                <div className="mt-2">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover rounded border border-gray-600" 
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ItemForm;