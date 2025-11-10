import React, { useState, useEffect, useCallback } from 'react';

const ContractDetailsStep = ({ formData, updateFormData, prevStep, onSubmit, loading }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);

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

  // Update contract when item changes
  const handleItemChange = (itemId) => {
    const item = items.find(i => i.id === parseInt(itemId));
    setSelectedItem(item);
    
    if (item) {
      const contractData = {
        item_id: item.id,
        total_price: parseFloat(item.price_installment_total) || parseFloat(item.price_cash),
        down_payment: parseFloat(item.installment_first_payment) || 0,
        months: parseInt(item.installment_months) || 12,
        monthly_payment: parseFloat(item.installment_per_month) || 0
      };
      
      // Calculate monthly payment if not provided
      if (!contractData.monthly_payment && contractData.total_price && contractData.down_payment && contractData.months) {
        const remaining = contractData.total_price - contractData.down_payment;
        contractData.monthly_payment = remaining / contractData.months;
      }
      
      updateFormData({
        contract: {
          ...formData.contract,
          ...contractData
        }
      });
    }
  };

  const handleContractChange = (field, value) => {
    const updatedContract = {
      ...formData.contract,
      [field]: value
    };
    
    // Recalculate monthly payment if relevant fields change
    if (['total_price', 'down_payment', 'months'].includes(field)) {
      const remaining = updatedContract.total_price - updatedContract.down_payment;
      if (remaining > 0 && updatedContract.months > 0) {
        updatedContract.monthly_payment = remaining / updatedContract.months;
      }
    }
    
    updateFormData({ contract: updatedContract });
  };

  const canSubmit = () => {
    return formData.contract.item_id && 
           formData.contract.total_price > 0 &&
           formData.contract.months > 0 &&
           formData.contract.monthly_payment > 0;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Step 4: Contract Details</h2>
      
      <div className="space-y-6">
        {/* Item Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Item *
          </label>
          
          {itemsLoading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Loading available items...
            </div>
          ) : itemsError ? (
            <div className="text-red-400 bg-red-900/20 p-3 rounded-lg">
              Error loading items: {itemsError}
            </div>
          ) : (
            <select
              value={formData.contract.item_id}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Choose an item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - ${item.price_installment_total || item.price_cash} 
                  {item.available_quantity !== undefined && ` (Available: ${item.available_quantity})`}
                </option>
              ))}
            </select>
          )}
          
          {!itemsLoading && items.length === 0 && !itemsError && (
            <div className="text-yellow-400 bg-yellow-900/20 p-3 rounded-lg mt-2">
              No installment items available. Please add items with installment enabled in the Items management page.
            </div>
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
        {/* Contract Terms, Start Date, Contract Summary, Action Buttons */}
        
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
              Contract Months *
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={formData.contract.months}
              onChange={(e) => handleContractChange('months', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Monthly Payment (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monthly Payment
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

        {/* Contract Summary */}
        {formData.contract.total_price > 0 && (
          <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-3">Contract Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Amount:</span>
                <p className="font-medium text-lg">${formData.contract.total_price.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-400">Down Payment:</span>
                <p className="font-medium text-lg">${formData.contract.down_payment.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-400">Financed Amount:</span>
                <p className="font-medium">
                  ${(formData.contract.total_price - formData.contract.down_payment).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Monthly Payment:</span>
                <p className="font-medium text-lg">${formData.contract.monthly_payment.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-400">Duration:</span>
                <p className="font-medium">{formData.contract.months} months</p>
              </div>
              <div>
                <span className="text-gray-400">Start Date:</span>
                <p className="font-medium">{new Date(formData.contract.start_date).toLocaleDateString()}</p>
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