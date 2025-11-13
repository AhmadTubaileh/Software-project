import React from 'react';

const ContractDetails = ({ contract, payments, selectedPayment, onSelectPayment }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
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
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-600/50 hover:border-gray-500 cursor-pointer'
              } ${payment.status === 'paid' ? 'opacity-75' : ''}`}
              onClick={() => {
                if (payment.status !== 'paid') {
                  onSelectPayment(payment);
                }
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {payment.status === 'paid' ? '✅' : 
                     payment.status === 'partial' ? '🟡' : '⏳'}
                  </div>
                  <div>
                    <p className="font-semibold">
                      Month {payment.month_number} • Due: {formatDate(payment.due_date)}
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
                          payment.amount_due > 0 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {formatCurrency(payment.amount_due)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  {getPaymentStatusBadge(payment)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractDetails;