import React, { useEffect, useRef } from 'react';

const ContractDetails = ({ contract, payments, selectedPayment, onSelectPayment }) => {
  const paymentFormRef = useRef(null);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00' || dateString === 'null' || dateString === 'NULL') {
      return 'N/A';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate remaining amount
  const calculateRemainingAmount = (payment) => {
    const due = parseFloat(payment.amount_due) || 0;
    const paid = parseFloat(payment.amount_paid) || 0;
    return Math.max(0, due - paid);
  };

  const getPaymentStatusBadge = (payment) => {
    const remainingAmount = calculateRemainingAmount(payment);
    
    // Check if payment is overdue
    if (payment.is_overdue === 1 || payment.is_overdue === true) {
      return (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-600">
          OVERDUE
        </span>
      );
    }
    
    const statusConfig = {
      'paid': { color: 'bg-green-600', text: 'Paid' },
      'partial': { color: 'bg-blue-600', text: `Partial (${formatCurrency(remainingAmount)} left)` },
      'pending': { color: 'bg-yellow-600', text: `Pending (${formatCurrency(payment.amount_due)} due)` }
    };
    
    const config = statusConfig[payment.status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Check if payment is overdue
  const isPaymentOverdue = (payment) => {
    return payment.is_overdue === 1 || payment.is_overdue === true;
  };

  // Get row background color based on status
  const getRowBackgroundColor = (payment) => {
    if (isPaymentOverdue(payment)) {
      return 'bg-red-900/20 border-red-500/30';
    }
    
    if (selectedPayment?.id === payment.id) {
      return 'border-blue-500 bg-blue-500/20';
    }
    
    if (payment.status === 'paid') {
      return 'opacity-60 border-gray-600/30';
    }
    
    return 'border-gray-600/50';
  };

  // Get emoji based on payment status
  const getPaymentEmoji = (payment) => {
    if (isPaymentOverdue(payment)) return '🔴';
    if (payment.status === 'paid') return '✅';
    if (payment.status === 'partial') return '🟡';
    if (selectedPayment?.id === payment.id) return '⏳';
    return '🔒';
  };

  // Check if this payment is clickable (only the current/activated one)
  const isPaymentClickable = (payment) => {
    // Paid payments are never clickable
    if (payment.status === 'paid') return false;
    
    // Only the currently selected payment is clickable
    return selectedPayment?.id === payment.id;
  };

  // Automatically select the first unpaid payment when payments load
  useEffect(() => {
    if (payments.length > 0 && !selectedPayment) {
      const firstUnpaidPayment = payments.find(p => p.status !== 'paid');
      if (firstUnpaidPayment) {
        onSelectPayment(firstUnpaidPayment);
      }
    }
  }, [payments, selectedPayment, onSelectPayment]);

  // Function to get next payment in sequence
  const getNextPaymentInSequence = (currentPayment) => {
    const currentIndex = payments.findIndex(p => p.id === currentPayment?.id);
    if (currentIndex === -1) {
      return payments.find(p => p.status !== 'paid');
    }
    
    // Find next unpaid payment after current one
    for (let i = currentIndex + 1; i < payments.length; i++) {
      if (payments[i].status !== 'paid') {
        return payments[i];
      }
    }
    
    return null;
  };

  // Function to handle payment selection with scroll (only for activated payment)
  const handlePaymentSelect = (payment) => {
    if (!isPaymentClickable(payment)) {
      return; // Don't select non-clickable payments
    }
    
    // Scroll to payment form after a short delay
    setTimeout(() => {
      if (paymentFormRef.current) {
        paymentFormRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  // Get payment status description
  const getPaymentStatusDescription = (payment) => {
    if (payment.status === 'paid') return 'Already paid';
    if (selectedPayment?.id === payment.id) return 'Currently processing - Click to scroll to payment';
    if (payment.status === 'partial') return 'Partially paid - Complete previous payments first';
    return 'Awaiting previous payments';
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 mb-6">
      <h3 className="text-xl font-semibold mb-4">Selected Contract</h3>
      
      {/* Contract Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Customer</p>
          <p className="font-semibold text-lg">{contract.customer_name}</p>
          <p className="text-gray-400">{contract.customer_phone}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Item</p>
          <p className="font-semibold text-lg">{contract.item_name}</p>
          <p className="text-gray-400">Total: {formatCurrency(contract.total_price)}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Payment Plan</p>
          <p className="font-semibold text-lg">{contract.months} months</p>
          <p className="text-gray-400">{formatCurrency(contract.monthly_payment)}/month</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Contract Status</p>
          <p className={`font-semibold text-lg ${
            contract.status === 'completed' ? 'text-green-400' :
            contract.status === 'active' ? 'text-blue-400' :
            contract.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {contract.status.toUpperCase()}
          </p>
          <p className="text-gray-400 text-sm">
            {contract.status === 'completed' ? 'All payments completed' :
             contract.status === 'active' ? 'Payments in progress' :
             contract.status === 'pending' ? 'Awaiting approval' : 'Rejected'}
          </p>
        </div>
      </div>

      {/* Current Payment Indicator */}
      {selectedPayment && (
        <div className={`mb-6 p-4 rounded-lg border ${
          isPaymentOverdue(selectedPayment) 
            ? 'bg-red-900/20 border-red-500/30' 
            : 'bg-blue-500/10 border-blue-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getPaymentEmoji(selectedPayment)}</div>
              <div>
                <p className={`font-semibold ${isPaymentOverdue(selectedPayment) ? 'text-red-400' : 'text-blue-400'}`}>
                  Currently Processing: {isPaymentOverdue(selectedPayment) && '⚠️ '}
                  Month {selectedPayment.month_number} 
                  {selectedPayment.month_number === 0 && ' (Down Payment)'}
                </p>
                <div className="text-sm grid grid-cols-2 gap-4 mt-1">
                  <div>
                    <span className="text-gray-400">Bill Date:</span>
                    <span className="font-medium ml-1">{formatDate(selectedPayment.bill_date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Due Date:</span>
                    <span className={`font-medium ml-1 ${
                      isPaymentOverdue(selectedPayment) ? 'text-red-400' : ''
                    }`}>
                      {selectedPayment.month_number === 0 ? 'Immediate' : formatDate(selectedPayment.due_date)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Remaining: {formatCurrency(calculateRemainingAmount(selectedPayment))}
                </p>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => handlePaymentSelect(selectedPayment)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <span>↓</span>
                <span>Go to Payment</span>
              </button>
              <p className="text-sm text-gray-400 mt-2">Next in line:</p>
              <p className="font-semibold">
                {(() => {
                  const nextPayment = getNextPaymentInSequence(selectedPayment);
                  return nextPayment 
                    ? `Month ${nextPayment.month_number}` 
                    : 'None (Last payment)';
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Schedule */}
      <h4 className="text-lg font-semibold mb-4">Payment Schedule</h4>
      {payments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">💳</div>
          <p>No payment schedule found for this contract</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {payments.map((payment) => {
            const remainingAmount = calculateRemainingAmount(payment);
            const isOverdue = isPaymentOverdue(payment);
            const isPaid = payment.status === 'paid';
            const isClickable = isPaymentClickable(payment);
            const isCurrentPayment = selectedPayment?.id === payment.id;
            
            return (
              <div
                key={payment.id}
                className={`rounded-lg p-4 border transition-all duration-200 ${
                  getRowBackgroundColor(payment)
                } ${isClickable ? 'cursor-pointer hover:shadow-lg hover:border-blue-400' : 'cursor-default'}`}
                onClick={() => isClickable && handlePaymentSelect(payment)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">
                        {getPaymentEmoji(payment)}
                      </div>
                      <div className="flex-1">
                        {/* Payment Header */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-lg">
                              Month {payment.month_number} 
                              {payment.month_number === 0 && <span className="ml-2 text-yellow-400">(Down Payment)</span>}
                              {isOverdue && <span className="ml-2 text-red-400">⚠️ OVERDUE</span>}
                            </p>
                            <p className={`text-sm ${isCurrentPayment ? 'text-blue-400' : 'text-gray-400'}`}>
                              {getPaymentStatusDescription(payment)}
                              {isCurrentPayment && isClickable && ' ↓'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPaymentStatusBadge(payment)}
                            {isClickable && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePaymentSelect(payment);
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors duration-200 flex items-center gap-1"
                                title="Scroll to payment form"
                              >
                                <span>↓</span>
                                <span>Pay Now</span>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Payment Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-gray-700/30 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Bill Date</p>
                            <p className="font-medium">{formatDate(payment.bill_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Due Date</p>
                            <p className={`font-medium ${isOverdue ? 'text-red-400' : ''}`}>
                              {payment.month_number === 0 ? 'Immediate' : formatDate(payment.due_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Original Due</p>
                            <p className="font-medium">{formatCurrency(payment.amount_due)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Remaining</p>
                            <p className={`font-semibold ${
                              remainingAmount > 0.01 ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {formatCurrency(remainingAmount)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Payment Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Payment Progress</span>
                            <span>{((payment.amount_paid / payment.amount_due) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                isOverdue ? 'bg-red-500' :
                                payment.status === 'paid' ? 'bg-green-500' :
                                payment.status === 'partial' ? 'bg-blue-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min(100, (payment.amount_paid / payment.amount_due) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Paid: {formatCurrency(payment.amount_paid)}</span>
                            <span>Due: {formatCurrency(payment.amount_due)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Payment Legend */}
      <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
        <h5 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Payment Status Legend
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-300">Overdue - Payment is past due date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-300">Paid - Payment completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-300">Pending - Awaiting payment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-300">Partial - Partially paid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-300"></div>
            <span className="text-sm text-gray-300">Current - Ready for processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xl">🔒</div>
            <span className="text-sm text-gray-300">Locked - Complete previous payments first</span>
          </div>
        </div>
      </div>

      {/* Payment Sequence Rules */}
      <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
        <h5 className="font-semibold mb-2 flex items-center gap-2">
          <span className="text-lg">⚡</span>
          Payment Processing Rules
        </h5>
        <ul className="text-sm text-gray-400 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>Payments must be processed in <strong>sequence order</strong> (Month 0 → 1 → 2 → etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">•</span>
            <span><strong>Down Payment (Month 0)</strong> must be paid in full before any installments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">•</span>
            <span><strong>Overdue payments</strong> (highlighted in red) should be prioritized</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Only the <strong>current payment</strong> (highlighted in blue) can be selected and processed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span>System automatically advances to next payment after current one is completed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-400">•</span>
            <span><strong>Click the "Pay Now" button</strong> on the current payment to scroll to payment form</span>
          </li>
        </ul>
      </div>
      
      {/* This is the anchor point for scrolling */}
      <div ref={paymentFormRef} className="h-0"></div>
    </div>
  );
};

export default ContractDetails;