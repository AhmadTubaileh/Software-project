import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import PaymentSearch from '../components/PaymentProcessing/PaymentSearch.jsx';
import ContractDetails from '../components/PaymentProcessing/ContractDetails.jsx';
import PaymentForm from '../components/PaymentProcessing/PaymentForm.jsx';
import toast, { Toaster } from 'react-hot-toast';

function PaymentProcessing() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractPayments, setContractPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { currentUser } = useLocalSession();

  // Access control
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'worker')) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need admin or worker privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Search for contracts by customer name
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a customer name to search');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/payments/search?customer=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search contracts');
      }
      
      const data = await response.json();
      setSearchResults(data.contracts || []);
      
      if (data.contracts.length === 0) {
        toast.error('No contracts found for this customer');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search contracts');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Select a contract and load its payments
  const handleSelectContract = async (contract) => {
    setLoading(true);
    try {
      // Load contract details
      const contractResponse = await fetch(`http://localhost:5000/api/contracts/${contract.id}`);
      if (!contractResponse.ok) {
        throw new Error('Failed to fetch contract details');
      }
      const contractData = await contractResponse.json();

      // Load payments
      const paymentsResponse = await fetch(`http://localhost:5000/api/payments/contract/${contract.id}`);
      if (!paymentsResponse.ok) {
        throw new Error('Failed to fetch payments');
      }
      const paymentsData = await paymentsResponse.json();

      setSelectedContract(contractData.contract);
      setContractPayments(paymentsData.payments || []);
      setSelectedPayment(null);
      setPaymentAmount('');
      
    } catch (error) {
      console.error('Error selecting contract:', error);
      toast.error('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment submission
  const handleSubmitPayment = async () => {
    if (!selectedPayment || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please select a payment and enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: selectedPayment.id,
          amount_paid: parseFloat(paymentAmount),
          worker_id: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }

      toast.success(data.message || 'Payment processed successfully!');
      
      // Refresh payments
      if (selectedContract) {
        const paymentsResponse = await fetch(`http://localhost:5000/api/payments/contract/${selectedContract.id}`);
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          setContractPayments(paymentsData.payments || []);
        }
      }

      // Reset form
      setSelectedPayment(null);
      setPaymentAmount('');
      
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Payment Processing
            </h1>
            <p className="text-gray-400 mt-2">
              Process installment payments for approved contracts
            </p>
          </div>

          {/* Search Section */}
          <PaymentSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            loading={loading}
            onSearch={handleSearch}
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Found {searchResults.length} contract{searchResults.length !== 1 ? 's' : ''}
              </h3>
              <div className="grid gap-3">
                {searchResults.map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 hover:border-blue-500/50 transition-colors duration-200 cursor-pointer"
                    onClick={() => handleSelectContract(contract)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white">{contract.item_name}</p>
                        <p className="text-sm text-gray-400">
                          Customer: {contract.customer_name} • Phone: {contract.customer_phone}
                        </p>
                        <p className="text-xs text-gray-500">
                          Contract #{contract.id} • Total: {formatCurrency(contract.total_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          contract.status === 'active' ? 'bg-green-600' : 
                          contract.status === 'pending' ? 'bg-yellow-600' : 
                          contract.status === 'completed' ? 'bg-blue-600' : 'bg-red-600'
                        }`}>
                          {contract.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Contract Details */}
          {selectedContract && (
            <ContractDetails
              contract={selectedContract}
              payments={contractPayments}
              selectedPayment={selectedPayment}
              onSelectPayment={setSelectedPayment}
            />
          )}

          {/* Payment Form */}
          {selectedPayment && selectedPayment.status !== 'paid' && (
            <PaymentForm
              payment={selectedPayment}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              processing={processing}
              onSubmit={handleSubmitPayment}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

export default PaymentProcessing;