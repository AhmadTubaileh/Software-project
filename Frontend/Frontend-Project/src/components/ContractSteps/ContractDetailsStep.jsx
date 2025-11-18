import React, { useState, useEffect, useCallback } from 'react';

const ContractDetailsStep = ({ formData, updateFormData, prevStep, onSubmit, loading }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available installment items
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
        console.log('Fetched installment items:', data);
        
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

  // Calculate monthly payment based on your formula
  const calculateMonthlyPayment = (total, downPayment, months) => {
    if (total <= 0 || downPayment < 0 || months <= 1) return 0;
    
    const remaining = total - downPayment;
    return remaining / (months - 1);
  };

  // Update contract when item changes
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setIsDropdownOpen(false);
    setSearchTerm('');
    
    const contractData = {
      item_id: item.id,
      total_price: parseFloat(item.price_installment_total) || parseFloat(item.price_cash),
      down_payment: parseFloat(item.installment_first_payment) || 0,
      months: parseInt(item.installment_months) || 12,
      monthly_payment: parseFloat(item.installment_per_month) || 0
    };
    
    // Calculate monthly payment using the correct formula
    if (!contractData.monthly_payment && contractData.total_price && contractData.down_payment && contractData.months) {
      contractData.monthly_payment = calculateMonthlyPayment(
        contractData.total_price,
        contractData.down_payment,
        contractData.months
      );
    }
    
    updateFormData({
      contract: {
        ...formData.contract,
        ...contractData
      }
    });
  };

  const handleContractChange = (field, value) => {
    const updatedContract = {
      ...formData.contract,
      [field]: value
    };
    
    // Recalculate monthly payment if relevant fields change
    if (['total_price', 'down_payment', 'months'].includes(field)) {
      updatedContract.monthly_payment = calculateMonthlyPayment(
        updatedContract.total_price,
        updatedContract.down_payment,
        updatedContract.months
      );
    }
    
    updateFormData({ contract: updatedContract });
  };

  const canSubmit = () => {
    return formData.contract.item_id && 
           formData.contract.total_price > 0 &&
           formData.contract.down_payment >= 0 &&
           formData.contract.months > 1 && // Must be at least 2 months
           formData.contract.monthly_payment > 0;
  };

  // Calculate remaining amount after down payment
  const getRemainingAmount = () => {
    return formData.contract.total_price - formData.contract.down_payment;
  };

  // Calculate number of installment months (excluding first payment)
  const getInstallmentMonths = () => {
    return Math.max(0, formData.contract.months - 1);
  };

  // Get selected item name for display
  const getSelectedItemName = () => {
    if (!formData.contract.item_id) return 'Select an item...';
    const item = items.find(i => i.id === formData.contract.item_id);
    return item ? `${item.name} - $${item.price_installment_total || item.price_cash}` : 'Select an item...';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Step 4: Contract Details</h2>
      
      <div className="space-y-6">
        {/* Professional Item Selection Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Item *
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
                <span className={formData.contract.item_id ? 'text-white' : 'text-gray-400'}>
                  {getSelectedItemName()}
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
                        onClick={(e) => e.stopPropagation()}
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
                          onClick={() => handleItemSelect(item)}
                          className={`p-4 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors duration-150 ${
                            formData.contract.item_id === item.id
                              ? 'bg-blue-600/20 border-l-4 border-l-blue-500'
                              : 'hover:bg-gray-700/50'
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
                                ${item.price_installment_total || item.price_cash}
                              </div>
                              {item.available_quantity !== undefined && (
                                <div className={`text-xs mt-1 ${
                                  item.available_quantity > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {item.available_quantity > 0 
                                    ? `${item.available_quantity} available` 
                                    : 'Out of stock'
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Item Details */}
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-400">
                            <div>
                              <span>Cash: </span>
                              <span className="text-white">${item.price_cash}</span>
                            </div>
                            <div>
                              <span>Down: </span>
                              <span className="text-white">${item.installment_first_payment || 0}</span>
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
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-gray-900 border-t border-gray-600">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>{filteredItems.length} items found</span>
                      <span>↓ Use arrow keys to navigate</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Click outside to close dropdown */}
          {isDropdownOpen && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsDropdownOpen(false)}
            />
          )}
        </div>

        {/* Selected Item Details */}
        {selectedItem && (
          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <h3 className="font-semibold mb-3 text-white">Selected Item Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Name:</span>
                <p className="font-medium">{selectedItem.name}</p>
              </div>
              <div>
                <span className="text-gray-400">Description:</span>
                <p className="font-medium">{selectedItem.description}</p>
              </div>
              <div>
                <span className="text-gray-400">Cash Price:</span>
                <p className="font-medium">${selectedItem.price_cash}</p>
              </div>
              <div>
                <span className="text-gray-400">Installment Price:</span>
                <p className="font-medium">${selectedItem.price_installment_total}</p>
              </div>
              <div>
                <span className="text-gray-400">Down Payment:</span>
                <p className="font-medium">${selectedItem.installment_first_payment}</p>
              </div>
              <div>
                <span className="text-gray-400">Months:</span>
                <p className="font-medium">{selectedItem.installment_months}</p>
              </div>
              <div>
                <span className="text-gray-400">Monthly Payment:</span>
                <p className="font-medium">${selectedItem.installment_per_month}</p>
              </div>
              <div>
                <span className="text-gray-400">Available Quantity:</span>
                <p className="font-medium">
                  {selectedItem.available_quantity !== undefined 
                    ? `${selectedItem.available_quantity} (Total: ${selectedItem.quantity})`
                    : selectedItem.quantity
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rest of the component remains the same */}
        {/* Contract Terms, Start Date, Payment Breakdown, Action Buttons */}
        
        {/* Contract Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.contract.total_price}
                onChange={(e) => handleContractChange('total_price', parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Down Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Down Payment *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={formData.contract.total_price}
                value={formData.contract.down_payment}
                onChange={(e) => handleContractChange('down_payment', parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Months */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Months (including first payment) *
            </label>
            <input
              type="number"
              min="2"
              max="60"
              value={formData.contract.months}
              onChange={(e) => handleContractChange('months', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-gray-400 mt-1">
              Must be at least 2 months (1 down payment + 1 installment)
            </p>
          </div>

          {/* Monthly Payment (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monthly Payment (auto-calculated)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                readOnly
                value={formData.contract.monthly_payment.toFixed(2)}
                className="w-full pl-8 pr-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Calculated as: (Total - Down Payment) / (Months - 1)
            </p>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contract Start Date *
          </label>
          <input
            type="date"
            value={formData.contract.start_date}
            onChange={(e) => handleContractChange('start_date', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Payment Breakdown */}
        {formData.contract.total_price > 0 && (
          <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-3">Payment Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Amount:</span>
                <p className="font-medium text-lg">${formData.contract.total_price.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-400">Down Payment:</span>
                <p className="font-medium text-lg">${formData.contract.down_payment.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-400">Remaining Amount:</span>
                <p className="font-medium">
                  ${getRemainingAmount().toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Monthly Payment:</span>
                <p className="font-medium text-lg">${formData.contract.monthly_payment.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-400">Total Months:</span>
                <p className="font-medium">{formData.contract.months} months</p>
              </div>
              <div>
                <span className="text-gray-400">Installment Months:</span>
                <p className="font-medium">{getInstallmentMonths()} months</p>
              </div>
              <div>
                <span className="text-gray-400">Start Date:</span>
                <p className="font-medium">{new Date(formData.contract.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-400">Calculation:</span>
                <p className="font-medium text-xs">
                  (${formData.contract.total_price.toFixed(2)} - ${formData.contract.down_payment.toFixed(2)}) / ({formData.contract.months} - 1)
                </p>
              </div>
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
            ← Back
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit() || loading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              'Submit Contract Application'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailsStep;