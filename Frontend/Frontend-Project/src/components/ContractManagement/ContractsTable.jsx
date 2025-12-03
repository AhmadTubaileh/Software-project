import React from 'react';

const ContractsTable = ({ contracts, loading, onViewDetails, onApprove, onReject, onEditReapply, showActions = true, isAdmin = false }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-600', text: 'Pending Review' },
      'approved': { color: 'bg-green-600', text: 'Approved' },
      'rejected': { color: 'bg-red-600', text: 'Rejected' },
      'active': { color: 'bg-blue-600', text: 'Active' },
      'completed': { color: 'bg-purple-600', text: 'Completed' },
      'deleted': { color: 'bg-gray-600', text: 'Deleted' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-semibold text-white">Contracts</h2>
        <p className="text-gray-400 text-sm mt-1">
          {contracts.length} contract{contracts.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading contracts...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && contracts.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4 text-gray-600">📝</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Contracts Found</h3>
          <p className="text-gray-500">No contracts match the current filter.</p>
        </div>
      )}

      {/* Contracts List */}
      {!loading && contracts.length > 0 && (
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
                  Contract Financials
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-white">{contract.item_name}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Contract #{contract.id}
                      </p>
                      {contract.original_contract_info && (
                        <p className="text-xs text-blue-400 mt-1">
                          ↻ Reapplication of #{contract.original_contract_info.id}
                        </p>
                      )}
                      {contract.replacement_contract_info && (
                        <p className="text-xs text-gray-400 mt-1">
                          ↪ Replaced by #{contract.replacement_contract_info.id}
                        </p>
                      )}
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
                        Total: {formatCurrency(contract.total_price)}
                      </p>
                      <p className="text-sm text-gray-400">
                        Down: {formatCurrency(contract.down_payment)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {contract.months} months × {formatCurrency(contract.monthly_payment)}/mo
                      </p>
                      <p className="text-xs text-gray-400">
                        Last: {formatCurrency(contract.installment_last_payment)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs">
                      <p className="text-gray-400">
                        Default: {formatCurrency(contract.price_installment_total || 0)}
                      </p>
                      <p className="text-gray-400">
                        Cash: {formatCurrency(contract.price_cash || 0)}
                      </p>
                      <p className="text-gray-400">
                        Buy: {formatCurrency(contract.buy_price || 0)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(contract.status)}
                    {contract.status === 'rejected' && contract.rejection_reason && (
                      <div className="text-xs text-red-400 mt-1">
                        ❌ Rejected
                      </div>
                    )}
                    {contract.status === 'deleted' && contract.replacement_contract_info && (
                      <div className="text-xs text-gray-400 mt-1">
                        ↪ Replaced by #{contract.replacement_contract_info.id}
                      </div>
                    )}
                    {contract.paid_payments > 0 && contract.total_payments > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {contract.paid_payments}/{contract.total_payments} paid
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2 flex-wrap gap-1">
                      {/* View Details Button - ALWAYS VISIBLE */}
                      <button
                        onClick={() => onViewDetails(contract)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors duration-200"
                      >
                        View Details
                      </button>

                      {/* Approve/Reject Buttons - ADMIN ONLY on PENDING contracts */}
                      {showActions && contract.status === 'pending' && isAdmin && (
                        <>
                          <button
                            onClick={() => onApprove(contract)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors duration-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(contract)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors duration-200"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Edit & Reapply Button - ALL WORKERS on REJECTED contracts */}
                      {contract.status === 'rejected' && !contract.replacement_contract_info && (
                        <button
                          onClick={() => onEditReapply(contract)}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium transition-colors duration-200"
                        >
                          Edit & Reapply
                        </button>
                      )}
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

export default ContractsTable;