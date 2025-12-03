import React from 'react';

const StatsCards = ({ contracts }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const pendingCount = contracts.filter(c => c.status === 'pending').length;
  const activeCount = contracts.filter(c => c.status === 'active').length;
  const rejectedCount = contracts.filter(c => c.status === 'rejected').length;
  const completedCount = contracts.filter(c => c.status === 'completed').length;
  const deletedCount = contracts.filter(c => c.status === 'deleted').length;
  
  // Calculate total value excluding deleted contracts
  const totalValue = contracts
    .filter(c => c.status !== 'deleted')
    .reduce((sum, contract) => sum + parseFloat(contract.total_price), 0);
  
  // Calculate active contracts value
  const activeValue = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, contract) => sum + parseFloat(contract.total_price), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Active</p>
            <p className="text-xl font-bold text-white mt-1">
              {contracts.length - deletedCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ({contracts.length} total)
            </p>
          </div>
          <div className="text-2xl text-purple-400">📋</div>
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
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {activeCount}
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
            <p className="text-gray-400 text-sm">Deleted</p>
            <p className="text-xl font-bold text-gray-400 mt-1">
              {deletedCount}
            </p>
          </div>
          <div className="text-2xl text-gray-400">🗑️</div>
        </div>
      </div>
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Active Value</p>
            <p className="text-xl font-bold text-white mt-1">
              {formatCurrency(activeValue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total: {formatCurrency(totalValue)}
            </p>
          </div>
          <div className="text-2xl text-blue-400">💰</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;