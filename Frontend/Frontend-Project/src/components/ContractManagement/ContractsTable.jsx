import React from 'react';

const ContractsTable = ({ contracts, loading, onViewDetails, onApprove, onReject, showActions = true }) => {
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
      'completed': { color: 'bg-purple-600', text: 'Completed' }
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
                  Financials
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
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(contract.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {showActions && contract.status === 'pending' && (
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
                      <button
                        onClick={() => onViewDetails(contract)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors duration-200"
                      >
                        View Details
                      </button>
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