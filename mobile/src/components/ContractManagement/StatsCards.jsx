import React from 'react';
import '../../styles/theme.css';

const StatsCards = ({ contracts }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalActive = contracts.filter(c => c.status !== 'deleted').length;
  const pendingCount = contracts.filter(c => c.status === 'pending').length;
  const activeCount = contracts.filter(c => c.status === 'active').length;
  const rejectedCount = contracts.filter(c => c.status === 'rejected').length;
  const completedCount = contracts.filter(c => c.status === 'completed').length;
  
  const activeValue = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, contract) => sum + parseFloat(contract.total_price || 0), 0);

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Total Active */}
        <div 
          className="contract-card"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
            borderColor: 'rgba(59, 130, 246, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total Active</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>{totalActive}</p>
            </div>
            <span style={{ fontSize: '32px', opacity: 0.5 }}>📋</span>
          </div>
        </div>

        {/* Pending */}
        <div 
          className="contract-card"
          style={{
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
            borderColor: 'rgba(234, 179, 8, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Pending</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>{pendingCount}</p>
            </div>
            <span style={{ fontSize: '32px', opacity: 0.5 }}>⏳</span>
          </div>
        </div>

        {/* Active */}
        <div 
          className="contract-card"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)',
            borderColor: 'rgba(34, 197, 94, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Active</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>{activeCount}</p>
            </div>
            <span style={{ fontSize: '32px', opacity: 0.5 }}>✅</span>
          </div>
        </div>

        {/* Completed */}
        <div 
          className="contract-card"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
            borderColor: 'rgba(139, 92, 246, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Completed</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#a78bfa' }}>{completedCount}</p>
            </div>
            <span style={{ fontSize: '32px', opacity: 0.5 }}>✓</span>
          </div>
        </div>
      </div>

      {/* Active Contracts Value - Full Width */}
      <div 
        className="contract-card"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.2)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Active Contracts Value</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#34d399' }}>
              {formatCurrency(activeValue)}
            </p>
          </div>
          <span style={{ fontSize: '32px', opacity: 0.5 }}>💰</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
