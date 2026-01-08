import React from 'react';

const OverduePaymentsTable = ({ 
  payments, 
  loading, 
  statusFilter, 
  onAddFollowup, 
  onViewHistory, 
  onUpdateStatus,
  formatCurrency 
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-600', text: 'Pending Call', icon: '📞' },
      'waiting': { color: 'bg-blue-600', text: 'Waiting', icon: '⏳' },
      'not_responding': { color: 'bg-red-600', text: 'Not Responding', icon: '🚫' },
      'resolved': { color: 'bg-green-600', text: 'Resolved', icon: '✅' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${config.color}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">Overdue Payments</h2>
        <p className="text-gray-400 text-sm mt-1">
          {payments.length} payment{payments.length !== 1 ? 's' : ''} found
          {statusFilter !== 'all' && ` (${statusFilter} only)`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading overdue payments...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && payments.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4 text-gray-600">✅</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Overdue Payments Found</h3>
          <p className="text-gray-500">Great! All payments are up to date.</p>
        </div>
      )}

      {/* Payments List */}
      {!loading && payments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status & Follow-ups
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {payments.map((payment) => (
                <tr key={payment.payment_id} className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-white">
                        Contract #{payment.contract_id} • Month {payment.month_number}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {payment.item_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Payment ID: {payment.payment_id}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{payment.customer_name}</p>
                      <p className="text-sm text-gray-400">{payment.customer_phone}</p>
                      <p className="text-xs text-gray-500">
                        Last worker: {payment.worker_name || 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white">
                        Due: {formatCurrency(payment.amount_due)}
                      </p>
                      <p className="text-sm text-gray-400">
                        Paid: {formatCurrency(payment.amount_paid)}
                      </p>
                      <p className="text-sm text-green-400">
                        Remaining: {formatCurrency(payment.amount_due - payment.amount_paid)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-400">
                        Bill: {formatDate(payment.bill_date)}
                      </p>
                      <p className="text-gray-400">
                        Due: {formatDate(payment.due_date)}
                      </p>
                      <p className="text-gray-400">
                        Last Follow-up: {formatDate(payment.last_followup_date)}
                      </p>
                      {payment.next_followup_date && (
                        <p className={`text-xs mt-1 ${new Date(payment.next_followup_date) <= new Date() ? 'text-red-400' : 'text-blue-400'}`}>
                          Next: {formatDate(payment.next_followup_date)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(payment.status)}
                    <div className="mt-2 text-xs">
                      <p className="text-gray-400">
                        Follow-ups: {payment.followup_count || 0}
                      </p>
                      {payment.last_response && (
                        <p className="text-gray-500 mt-1 truncate max-w-xs" title={payment.last_response}>
                          Last: {payment.last_response.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      {/* Add Follow-up Button - Only for pending status */}
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => onAddFollowup(payment)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors duration-200"
                        >
                          📞 Add Follow-up
                        </button>
                      )}
                      
                      {/* View History Button - Always visible */}
                      <button
                        onClick={() => onViewHistory(payment)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors duration-200"
                      >
                        📋 View History
                      </button>
                      
                      {/* Quick Status Update Buttons */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {/*{payment.status !== 'pending' && (
                          <button
                            onClick={() => onUpdateStatus(payment.payment_id, 'pending')}
                            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
                            title="Mark as Pending"
                          >
                            📞
                          </button>
                        )}*/}
                        {/*{payment.status !== 'waiting' && (
                          <button
                            onClick={() => onUpdateStatus(payment.payment_id, 'waiting')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                            title="Mark as Waiting"
                          >
                            ⏳
                          </button>
                        )}*/}
                        {/*{payment.status !== 'not_responding' && (
                          <button
                            onClick={() => onUpdateStatus(payment.payment_id, 'not_responding')}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                            title="Mark as Not Responding"
                          >
                            🚫
                          </button>
                        )}*/}
                        {/*{payment.status !== 'resolved' && (
                          <button
                            onClick={() => onUpdateStatus(payment.payment_id, 'resolved')}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                            title="Mark as Resolved"
                          >
                            ✅
                          </button>
                        )}*/}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OverduePaymentsTable;