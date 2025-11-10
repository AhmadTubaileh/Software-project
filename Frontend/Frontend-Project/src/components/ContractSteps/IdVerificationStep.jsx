import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const IdVerificationStep = ({ formData, updateFormData, nextStep }) => {
  const [verifying, setVerifying] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleIdCardChange = (e) => {
    const idCardNumber = e.target.value;
    updateFormData({ idCardNumber });
    setSearched(false);
  };

  const verifyIdCard = async () => {
    if (!formData.idCardNumber.trim()) {
      toast.error('Please enter an ID card number');
      return;
    }

    // Validate ID card format (basic validation)
    if (formData.idCardNumber.trim().length < 5) {
      toast.error('Please enter a valid ID card number');
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('http://localhost:5000/api/customers/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_card_number: formData.idCardNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSearched(true);
      
      if (data.exists) {
        // Pre-fill customer data if exists
        const customerData = data.customerData;
        updateFormData({
          existingCustomer: customerData,
          customer: {
            ...formData.customer,
            full_name: customerData.full_name || '',
            phone: customerData.phone || '',
            id_card_number: formData.idCardNumber,
            address: customerData.address || '',
            email: customerData.email || ''
          }
        });
        toast.success(`Customer found! ${data.type === 'user' ? 'User account' : 'Existing contract customer'}`);
      } else {
        updateFormData({
          existingCustomer: null,
          customer: {
            ...formData.customer,
            id_card_number: formData.idCardNumber,
            full_name: '',
            phone: '',
            address: '',
            email: ''
          }
        });
        toast.success('ID card not found. Please fill in customer information.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      
      // More specific error messages
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        toast.error('Network error: Cannot connect to server');
      } else {
        toast.error(error.message || 'Failed to verify ID card');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verifyIdCard();
    }
  };

  const canProceed = searched && formData.idCardNumber.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Step 1: ID Card Verification</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ID Card Number *
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={formData.idCardNumber}
              onChange={handleIdCardChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter customer's ID card number"
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              disabled={verifying}
            />
            <button
              onClick={verifyIdCard}
              disabled={verifying || !formData.idCardNumber.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            We'll check if this ID exists in our system (users or existing customers)
          </p>
        </div>

        {/* Verification Result */}
        {searched && (
          <div className={`p-4 rounded-lg border ${
            formData.existingCustomer 
              ? 'bg-green-900/20 border-green-500' 
              : 'bg-blue-900/20 border-blue-500'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`text-2xl ${
                formData.existingCustomer ? 'text-green-400' : 'text-blue-400'
              }`}>
                {formData.existingCustomer ? '✅' : '🆕'}
              </div>
              <div>
                <h3 className="font-semibold">
                  {formData.existingCustomer 
                    ? 'Customer Found!' 
                    : 'New Customer'}
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  {formData.existingCustomer 
                    ? `Existing ${formData.existingCustomer.type === 'user' ? 'user' : 'contract customer'} found. You can review and update their information in the next step.`
                    : 'This is a new customer. Please fill in their information in the next step.'}
                </p>
                {formData.existingCustomer && (
                  <div className="mt-2 text-xs text-gray-400">
                    <p><strong>Name:</strong> {formData.existingCustomer.full_name}</p>
                    <p><strong>Phone:</strong> {formData.existingCustomer.phone}</p>
                    {formData.existingCustomer.address && (
                      <p><strong>Address:</strong> {formData.existingCustomer.address}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-300 mb-2">How it works:</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Enter the customer's ID card number</li>
            <li>• We'll search in both user accounts and existing contract customers</li>
            <li>• If found, we'll pre-fill their information</li>
            <li>• If not found, you'll need to enter their details manually</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-6">
          <button
            onClick={nextStep}
            disabled={!canProceed}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-2"
          >
            Continue to Customer Info
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdVerificationStep;