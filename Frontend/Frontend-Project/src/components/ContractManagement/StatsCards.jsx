import React from 'react';

const StatsCards = ({ contracts }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalValue = contracts.reduce((sum, contract) => sum + parseFloat(contract.total_price), 0);
  const pendingReviewCount = contracts.filter(c => c.approval_status === 'pending_review').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Pending</p>
            <p className="text-2xl font-bold text-white mt-1">
              {contracts.length}
            </p>
          </div>
          <div className="text-3xl text-yellow-400">📋</div>
        </div>
      </div>
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Ready for Review</p>
            <p className="text-2xl font-bold text-white mt-1">
              {pendingReviewCount}
            </p>
          </div>
          <div className="text-3xl text-blue-400">👁️</div>
        </div>
      </div>
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Value</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div className="text-3xl text-green-400">💰</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;