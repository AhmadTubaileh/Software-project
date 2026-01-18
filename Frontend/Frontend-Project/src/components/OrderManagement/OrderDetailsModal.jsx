import React from 'react';

const OrderDetailsModal = ({ orderDetails, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
      <span className={`px-3 py-1 rounded text-sm font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (!orderDetails) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Order Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Order Information */}
        <div className="space-y-6">
          {/* Order Header */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Order ID</p>
                <p className="text-white font-semibold text-lg">#{orderDetails.id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <div className="mt-1">{getStatusBadge(orderDetails.status)}</div>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Amount</p>
                <p className="text-white font-semibold text-lg">{formatCurrency(orderDetails.total_amount)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Created At</p>
                <p className="text-white">{formatDate(orderDetails.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-3">Customer Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-white">{orderDetails.customer_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white">{orderDetails.customer_email || 'N/A'}</p>
              </div>
              {orderDetails.customer_phone && (
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="text-white">{orderDetails.customer_phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-3">Billing Address</h4>
            <p className="text-white">{orderDetails.billing_address}</p>
          </div>

          {/* Worker Information (if approved/rejected) */}
          {orderDetails.worker_name && (
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-3">
                {orderDetails.status === 'approved' ? 'Approved By' : orderDetails.status === 'rejected' ? 'Rejected By' : 'Processed By'}
              </h4>
              <p className="text-white">{orderDetails.worker_name}</p>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {orderDetails.status === 'rejected' && orderDetails.reason_for_decline && (
            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-red-400 mb-2">Rejection Reason</h4>
              <p className="text-red-300">{orderDetails.reason_for_decline}</p>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-3">Order Items</h4>
            <div className="space-y-3">
              {orderDetails.items && orderDetails.items.length > 0 ? (
                orderDetails.items.map((item) => (
                  <div key={item.id} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.item_name || `Item #${item.item_id}`}</p>
                      {item.item_description && (
                        <p className="text-gray-400 text-sm mt-1">{item.item_description}</p>
                      )}
                      <p className="text-gray-400 text-sm mt-1">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(item.price)}</p>
                      <p className="text-gray-400 text-sm">Subtotal: {formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No items found</p>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
