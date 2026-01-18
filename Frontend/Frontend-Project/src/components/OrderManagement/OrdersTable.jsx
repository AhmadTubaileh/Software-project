import React from 'react';

const OrdersTable = ({ orders, loading, onViewDetails, onApprove, onReject, showActions = true, canApproveReject = false }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-600', text: 'Pending Review' },
      'approved': { color: 'bg-green-600', text: 'Approved' },
      'rejected': { color: 'bg-red-600', text: 'Rejected' },
      'shipped': { color: 'bg-blue-600', text: 'Shipped' }
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
        <h2 className="text-xl font-semibold text-white">Orders</h2>
        <p className="text-gray-400 text-sm mt-1">
          {orders.length} order{orders.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading orders...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-400 text-lg">No orders found</p>
          <p className="text-gray-500 text-sm mt-2">Orders will appear here once they are placed</p>
        </div>
      )}

      {/* Orders Table */}
      {!loading && orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white font-medium">#{order.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{order.customer_name || 'N/A'}</p>
                      {order.customer_email && (
                        <p className="text-gray-400 text-xs">{order.customer_email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white font-semibold">{formatCurrency(order.total_amount)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-300 text-sm">{formatDate(order.created_at)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetails(order)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors duration-200"
                      >
                        View
                      </button>

                      {/* Approve/Reject Buttons - Only for pending orders */}
                      {showActions && order.status === 'pending' && canApproveReject && (
                        <>
                          <button
                            onClick={() => onApprove(order)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors duration-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(order)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors duration-200"
                          >
                            Reject
                          </button>
                        </>
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

export default OrdersTable;
