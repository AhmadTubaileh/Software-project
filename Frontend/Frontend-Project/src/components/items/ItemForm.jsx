import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ItemForm({ isOpen, item, isUpdateMode, currentUser, onSubmit, onCancel, userBranches, allBranches, userType }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cash: '',
    buy_price: '',
    price_installment_total: '',
    installment_first_payment: '',
    installment_months: '',
    available: 1,
    quantity: 0,
    installment: 1,
    on_sale_price: '',
    item_image: null,
    branch_id: '',
    category_id: '',
    main_img: '',
    sub_img1: '',
    sub_img2: '',
    sub_img3: '',
    sub_img4: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPayments, setCalculatedPayments] = useState({
    installment_per_month: '',
    installment_last_payment: ''
  });
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Get available branches for the form
  const getFormBranches = () => {
    return userType === 0 ? allBranches : userBranches;
  };

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price_cash: item.price_cash || '',
        buy_price: item.buy_price || '',
        price_installment_total: item.price_installment_total || '',
        installment_first_payment: item.installment_first_payment || '',
        installment_months: item.installment_months || '',
        available: item.available !== undefined ? item.available : 1,
        quantity: item.quantity || 0,
        installment: item.installment !== undefined ? item.installment : 1,
        on_sale_price: item.on_sale_price || '',
        item_image: null,
        branch_id: item.branch_id || '',
        category_id: item.category_id || '',
        main_img: item.main_img || '',
        sub_img1: item.sub_img1 || '',
        sub_img2: item.sub_img2 || '',
        sub_img3: item.sub_img3 || '',
        sub_img4: item.sub_img4 || ''
      });
      
      // Set calculated payments
      if (item.installment_per_month || item.installment_last_payment) {
        setCalculatedPayments({
          installment_per_month: item.installment_per_month || '',
          installment_last_payment: item.installment_last_payment || ''
        });
      }
      
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
        buy_price: '',
        price_installment_total: '',
        installment_first_payment: '',
        installment_months: '',
        available: 1,
        quantity: 0,
        installment: 1,
        on_sale_price: '',
        item_image: null,
        branch_id: '',
        category_id: '',
        main_img: '',
        sub_img1: '',
        sub_img2: '',
        sub_img3: '',
        sub_img4: ''
      });
      setPreviewImage(null);
      setCalculatedPayments({
        installment_per_month: '',
        installment_last_payment: ''
      });
    }
    setSelectedFile(null);
  }, [item]);

  // Calculate installment payments with NEW method
  const calculateInstallmentPayments = () => {
    const total = parseFloat(formData.price_installment_total);
    const downPayment = parseFloat(formData.installment_first_payment);
    const months = parseInt(formData.installment_months);

    if (!total || !downPayment || !months || months <= 1) {
      // If only 1 month or invalid, everything is down payment
      setCalculatedPayments({
        installment_per_month: '0',
        installment_last_payment: total ? (total - downPayment).toFixed(2) : '0'
      });
      return;
    }

    const remaining = total - downPayment;
    const equalMonths = months - 1; // CHANGED: Months - 1
    
    // Calculate monthly payment (rounded down to nearest 10)
    const rawMonthly = remaining / equalMonths;
    const monthlyPayment = Math.floor(rawMonthly / 10) * 10;
    
    // Calculate last payment
    let lastPayment = remaining - (monthlyPayment * equalMonths);
    
    // NEW LOGIC: If last payment is 0, take 10 from each monthly payment
    if (lastPayment === 0) {
      // Take 10 from each monthly payment
      const adjustedMonthly = monthlyPayment - 10;
      // Add (10 * equalMonths) to last payment
      lastPayment = 10 * equalMonths;
      
      setCalculatedPayments({
        installment_per_month: adjustedMonthly.toFixed(2),
        installment_last_payment: lastPayment.toFixed(2)
      });
    } else {
      setCalculatedPayments({
        installment_per_month: monthlyPayment.toFixed(2),
        installment_last_payment: lastPayment.toFixed(2)
      });
    }
  };

  // Trigger calculation when installment fields change
  useEffect(() => {
    if (formData.price_installment_total && formData.installment_first_payment && formData.installment_months) {
      calculateInstallmentPayments();
    }
  }, [formData.price_installment_total, formData.installment_first_payment, formData.installment_months]);

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setCreatingCategory(true);
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Category created successfully');
        setCategories([...categories, data.category]);
        setFormData(prev => ({ ...prev, category_id: data.category.id }));
        setNewCategoryName('');
        setShowCategoryModal(false);
      } else {
        toast.error(data.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setCreatingCategory(false);
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
      submitData.append('buy_price', formData.buy_price);
      submitData.append('available', formData.available);
      submitData.append('quantity', formData.quantity);
      submitData.append('installment', formData.installment);
      
      // Append installment fields if installment is enabled
      if (formData.installment && formData.price_installment_total) {
        submitData.append('price_installment_total', formData.price_installment_total);
        submitData.append('installment_first_payment', formData.installment_first_payment || '0');
        submitData.append('installment_months', formData.installment_months || '0');
        submitData.append('installment_per_month', calculatedPayments.installment_per_month || '0');
        submitData.append('installment_last_payment', calculatedPayments.installment_last_payment || '0');
      }
      
      // Append sale price if provided
      if (formData.on_sale_price) {
        submitData.append('on_sale_price', formData.on_sale_price);
      }
      
      // ✅ CRITICAL: Add branch_id for new items
      if (formData.branch_id) {
        submitData.append('branch_id', formData.branch_id);
      }
      
      // Append category_id if selected
      if (formData.category_id) {
        submitData.append('category_id', formData.category_id);
      }
      
      // Append image URLs if provided
      if (formData.main_img) {
        submitData.append('main_img', formData.main_img);
      }
      if (formData.sub_img1) {
        submitData.append('sub_img1', formData.sub_img1);
      }
      if (formData.sub_img2) {
        submitData.append('sub_img2', formData.sub_img2);
      }
      if (formData.sub_img3) {
        submitData.append('sub_img3', formData.sub_img3);
      }
      if (formData.sub_img4) {
        submitData.append('sub_img4', formData.sub_img4);
      }
      
      // Append image if selected
      if (selectedFile) {
        submitData.append('item_image', selectedFile);
      }
      
      // ✅ CRITICAL: Add the current user's ID
      if (currentUser && currentUser.id) {
        submitData.append('currentUserId', currentUser.id);
      }
      
      await onSubmit(submitData, isUpdateMode);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save item');
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
              {isUpdateMode ? 'Update Price' : (item ? 'Edit Item' : 'Add New Item')}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>

          {isUpdateMode && (
            <div className="mb-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded">
              <p className="text-yellow-300 text-sm">
                <strong>Update Mode:</strong> This will create a new price entry in the history.
                The current price will be preserved in the price history.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Branch * {!item && <span className="text-red-400">(Cannot be changed after creation)</span>}
                {item && userType !== 0 && <span className="text-red-400">(Cannot be changed)</span>}
              </label>
              <select
                name="branch_id"
                value={formData.branch_id}
                onChange={handleInputChange}
                disabled={item && userType !== 0} // Only disable for non-admin users during edit
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                required
              >
                <option value="">Select a branch</option>
                {getFormBranches() && getFormBranches().map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {item && userType === 0 && (
                <p className="text-green-400 text-xs mt-1">✓ As admin, you can change the branch</p>
              )}
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Category (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium transition-colors duration-200"
                  title="Create new category"
                >
                  + New
                </button>
              </div>
            </div>

            {/* Basic Information */}
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
                  Buy Price (Cost) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="buy_price"
                  value={formData.buy_price}
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

            {/* Profit Calculation Display */}
            {(formData.price_cash && formData.buy_price) && (
              <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Profit Calculation:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Sell Price:</span>
                    <p className="text-white">${parseFloat(formData.price_cash).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Cost Price:</span>
                    <p className="text-white">${parseFloat(formData.buy_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Profit:</span>
                    <p className="text-green-400 font-medium">
                      ${(parseFloat(formData.price_cash) - parseFloat(formData.buy_price)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Profit %:</span>
                    <p className="text-green-400 font-medium">
                      {formData.buy_price > 0 
                        ? (((parseFloat(formData.price_cash) - parseFloat(formData.buy_price)) / parseFloat(formData.buy_price)) * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sale Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sale Price (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="on_sale_price"
                value={formData.on_sale_price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter discounted price"
              />
            </div>

            {/* Installment Section */}
            <div className="border border-gray-700 rounded-md p-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  name="installment"
                  checked={formData.installment == 1}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                />
                <span className="text-gray-300 font-medium">Installment Available</span>
              </div>

              {formData.installment && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Total Installment Price
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
                        Down Payment
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
                        Number of Months
                      </label>
                      <input
                        type="number"
                        min="1"
                        name="installment_months"
                        value={formData.installment_months}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Calculated Payments */}
                  {(calculatedPayments.installment_per_month || calculatedPayments.installment_last_payment) && (
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Calculated Payments:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Monthly Payment:</span>
                          <p className="text-green-400 font-medium">
                            ${calculatedPayments.installment_per_month}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Last Payment:</span>
                          <p className="text-green-400 font-medium">
                            ${calculatedPayments.installment_last_payment}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>New Calculation Method:</strong> 
                        <br/>• Down payment = Month 0 (not counted in months)
                        <br/>• Months 1 to (n-1) = Equal monthly payments
                        <br/>• Month n = Final payment
                        <br/>• Monthly payment is rounded down to nearest $10
                        <br/>• If final payment would be $0, $10 is taken from each monthly payment
                        <br/>• Final payment is never $0
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Availability */}
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
            </div>

            {/* Image Upload (Blob) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Product Image (Upload)
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

            {/* Image URL Fields */}
            <div className="border border-gray-700 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Image URLs (Optional)</h3>
              <p className="text-xs text-gray-500 mb-4">
                Enter image URLs (local paths or internet URLs) for the product images
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Main Image URL
                  </label>
                  <input
                    type="text"
                    name="main_img"
                    value={formData.main_img}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg or /uploads/product.jpg"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  {formData.main_img && (
                    <div className="mt-2">
                      <img 
                        src={formData.main_img} 
                        alt="Main preview" 
                        className="w-24 h-24 object-cover rounded border border-gray-600"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-xs text-red-400 mt-1">⚠️ Failed to load image</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Sub Image 1 URL
                    </label>
                    <input
                      type="text"
                      name="sub_img1"
                      value={formData.sub_img1}
                      onChange={handleInputChange}
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Sub Image 2 URL
                    </label>
                    <input
                      type="text"
                      name="sub_img2"
                      value={formData.sub_img2}
                      onChange={handleInputChange}
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Sub Image 3 URL
                    </label>
                    <input
                      type="text"
                      name="sub_img3"
                      value={formData.sub_img3}
                      onChange={handleInputChange}
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Sub Image 4 URL
                    </label>
                    <input
                      type="text"
                      name="sub_img4"
                      value={formData.sub_img4}
                      onChange={handleInputChange}
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
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
                className={`flex-1 px-4 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isUpdateMode 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting 
                  ? 'Saving...' 
                  : isUpdateMode 
                    ? 'Update Price' 
                    : (item ? 'Save Changes' : 'Add Item')
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Create New Category</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Electronics, Furniture, Clothing"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !creatingCategory) {
                      handleCreateCategory();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors duration-200"
                  disabled={creatingCategory}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingCategory ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemForm;