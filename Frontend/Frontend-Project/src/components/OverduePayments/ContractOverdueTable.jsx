import React from 'react';

const ContractOverdueTable = ({ 
  contracts, 
  selectedContract, 
  contractOverduePayments, 
  onSelectContract,
  formatCurrency 
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusCounts = (payments) => {
    const counts = {
      pending: 0,
      waiting: 0,
      not_responding: 0,
      resolved: 0
    };
    
    payments.forEach(payment => {
      if (counts[payment.status] !== undefined) {
        counts[payment.status]++;
      }
    });
    
    return counts;
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">Contracts with Overdue Payments</h2>
        <p className="text-gray-400 text-sm mt-1">
          {contracts.length} contract{contracts.length !== 1 ? 's' : ''} with overdue payments
        </p>
      </div>

      {/* Contracts List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Contract Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Overdue Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {contracts.map((contract) => {
              const isSelected = selectedContract === contract.id;
              return (
                <React.Fragment key={contract.id}>
                  <tr className={`hover:bg-gray-700/30 transition-colors duration-200 ${isSelected ? 'bg-blue-900/20' : ''}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">
                          Contract #{contract.id}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {contract.item_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {formatDate(contract.created_at)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{contract.customer_name}</p>
                        <p className="text-sm text-gray-400">{contract.customer_phone}</p>
                        <p className="text-xs text-gray-500">
                          Processed by: {contract.worker_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white">
                          Total Value: {formatCurrency(contract.total_price)}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-1 bg-red-600 rounded text-xs">
                            ⚠️ {contract.overdue_count || 0} overdue
                          </span>
                          <span className="px-2 py-1 bg-yellow-600 rounded text-xs">
                            📞 {contract.active_overdue_count || 0} active
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onSelectContract(contract.id)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                          isSelected 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {isSelected ? 'Hide Details' : 'View Overdue Payments'}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row for Contract Overdue Payments */}
                  {isSelected && contractOverduePayments.length > 0 && (
                    <tr className="bg-gray-900/50">
                      <td colSpan="4" className="px-6 py-4">
                        <div className="ml-4 pl-4 border-l-2 border-blue-500">
                          <h4 className="font-semibold text-white mb-3">
                            Overdue Payments for Contract #{contract.id}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-800/50">
                                <tr>
                                  <th className="px-4 py-2 text-left">Month</th>
                                  <th className="px-4 py-2 text-left">Amount</th>
                                  <th className="px-4 py-2 text-left">Status</th>
                                  <th className="px-4 py-2 text-left">Due Date</th>
                                  <th className="px-4 py-2 text-left">Follow-ups</th>
                                  <th className="px-4 py-2 text-left">Last Response</th>
                                </tr>
                              </thead>
                              <tbody>
                                {contractOverduePayments.map((payment) => (
                                  <tr key={payment.payment_id} className="border-t border-gray-700/50">
                                    <td className="px-4 py-2">Month {payment.month_number}</td>
                                    <td className="px-4 py-2">
                                      <div>
                                        <p>Due: {formatCurrency(payment.amount_due)}</p>
                                        <p className="text-xs text-gray-400">
                                          Paid: {formatCurrency(payment.amount_paid)}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2">
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        payment.status === 'pending' ? 'bg-yellow-600' :
                                        payment.status === 'waiting' ? 'bg-blue-600' :
                                        payment.status === 'not_responding' ? 'bg-red-600' :
                                        'bg-green-600'
                                      }`}>
                                        {payment.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2">{formatDate(payment.due_date)}</td>
                                    <td className="px-4 py-2">{payment.followup_count || 0}</td>
                                    <td className="px-4 py-2">
                                      {payment.last_response ? (
                                        <div className="max-w-xs truncate" title={payment.last_response}>
                                          {payment.last_response.substring(0, 30)}...
                                        </div>
                                      ) : 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Status Summary */}
                          {contractOverduePayments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                              <div className="flex gap-4">
                                {Object.entries(getStatusCounts(contractOverduePayments)).map(([status, count]) => (
                                  count > 0 && (
                                    <div key={status} className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${
                                        status === 'pending' ? 'bg-yellow-500' :
                                        status === 'waiting' ? 'bg-blue-500' :
                                        status === 'not_responding' ? 'bg-red-500' :
                                        'bg-green-500'
                                      }`}></div>
                                      <span className="text-sm text-gray-300 capitalize">{status}:</span>
                                      <span className="font-semibold">{count}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {contracts.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-6xl mb-4 text-gray-600">✅</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Contracts with Overdue Payments</h3>
          <p className="text-gray-500">Great! All contracts are up to date.</p>
        </div>
      )}
    </div>
  );
};

export default ContractOverdueTable;