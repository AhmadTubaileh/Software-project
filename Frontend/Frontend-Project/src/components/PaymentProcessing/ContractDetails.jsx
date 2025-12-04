import React, { useEffect } from 'react';

const ContractDetails = ({ contract, payments, selectedPayment, onSelectPayment }) => {
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
    return new Date(dateString).toLocaleDateString();
  };

  const getPaymentStatusBadge = (payment) => {
    const statusConfig = {
      'paid': { color: 'bg-green-600', text: 'Paid' },
      'partial': { color: 'bg-blue-600', text: `Partial (${formatCurrency(payment.amount_due)} left)` },
      'pending': { color: 'bg-yellow-600', text: `Pending (${formatCurrency(payment.amount_due)} due)` }
    };
    
    const config = statusConfig[payment.status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
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
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⏳</div>
              <div>
                <p className="font-semibold text-blue-400">Currently Processing:</p>
                <p className="text-sm">
                  Month {selectedPayment.month_number} 
                  {selectedPayment.month_number === 0 
                    ? ' (Down Payment)' 
                    : ` • Due: ${formatDate(selectedPayment.due_date)}`
                  }
                </p>
                <p className="text-xs text-gray-400">
                  Remaining: {formatCurrency(selectedPayment.amount_due)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Next in line:</p>
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
          {payments.map((payment) => (
            <div
              key={payment.id}
              className={`bg-gray-700/50 rounded-lg p-4 border transition-colors duration-200 ${
                selectedPayment?.id === payment.id 
                  ? 'border-blue-500 bg-blue-500/20' 
                  : payment.status === 'paid'
                  ? 'opacity-60 border-gray-600/30'
                  : 'border-gray-600/50'
              } ${payment.status === 'paid' ? 'cursor-default' : ''}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {payment.status === 'paid' ? '✅' : 
                     payment.status === 'partial' ? '🟡' : 
                     selectedPayment?.id === payment.id ? '⏳' : '🔒'}
                  </div>
                  <div>
                    <p className="font-semibold">
                      Month {payment.month_number} 
                      {payment.month_number === 0 
                        ? ' (Down Payment)' 
                        : ` • Due: ${formatDate(payment.due_date)}`
                      }
                      {payment.month_number === 0 && <span className="ml-2 text-yellow-400">(Due immediately)</span>}
                    </p>
                    <div className="text-sm text-gray-400 grid grid-cols-2 gap-4 mt-1">
                      <div>
                        <span className="text-gray-500">Paid:</span> 
                        <span className="font-semibold text-green-400 ml-1">
                          {formatCurrency(payment.amount_paid)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Remaining Due:</span> 
                        <span className={`font-semibold ml-1 ${
                          payment.amount_due > 0.01 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {formatCurrency(payment.amount_due)}
                        </span>
                      </div>
                    </div>
                    {selectedPayment?.id === payment.id && payment.status !== 'paid' && (
                      <div className="mt-2 text-xs text-blue-400">
                        ⚡ Currently selected for processing
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {getPaymentStatusBadge(payment)}
                  {payment.status === 'paid' && (
                    <div className="text-xs text-gray-500 text-center mt-1">
                      Locked
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Payment Sequence Rules */}
      <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
        <h5 className="font-semibold mb-2 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Payment Processing Rules
        </h5>
        <ul className="text-sm text-gray-400 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>Payments must be processed in sequence (Month 0, then 1, then 2, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">•</span>
            <span><strong>Down Payment (Month 0)</strong> must be paid in full before installments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Once a payment is marked as PAID, it cannot be selected again</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span>System automatically advances to next payment after processing</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ContractDetails;