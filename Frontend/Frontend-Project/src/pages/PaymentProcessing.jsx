import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import PaymentSearch from '../components/PaymentProcessing/PaymentSearch.jsx';
import ContractDetails from '../components/PaymentProcessing/ContractDetails.jsx';
import PaymentForm from '../components/PaymentProcessing/PaymentForm.jsx';
import PaymentReceipt from '../components/PaymentProcessing/PaymentReceipt.jsx';
import toast, { Toaster } from 'react-hot-toast';

function PaymentProcessing() {
  const { currentUser } = useLocalSession();
  
  // ========== ACCESS CONTROL START ==========
  // Get user_type from currentUser
  const userType = currentUser?.user_type ?? 5; // Default to trainee if not set
  
  // Only Admin (0), Senior Manager (1), Manager (2), Supervisor (3), and Employee (4) can access this page
  // Trainee (5) cannot access
  const allowedRoles = [0, 1, 2, 3, 4];
  
  if (!allowedRoles.includes(userType)) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        <AdminSidebar />
        <div className="ml-64 min-h-screen flex items-center justify-center">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-4">
                Your account ({getRoleName(userType)}) does not have permission to access this page.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This page is only accessible to Administrators, Managers, Supervisors, and Employees.
                Trainees cannot process payments.
              </p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ========== ACCESS CONTROL END ==========

  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name' or 'id_card'
  const [searchResults, setSearchResults] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractPayments, setContractPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  
  // Ref for scrolling to payment form
  const paymentFormRef = useRef(null);

  // Search for contracts by customer name OR ID card number
  // Note: PaymentProcessing shows ALL contracts from ALL branches (no branch filter)
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      toast.error(`Please enter a ${searchType === 'name' ? 'customer name' : 'ID card number'} to search`);
      return;
    }

    setLoading(true);
    try {
      // PaymentProcessing should show all contracts regardless of branch
      const response = await fetch(
        `http://localhost:5000/api/payments/search?${searchType}=${encodeURIComponent(searchTerm)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search contracts');
      }
      
      const data = await response.json();
      setSearchResults(data.contracts || []);
      
      if (data.contracts.length === 0) {
        toast.error(`No contracts found for this ${searchType === 'name' ? 'customer' : 'ID card number'}`);
      } else {
        toast.success(`Found ${data.contracts.length} contract${data.contracts.length !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search contracts');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchType]);

  // Select a contract and load its payments
  const handleSelectContract = async (contract) => {
    setLoading(true);
    try {
      // Load contract details with price info
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
      toast.error('Please enter a valid amount');
      return;
    }

    // FIX: Parse amount with 2 decimal places to avoid floating-point issues
    const paymentAmountNum = parseFloat(parseFloat(paymentAmount).toFixed(2));
    
    // Validate down payment amount
    if (selectedPayment.month_number === 0) {
      const downPaymentDue = parseFloat(selectedPayment.amount_due);
      
      // Debug logging (optional - can remove in production)
      console.log('🔍 Down Payment Validation Frontend:');
      console.log('  Due Amount:', downPaymentDue, '(type:', typeof downPaymentDue, ')');
      console.log('  Entered Amount (raw):', paymentAmount);
      console.log('  Parsed Amount (fixed):', paymentAmountNum, '(type:', typeof paymentAmountNum, ')');
      console.log('  Current Amount Paid:', selectedPayment.amount_paid);
      
      // Check if down payment is already paid (allow for rounding)
      const currentPaid = parseFloat(selectedPayment.amount_paid || 0);
      if (currentPaid >= downPaymentDue) {
        toast.error(`Down payment has already been paid ($${currentPaid.toFixed(2)} paid)`);
        return;
      }
      
      // Use very small tolerance for comparison (0.001 = 0.1 cent)
      const tolerance = 0.001;
      const difference = Math.abs(paymentAmountNum - downPaymentDue);
      const isExactAmount = difference <= tolerance;
      
      console.log('  Difference:', difference);
      console.log('  Within tolerance?', isExactAmount);
      
      if (!isExactAmount) {
        toast.error(`Down payment must be exactly $${downPaymentDue.toFixed(2)} (you entered $${paymentAmountNum.toFixed(2)})`);
        return;
      }
      
      console.log('✅ Down payment amount validated successfully in frontend');
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
          amount_paid: paymentAmountNum, // Use the parsed amount with fixed decimals
          worker_id: currentUser.id  // Use current user's ID as worker_id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }

      toast.success(data.message || 'Payment processed successfully!');
      
      // Store payment data for receipt before refreshing
      const paymentForReceipt = { ...selectedPayment };
      const contractForReceipt = { ...selectedContract };
      const amountPaidForReceipt = paymentAmountNum;
      
      // Prepare receipt data
      setReceiptData({
        paymentId: data.paymentId || selectedPayment.id,
        payment: paymentForReceipt,
        contract: contractForReceipt,
        amountPaid: amountPaidForReceipt,
        currentUser: currentUser,
        timestamp: data.timestamp || new Date().toISOString()
      });
      
      // Show receipt
      setShowReceipt(true);
      
      // Refresh contract details and payments
      if (selectedContract) {
        // Reload contract details
        const contractResponse = await fetch(`http://localhost:5000/api/contracts/${selectedContract.id}`);
        if (contractResponse.ok) {
          const contractData = await contractResponse.json();
          setSelectedContract(contractData.contract);
        }

        // Reload payments
        const paymentsResponse = await fetch(`http://localhost:5000/api/payments/contract/${selectedContract.id}`);
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          setContractPayments(paymentsData.payments || []);
          
          // Find next unpaid payment to auto-select
          const nextUnpaidPayment = paymentsData.payments.find(p => p.status !== 'paid');
          
          if (nextUnpaidPayment) {
            setSelectedPayment(nextUnpaidPayment);
            // Scroll to payment form for the next payment
            setTimeout(() => {
              if (paymentFormRef.current) {
                paymentFormRef.current.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            }, 100);
          } else {
            setSelectedPayment(null);
          }
        }
      }

      // Reset payment amount
      setPaymentAmount('');
      
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  // Clear search results
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedContract(null);
    setContractPayments([]);
    setSelectedPayment(null);
    setPaymentAmount('');
  };

  // Function to manually scroll to payment form
  const scrollToPaymentForm = () => {
    if (paymentFormRef.current) {
      paymentFormRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-h-[90vh] overflow-y-auto">
            <PaymentReceipt 
              paymentData={receiptData}
              onClose={() => {
                setShowReceipt(false);
                setReceiptData(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Payment Processing
                </h1>
                <p className="text-gray-400 mt-2">
                  Process installment payments for approved contracts
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Logged in as: {currentUser?.username} ({getRoleName(userType)})
                </p>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <PaymentSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchType={searchType}
            setSearchType={setSearchType}
            loading={loading}
            onSearch={handleSearch}
          />

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Clear Search Button */}
            {(searchResults.length > 0 || searchTerm) && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors duration-200 text-sm flex items-center gap-2"
              >
                <span>🗑️</span>
                <span>Clear Search</span>
              </button>
            )}
            
            {/* Scroll to Payment Form Button (only when there's a selected payment) */}
            {selectedPayment && selectedPayment.status !== 'paid' && (
              <button
                onClick={scrollToPaymentForm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors duration-200 text-sm flex items-center gap-2"
              >
                <span>↓</span>
                <span>Scroll to Payment Form</span>
              </button>
            )}
            
            {/* Refresh Selected Contract Button */}
            {selectedContract && (
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const contractResponse = await fetch(`http://localhost:5000/api/contracts/${selectedContract.id}`);
                    if (contractResponse.ok) {
                      const contractData = await contractResponse.json();
                      setSelectedContract(contractData.contract);
                    }
                    
                    const paymentsResponse = await fetch(`http://localhost:5000/api/payments/contract/${selectedContract.id}`);
                    if (paymentsResponse.ok) {
                      const paymentsData = await paymentsResponse.json();
                      setContractPayments(paymentsData.payments || []);
                    }
                    toast.success('Contract data refreshed');
                  } catch (error) {
                    console.error('Refresh error:', error);
                    toast.error('Failed to refresh contract data');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors duration-200 text-sm flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Refresh Data</span>
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Found {searchResults.length} contract{searchResults.length !== 1 ? 's' : ''}
                </h3>
                <span className="text-sm text-gray-400 px-3 py-1 bg-gray-700/50 rounded-full">
                  Searching by: {searchType === 'name' ? 'Customer Name' : 'ID Card Number'}
                </span>
              </div>
              
              <div className="grid gap-3">
                {searchResults.map((contract) => (
                  <div
                    key={contract.id}
                    className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 hover:border-blue-500/50 transition-colors duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.005]"
                    onClick={() => handleSelectContract(contract)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl mt-1">
                            {contract.status === 'completed' ? '✅' : 
                             contract.status === 'active' ? '🔄' : '⏳'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white text-lg">{contract.item_name}</p>
                            {contract.branch_name && (
                              <p className="text-sm text-blue-400 mt-1 flex items-center gap-1">
                                <span>📍</span>
                                <span>Branch: {contract.branch_name}</span>
                              </p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div>
                                <p className="text-sm text-gray-400">Customer</p>
                                <p className="font-medium">{contract.customer_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Phone</p>
                                <p className="font-medium">{contract.customer_phone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Contract ID</p>
                                <p className="font-medium">#{contract.id}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Total Amount</p>
                                <p className="font-medium text-green-400">{formatCurrency(contract.total_price)}</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {contract.months} months × {formatCurrency(contract.monthly_payment)}/mo
                              • Last: {formatCurrency(contract.installment_last_payment)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right pl-4">
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${
                          contract.status === 'active' ? 'bg-green-600' : 
                          contract.status === 'pending' ? 'bg-yellow-600' : 
                          contract.status === 'completed' ? 'bg-blue-600' : 'bg-red-600'
                        }`}>
                          {contract.status.toUpperCase()}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">
                          Click to view payments
                        </p>
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
              onSelectPayment={(payment) => {
                setSelectedPayment(payment);
                // Scroll to payment form after a short delay
                setTimeout(() => {
                  if (paymentFormRef.current) {
                    paymentFormRef.current.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }
                }, 100);
              }}
            />
          )}

          {/* Payment Form with ref for scrolling */}
          {selectedPayment && selectedPayment.status !== 'paid' && (
            <div ref={paymentFormRef} className="scroll-mt-6">
              <PaymentForm
                payment={selectedPayment}
                paymentAmount={paymentAmount}
                setPaymentAmount={setPaymentAmount}
                processing={processing}
                onSubmit={handleSubmitPayment}
                contract={selectedContract}
              />
            </div>
          )}

          {/* No Payment Selected Message */}
          {selectedContract && (!selectedPayment || selectedPayment.status === 'paid') && contractPayments.length > 0 && (
            <div className="mt-6 p-6 bg-gray-800/50 rounded-xl border border-gray-700/50 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2">All Payments Completed!</h3>
              <p className="text-gray-400 mb-4">
                All payments for this contract have been processed successfully.
              </p>
              <button
                onClick={handleClearSearch}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors duration-200"
              >
                Search for Another Contract
              </button>
            </div>
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

// Helper function to get role name
function getRoleName(userType) {
  switch(userType) {
    case 0: return 'Administrator';
    case 1: return 'Senior Manager';
    case 2: return 'Manager';
    case 3: return 'Supervisor';
    case 4: return 'Employee';
    case 5: return 'Trainee';
    default: return 'User';
  }
}

export default PaymentProcessing;