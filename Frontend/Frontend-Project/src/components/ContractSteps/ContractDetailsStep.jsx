import React, { useState, useEffect, useCallback } from 'react';

const ContractDetailsStep = ({ formData, updateFormData, prevStep, onSubmit, loading }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [latestPrice, setLatestPrice] = useState(null);
  const [calculationError, setCalculationError] = useState(null);

  // Calculate payments using your exact formula
  const calculatePayments = useCallback((total, down, months) => {
    // Reset error
    setCalculationError(null);
    
    // Validation
    if (months < 3) {
      setCalculationError('Minimum 3 months required');
      return {
        monthly_payment: 0,
        installment_last_payment: 0,
        error: 'Minimum 3 months required'
      };
    }
    
    if (down >= total) {
      setCalculationError('Down payment must be less than total price');
      return {
        monthly_payment: 0,
        installment_last_payment: 0,
        error: 'Down payment must be less than total price'
      };
    }

    const remaining = total - down;
    const equal_months = months - 2;
    
    if (equal_months <= 0) {
      setCalculationError('Invalid months calculation');
      return {
        monthly_payment: 0,
        installment_last_payment: 0,
        error: 'Invalid months calculation'
      };
    }

    // Step 1: Calculate raw monthly
    const raw_monthly = remaining / equal_months;
    
    // Step 2: Round down to nearest 10
    let monthly_payment = Math.floor(raw_monthly / 10) * 10;
    
    // Step 3: Calculate last payment
    let last_payment = remaining - (monthly_payment * equal_months);
    
    // Step 4: SPECIAL CASE - if last_payment is exactly 0
    if (last_payment === 0) {
      // Subtract 10 from each monthly payment
      monthly_payment = monthly_payment - 10;
      // Add 10*equal_months to last payment
      last_payment = 10 * equal_months;
    }

    // Validate monthly payment is positive
    if (monthly_payment <= 0) {
      setCalculationError('Monthly payment cannot be zero or negative');
      return {
        monthly_payment: 0,
        installment_last_payment: 0,
        error: 'Monthly payment cannot be zero or negative'
      };
    }

    return {
      monthly_payment,
      installment_last_payment: last_payment,
      error: null,
      calculation_details: {
        remaining,
        equal_months,
        raw_monthly,
        total_check: down + (monthly_payment * equal_months) + last_payment
      }
    };
  }, []);

  // Initialize formData.contract with default values if undefined
  useEffect(() => {
    if (!formData.contract) {
      updateFormData({
        contract: {
          item_id: '',
          price_id: null,
          total_price: 0,
          down_payment: 0,
          months: 12,
          monthly_payment: 0,
          installment_last_payment: 0,
          start_date: new Date().toISOString().split('T')[0]
        }
      });
    } else {
      // Ensure all required fields exist
      const updatedContract = {
        ...formData.contract,
        total_price: formData.contract.total_price || 0,
        down_payment: formData.contract.down_payment || 0,
        months: formData.contract.months || 12,
        monthly_payment: formData.contract.monthly_payment || 0,
        installment_last_payment: formData.contract.installment_last_payment || 0
      };
      
      if (JSON.stringify(updatedContract) !== JSON.stringify(formData.contract)) {
        updateFormData({ contract: updatedContract });
      }
    }
  }, [formData.contract]);

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

  // Update contract when item changes
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setIsDropdownOpen(false);
    setSearchTerm('');
    
    // Extract price information
    const priceInfo = {
      price_id: item.price_id || null,
      total_price: parseFloat(item.price_installment_total) || parseFloat(item.price_cash) || 0,
      down_payment: parseFloat(item.installment_first_payment) || 0,
      months: parseInt(item.installment_months) || 12,
      installment_last_payment: parseFloat(item.installment_last_payment) || 0
    };

    // Store the latest price info for reference
    setLatestPrice(priceInfo);

    // Calculate payments using the formula
    const calculated = calculatePayments(
      priceInfo.total_price,
      priceInfo.down_payment,
      priceInfo.months
    );

    const contractData = {
      item_id: item.id,
      price_id: priceInfo.price_id,
      total_price: priceInfo.total_price,
      down_payment: priceInfo.down_payment,
      months: priceInfo.months,
      monthly_payment: calculated.monthly_payment,
      installment_last_payment: calculated.installment_last_payment
    };
    
    updateFormData({
      contract: {
        ...formData.contract,
        ...contractData
      }
    });
  };

  // Handle manual changes to price fields
  const handleContractChange = (field, value) => {
    const numValue = field === 'months' ? parseInt(value) || 0 : parseFloat(value) || 0;
    
    const updatedContract = {
      ...formData.contract,
      [field]: numValue
    };
    
    // Recalculate payments if relevant fields change
    if (['total_price', 'down_payment', 'months'].includes(field)) {
      const calculated = calculatePayments(
        updatedContract.total_price,
        updatedContract.down_payment,
        updatedContract.months
      );
      
      updatedContract.monthly_payment = calculated.monthly_payment;
      updatedContract.installment_last_payment = calculated.installment_last_payment;
    }
    
    updateFormData({ contract: updatedContract });
  };

  // Calculate verification details
  const getCalculationDetails = () => {
    const contract = formData.contract || {};
    
    if (!contract.total_price || !contract.months) {
      return null;
    }

    const total = contract.total_price || 0;
    const down = contract.down_payment || 0;
    const months = contract.months || 0;
    const monthly = contract.monthly_payment || 0;
    const last = contract.installment_last_payment || 0;
    
    const remaining = total - down;
    const equal_months = Math.max(0, months - 2);
    
    return {
      remaining,
      equal_months,
      monthly_total: monthly * equal_months,
      total_calculated: down + (monthly * equal_months) + last,
      matches: Math.abs(total - (down + (monthly * equal_months) + last)) < 0.01
    };
  };

  const canSubmit = () => {
    const contract = formData.contract || {};
    return contract.item_id && 
           contract.total_price > 0 &&
           contract.down_payment >= 0 &&
           contract.months >= 3 &&
           contract.monthly_payment > 0 &&
           !calculationError;
  };

  // Get selected item name for display
  const getSelectedItemName = () => {
    const contract = formData.contract || {};
    if (!contract.item_id) return 'Select an item...';
    const item = items.find(i => i.id === contract.item_id);
    return item ? `${item.name} - $${item.price_installment_total || item.price_cash || '0.00'}` : 'Select an item...';
  };

  // Format number for display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0.00';
    return parseFloat(num).toFixed(2);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Step 4: Contract Details</h2>
      
      {calculationError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-red-400">⚠️</span>
            <span className="text-red-300">{calculationError}</span>
          </div>
        </div>
      )}
      
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
                <span className={(formData.contract?.item_id) ? 'text-white' : 'text-gray-400'}>
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
                            formData.contract?.item_id === item.id
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
                                ${item.price_installment_total || item.price_cash || '0.00'}
                              </div>
                              {item.quantity !== undefined && (
                                <div className={`text-xs mt-1 ${
                                  item.quantity > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {item.quantity > 0 
                                    ? `${item.quantity} available` 
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
                              <span className="text-white">${item.price_cash || 'N/A'}</span>
                            </div>
                            <div>
                              <span>Down: </span>
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
                value={formData.contract?.total_price || 0}
                onChange={(e) => handleContractChange('total_price', e.target.value)}
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
                max={formData.contract?.total_price || 0}
                value={formData.contract?.down_payment || 0}
                onChange={(e) => handleContractChange('down_payment', e.target.value)}
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
              min="3"
              max="60"
              value={formData.contract?.months || 12}
              onChange={(e) => handleContractChange('months', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-xs text-gray-400 mt-1">
              Minimum 3 months required (1 down payment + 1 installment + 1 last payment)
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
                value={formatNumber(formData.contract?.monthly_payment)}
                className="w-full pl-8 pr-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Calculated using the formula: (Total - Down) / (Months - 2), rounded down to nearest 10
            </p>
          </div>
        </div>

        {/* Last Payment (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Last Month Payment (auto-calculated)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              readOnly
              value={formatNumber(formData.contract?.installment_last_payment)}
              className="w-full pl-8 pr-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Special case: If last payment becomes 0, $10 is subtracted from each monthly payment
          </p>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contract Start Date *
          </label>
          <input
            type="date"
            value={formData.contract?.start_date || new Date().toISOString().split('T')[0]}
            onChange={(e) => handleContractChange('start_date', e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Payment Breakdown */}
        {formData.contract?.total_price > 0 && (
          <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-3">Payment Schedule Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Amount:</span>
                <p className="font-medium text-lg">${formatNumber(formData.contract?.total_price)}</p>
              </div>
              <div>
                <span className="text-gray-400">Down Payment:</span>
                <p className="font-medium text-lg">${formatNumber(formData.contract?.down_payment)}</p>
                <p className="text-xs text-gray-500">Month 1</p>
              </div>
              <div>
                <span className="text-gray-400">Remaining Amount:</span>
                <p className="font-medium">
                  ${formatNumber((formData.contract?.total_price || 0) - (formData.contract?.down_payment || 0))}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Last Month Payment:</span>
                <p className="font-medium text-lg">${formatNumber(formData.contract?.installment_last_payment)}</p>
                <p className="text-xs text-gray-500">Month {formData.contract?.months}</p>
              </div>
              <div>
                <span className="text-gray-400">Total Months:</span>
                <p className="font-medium">{formData.contract?.months || 0} months</p>
              </div>
              <div>
                <span className="text-gray-400">Installment Months:</span>
                <p className="font-medium">{Math.max(0, (formData.contract?.months || 0) - 2)} months</p>
              </div>
              <div>
                <span className="text-gray-400">Monthly Payment:</span>
                <p className="font-medium text-lg">${formatNumber(formData.contract?.monthly_payment)}</p>
                <p className="text-xs text-gray-500">
                  Months 2 to {(formData.contract?.months || 0) - 1}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Calculation:</span>
                <p className="font-medium text-xs">
                  (${formatNumber(formData.contract?.total_price)} - ${formatNumber(formData.contract?.down_payment)}) / ({(formData.contract?.months || 0)} - 2)
                </p>
              </div>
            </div>
            
            {/* Verification */}
            {getCalculationDetails() && (
              <div className={`mt-4 p-3 rounded ${
                getCalculationDetails().matches 
                  ? 'bg-green-900/20 border border-green-500' 
                  : 'bg-red-900/20 border border-red-500'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={getCalculationDetails().matches ? 'text-green-400' : 'text-red-400'}>
                    {getCalculationDetails().matches ? '✅' : '❌'}
                  </span>
                  <span className="text-sm">
                    {getCalculationDetails().matches 
                      ? 'Calculation verified correctly' 
                      : 'Calculation mismatch! Please check values'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  ${formatNumber(formData.contract?.down_payment)} + 
                  (${formatNumber(formData.contract?.monthly_payment)} × {Math.max(0, (formData.contract?.months || 0) - 2)}) + 
                  ${formatNumber(formData.contract?.installment_last_payment)} = 
                  ${getCalculationDetails().total_calculated.toFixed(2)}
                </p>
              </div>
            )}
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