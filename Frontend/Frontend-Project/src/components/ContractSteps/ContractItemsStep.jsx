import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const ContractItemsStep = ({ formData, updateFormData, prevStep, onSubmit, loading, isReapplication = false }) => {
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemForAdd, setSelectedItemForAdd] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const dropdownRef = React.useRef(null);

  // Calculate payments using your exact formula
  const calculatePayments = useCallback((total, down, months) => {
    if (months < 3) {
      return {
        monthly_payment: 0,
        installment_last_payment: 0,
        error: 'Minimum 3 months required'
      };
    }
    
    if (down >= total) {
      return {
        monthly_payment: 0,
        installment_last_payment: 0,
        error: 'Down payment must be less than total price'
      };
    }

    const remaining = total - down;
    const equal_months = months - 2;
    
    if (equal_months <= 0) {
      return {
        monthly_payment: 0,
        installment_last_payment: 0,
        error: 'Invalid months calculation'
      };
    }

    const raw_monthly = remaining / equal_months;
    let monthly_payment = Math.floor(raw_monthly / 10) * 10;
    let last_payment = remaining - (monthly_payment * equal_months);
    
    if (last_payment === 0) {
      monthly_payment = monthly_payment - 10;
      last_payment = 10 * equal_months;
    }

    if (monthly_payment <= 0) {
      return {
        monthly_payment: 0,
        installment_last_payment: 0,
        error: 'Monthly payment cannot be zero or negative'
      };
    }

    return {
      monthly_payment,
      installment_last_payment: last_payment,
      error: null
    };
  }, []);

  // Initialize contractItems array if not exists
  useEffect(() => {
    if (!formData.contractItems) {
      updateFormData({ contractItems: [] });
    }
  }, [formData.contractItems, updateFormData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch available installment items with their latest prices
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItemsLoading(true);
        setItemsError(null);
        
        const response = await fetch('http://localhost:5000/api/contracts/items');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error('Error fetching installment items:', error);
        setItemsError(error.message);
        setItems([]);
      } finally {
        setItemsLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate available quantity for an item
  const getAvailableQuantity = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return 0;
    
    const alreadySelectedCount = formData.contractItems
      .filter(ci => ci.item_id === itemId)
      .reduce((sum, ci) => sum + (ci.quantity || 1), 0);
    
    return Math.max(0, item.quantity - alreadySelectedCount);
  };

  // Add a new item to contract with quantity - SIMPLIFIED VERSION
  const handleAddItem = (item, quantity = 1) => {
    console.log('Adding item:', item.name, 'quantity:', quantity);
    
    if (!item) return;
    
    const availableQty = getAvailableQuantity(item.id);
    if (availableQty <= 0) {
      toast.error(`No more ${item.name} available`);
      return;
    }
    
    if (quantity > availableQty) {
      toast.error(`Only ${availableQty} ${item.name}(s) available`);
      quantity = availableQty;
    }

    // Use installment total price as default
    const total_price = parseFloat(item.price_installment_total) || parseFloat(item.price_cash) || 0;
    const down_payment = parseFloat(item.installment_first_payment) || 0;
    const months = parseInt(item.installment_months) || 12;
    const installment_last_payment = parseFloat(item.installment_last_payment) || 0;

    const calculated = calculatePayments(total_price, down_payment, months);

    const newContractItem = {
      item_id: item.id,
      item_name: item.name,
      item_description: item.description,
      price_id: item.price_id,
      total_price: total_price,
      down_payment: down_payment,
      months: months,
      monthly_payment: calculated.monthly_payment,
      installment_last_payment: calculated.installment_last_payment,
      start_date: new Date().toISOString().split('T')[0],
      quantity: quantity
    };

    // Check if item already exists in contract items with same terms
    const existingIndex = formData.contractItems.findIndex(ci => 
      ci.item_id === item.id && 
      ci.total_price === total_price &&
      ci.down_payment === down_payment &&
      ci.months === months
    );
    
    if (existingIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...formData.contractItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + quantity
      };
      updateFormData({ contractItems: updatedItems });
      toast.success(`Added ${quantity} more ${item.name}(s) to contract`);
    } else {
      // Add new item entry
      updateFormData({ 
        contractItems: [...formData.contractItems, newContractItem] 
      });
      toast.success(`Added ${quantity} ${item.name}(s) to contract`);
    }

    setSelectedItemForAdd(null);
    setIsDropdownOpen(false);
    setSearchTerm('');
    setQuantityToAdd(1);
  };

  // Direct add item when clicking in dropdown (OLD SIMPLE WAY)
  const handleDirectAddItem = (item) => {
    console.log('Direct adding item:', item.name);
    handleAddItem(item, 1);
  };

  // Remove item from contract
  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.contractItems];
    if (updatedItems[index].quantity > 1) {
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: updatedItems[index].quantity - 1
      };
      updateFormData({ contractItems: updatedItems });
      toast.success(`Removed 1 ${updatedItems[index].item_name} from contract`);
    } else {
      const removedItem = updatedItems[index];
      updatedItems.splice(index, 1);
      updateFormData({ contractItems: updatedItems });
      toast.success(`Removed ${removedItem.item_name} from contract`);
    }
  };

  // Update contract item field
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.contractItems];
    
    let numValue;
    if (field === 'months') {
      numValue = parseInt(value) || 0;
    } else if (field === 'quantity') {
      numValue = parseInt(value) || 1;
      const itemId = updatedItems[index].item_id;
      const available = getAvailableQuantity(itemId) + updatedItems[index].quantity;
      if (numValue > available) {
        toast.error(`Only ${available} available total`);
        numValue = available;
      }
    } else {
      numValue = parseFloat(value) || 0;
    }
    
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: numValue
    };
    
    if (['total_price', 'down_payment', 'months'].includes(field)) {
      const calculated = calculatePayments(
        updatedItems[index].total_price,
        updatedItems[index].down_payment,
        updatedItems[index].months
      );
      
      updatedItems[index].monthly_payment = calculated.monthly_payment;
      updatedItems[index].installment_last_payment = calculated.installment_last_payment;
      
      if (calculated.error) {
        toast.error(calculated.error);
      }
    }
    
    updateFormData({ contractItems: updatedItems });
  };

  // Update start date for all items
  const handleStartDateChange = (date) => {
    const updatedItems = formData.contractItems.map(item => ({
      ...item,
      start_date: date
    }));
    updateFormData({ contractItems: updatedItems });
  };

  // Format number for display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0.00';
    return parseFloat(num).toFixed(2);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const canSubmit = () => {
    return formData.contractItems.length > 0 && 
           formData.contractItems.every(item => 
             item.total_price > 0 &&
             item.down_payment >= 0 &&
             item.months >= 3 &&
             item.monthly_payment > 0 &&
             item.quantity > 0
           );
  };

  // Calculate totals
  const getTotals = () => {
    return formData.contractItems.reduce((acc, item) => ({
      total_price: acc.total_price + (item.total_price * item.quantity),
      down_payment: acc.down_payment + (item.down_payment * item.quantity),
      monthly_payment: acc.monthly_payment + (item.monthly_payment * item.quantity),
      items: acc.items + item.quantity,
      contracts: acc.contracts + 1
    }), { total_price: 0, down_payment: 0, monthly_payment: 0, items: 0, contracts: 0 });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Step 4: Select Contract Items</h2>
      
      {/* Reapplication Notice */}
      {isReapplication && (
        <div className="bg-purple-900/20 border border-purple-500 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <div className="text-purple-400 text-xl">💰</div>
            <div>
              <h3 className="font-semibold text-purple-400">Edit Contract Items & Terms</h3>
              <p className="text-sm text-purple-300 mt-1">
                You can change the item, quantity, prices, or payment terms for the new contract.
              </p>
              {formData.contractItems.length > 0 && (
                <p className="text-xs text-purple-400 mt-2">
                  Current item: {formData.contractItems[0].item_name} • Quantity: {formData.contractItems.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Add Item Section */}
        <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
          <h3 className="text-xl font-semibold mb-4 text-white">Add Items to Contract</h3>
          
          <div className="relative mb-6" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search and Select Items *
            </label>
            
            {itemsLoading ? (
              <div className="flex items-center gap-2 text-gray-400 p-4 bg-gray-700 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Loading available items...
              </div>
            ) : itemsError ? (
              <div className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-500">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Error loading items: {itemsError}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Custom Dropdown Trigger */}
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-3 bg-gray-700 border ${
                    isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-600'
                  } rounded-lg text-white cursor-pointer flex items-center justify-between transition-all duration-200 hover:bg-gray-600`}
                >
                  <span className={selectedItemForAdd ? 'text-white' : 'text-gray-400'}>
                    {selectedItemForAdd ? selectedItemForAdd.name : 'Click to search and select items...'}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-hidden">
                    {/* Search Box */}
                    <div className="p-3 border-b border-gray-600">
                      <div className="relative">
                        <svg 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search items..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="overflow-y-auto max-h-60">
                      {filteredItems.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">
                          {searchTerm ? 'No items match your search' : 'No items available'}
                        </div>
                      ) : (
                        filteredItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedItemForAdd(item);
                              const available = getAvailableQuantity(item.id);
                              setQuantityToAdd(Math.min(1, available));
                            }}
                            className={`p-4 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors duration-150 hover:bg-gray-700/50 ${
                              selectedItemForAdd?.id === item.id ? 'bg-blue-900/20 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white text-sm">{item.name}</h4>
                                {item.description && (
                                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-white font-bold text-sm">
                                  ${item.price_installment_total || item.price_cash || '0.00'}
                                </div>
                                <div className={`text-xs mt-1 ${
                                  getAvailableQuantity(item.id) > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {getAvailableQuantity(item.id)} available
                                </div>
                              </div>
                            </div>
                            
                            {/* Item Details */}
                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-400">
                              <div>
                                <span>Installment Total: </span>
                                <span className="text-white">${item.price_installment_total || 'N/A'}</span>
                              </div>
                              <div>
                                <span>Down Payment: </span>
                                <span className="text-white">${item.installment_first_payment || '0.00'}</span>
                              </div>
                              <div>
                                <span>Months: </span>
                                <span className="text-white">{item.installment_months || 12}</span>
                              </div>
                              <div>
                                <span>Monthly: </span>
                                <span className="text-white">${item.installment_per_month || 'N/A'}</span>
                              </div>
                            </div>
                            
                            {/* Quick Add Button */}
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDirectAddItem(item);
                                }}
                                disabled={getAvailableQuantity(item.id) <= 0}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-xs font-medium transition-colors duration-200"
                              >
                                Add 1 Item
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer with Quantity Selection */}
                    {selectedItemForAdd && (
                      <div className="p-3 bg-gray-900 border-t border-gray-600">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-300">
                              Selected: <span className="font-semibold">{selectedItemForAdd.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600"
                              >
                                -
                              </button>
                              <span className="font-semibold text-white">{quantityToAdd}</span>
                              <button
                                onClick={() => {
                                  const available = getAvailableQuantity(selectedItemForAdd.id);
                                  setQuantityToAdd(Math.min(available, quantityToAdd + 1));
                                }}
                                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              handleAddItem(selectedItemForAdd, quantityToAdd);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors duration-200"
                          >
                            Add {quantityToAdd} Item{quantityToAdd > 1 ? 's' : ''}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="text-sm text-gray-400">
            <p>• Click on an item to select it, then adjust quantity and click "Add X Items"</p>
            <p>• Or use "Add 1 Item" button for quick addition</p>
            <p>• You can add the same item multiple times</p>
            <p>• Each quantity unit will become a separate contract</p>
            {isReapplication && (
              <p className="text-purple-400">• You can change the item completely or keep the original</p>
            )}
          </div>
        </div>

        {/* Start Date for All Contracts */}
        {formData.contractItems.length > 0 && (
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
            <h3 className="text-xl font-semibold mb-4 text-white">Contract Start Date</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date for All Contracts *
              </label>
              <input
                type="date"
                value={formData.contractItems[0]?.start_date || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-xs text-gray-400 mt-1">
                All contracts will start on this date
              </p>
            </div>
          </div>
        )}

        {/* Selected Items List */}
        {formData.contractItems.length > 0 && (
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                Selected Items ({getTotals().items} items across {formData.contractItems.length} unique products)
              </h3>
              <div className="text-sm text-gray-400">
                Each item below will become a separate contract
              </div>
            </div>

            <div className="space-y-6">
              {formData.contractItems.map((item, index) => (
                <div key={index} className="bg-gray-600/30 rounded-lg p-6 border border-gray-500/50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg text-white">
                        {item.item_name} 
                        <span className="ml-2 text-blue-400 text-sm">
                          (×{item.quantity})
                        </span>
                      </h4>
                      {item.item_description && (
                        <p className="text-gray-400 text-sm mt-1">{item.item_description}</p>
                      )}
                      {isReapplication && (
                        <p className="text-purple-400 text-xs mt-1">
                          🔄 Editing from original contract
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors duration-200"
                    >
                      {item.quantity > 1 ? 'Remove One' : 'Remove All'}
                    </button>
                  </div>

                  {/* Editable Contract Terms for Each Item */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quantity *
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleItemChange(index, 'quantity', item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={getAvailableQuantity(item.item_id) + item.quantity}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleItemChange(index, 'quantity', item.quantity + 1)}
                          disabled={getAvailableQuantity(item.item_id) <= 0}
                          className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Available: {getAvailableQuantity(item.item_id) + item.quantity} total
                      </p>
                    </div>

                    {/* Total Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Total Price (each) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.total_price}
                          onChange={(e) => handleItemChange(index, 'total_price', e.target.value)}
                          className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Down Payment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Down Payment (each) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={item.total_price}
                          value={item.down_payment}
                          onChange={(e) => handleItemChange(index, 'down_payment', e.target.value)}
                          className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Months */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Total Months *
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="60"
                        value={item.months}
                        onChange={(e) => handleItemChange(index, 'months', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Monthly Payment (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Monthly Payment (each)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          readOnly
                          value={formatNumber(item.monthly_payment)}
                          className="w-full pl-8 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300"
                        />
                      </div>
                    </div>

                    {/* Last Payment (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Month Payment (each)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          readOnly
                          value={formatNumber(item.installment_last_payment)}
                          className="w-full pl-8 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Breakdown for This Item */}
                  <div className="bg-gray-700/50 p-4 rounded-lg mt-4">
                    <h5 className="font-medium text-gray-300 mb-2">Payment Schedule:</h5>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="text-center p-2 bg-gray-600/30 rounded">
                        <p className="text-gray-400">Down Payment</p>
                        <p className="font-semibold text-blue-400">{formatCurrency(item.down_payment)}</p>
                        <p className="text-xs text-gray-500">Month 1</p>
                      </div>
                      <div className="text-center p-2 bg-gray-600/30 rounded">
                        <p className="text-gray-400">Monthly × {Math.max(0, item.months - 2)}</p>
                        <p className="font-semibold text-green-400">{formatCurrency(item.monthly_payment)}</p>
                        <p className="text-xs text-gray-500">Months 2-{item.months - 1}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-600/30 rounded">
                        <p className="text-gray-400">Last Payment</p>
                        <p className="font-semibold text-purple-400">{formatCurrency(item.installment_last_payment)}</p>
                        <p className="text-xs text-gray-500">Month {item.months}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-600/30 rounded">
                        <p className="text-gray-400">Total</p>
                        <p className="font-semibold text-white">{formatCurrency(item.total_price)}</p>
                        <p className="text-xs text-gray-500">Verification</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="mt-6 pt-6 border-t border-gray-600">
              <h4 className="font-semibold text-lg text-white mb-4">Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-blue-900/20 rounded-lg">
                  <p className="text-gray-400">Total Items</p>
                  <p className="text-2xl font-bold text-white">{getTotals().items}</p>
                </div>
                <div className="text-center p-3 bg-green-900/20 rounded-lg">
                  <p className="text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(getTotals().total_price)}</p>
                </div>
                <div className="text-center p-3 bg-purple-900/20 rounded-lg">
                  <p className="text-gray-400">Total Down Payment</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(getTotals().down_payment)}</p>
                </div>
                <div className="text-center p-3 bg-yellow-900/20 rounded-lg">
                  <p className="text-gray-400">Avg Monthly</p>
                  <p className="text-2xl font-bold text-white">
                    {getTotals().items > 0 
                      ? formatCurrency(getTotals().monthly_payment / getTotals().items)
                      : formatCurrency(0)
                    }
                  </p>
                </div>
                <div className="text-center p-3 bg-red-900/20 rounded-lg">
                  <p className="text-gray-400">Total Contracts</p>
                  <p className="text-2xl font-bold text-white">{getTotals().items}</p>
                </div>
              </div>
              {isReapplication && (
                <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                  <p className="text-purple-300 text-sm">
                    📝 <strong>Note:</strong> You're editing an existing contract. After submitting, a new contract will be created for review.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <button
            onClick={prevStep}
            disabled={loading}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors duration-200"
          >
            ← Back to Sponsors
          </button>
          <div className="flex flex-col items-end">
            <button
              onClick={onSubmit}
              disabled={!canSubmit() || loading}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isReapplication ? 'Resubmitting' : 'Submitting'} {getTotals().items} Contract(s)...
                </>
              ) : (
                <>
                  {isReapplication ? 'Resubmit' : 'Submit'} {getTotals().items} Contract(s)
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2">
              {getTotals().items} separate contract(s) will be created
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractItemsStep;