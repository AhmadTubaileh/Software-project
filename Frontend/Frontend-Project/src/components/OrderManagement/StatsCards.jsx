import React from 'react';

const StatsCards = ({ orders }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const approvedCount = orders.filter(o => o.status === 'approved').length;
  const rejectedCount = orders.filter(o => o.status === 'rejected').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  
  // Calculate total value
  const totalValue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  
  // Calculate pending orders value
  const pendingValue = orders
    .filter(o => o.status === 'pending')
    .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Orders</p>
            <p className="text-xl font-bold text-white mt-1">
              {orders.length}
            </p>
          </div>
          <div className="text-2xl text-purple-400">📦</div>
        </div>
      </div>
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="text-2xl text-yellow-400">⏳</div>
        </div>
      </div>
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Approved</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {approvedCount}
            </p>
          </div>
          <div className="text-2xl text-green-400">✅</div>
        </div>
      </div>
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Rejected</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {rejectedCount}
            </p>
          </div>
          <div className="text-2xl text-red-400">❌</div>
        </div>
      </div>
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Value</p>
            <p className="text-xl font-bold text-white mt-1">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Pending: {formatCurrency(pendingValue)}
            </p>
          </div>
          <div className="text-2xl text-blue-400">💰</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
