import React from 'react';

const OverdueStatsCards = ({ stats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const statCards = [
    {
      title: 'Total Overdue',
      value: stats.total_overdue || 0,
      color: 'text-purple-400',
      icon: '⏰',
      bgColor: 'from-purple-500/20 to-purple-600/20'
    },
    {
      title: 'Pending Calls',
      value: stats.pending_count || 0,
      color: 'text-yellow-400',
      icon: '📞',
      bgColor: 'from-yellow-500/20 to-orange-500/20'
    },
    {
      title: 'Waiting',
      value: stats.waiting_count || 0,
      color: 'text-blue-400',
      icon: '⏳',
      bgColor: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      title: 'Not Responding',
      value: stats.not_responding_count || 0,
      color: 'text-red-400',
      icon: '🚫',
      bgColor: 'from-red-500/20 to-pink-500/20'
    },
    {
      title: 'Resolved',
      value: stats.resolved_count || 0,
      color: 'text-green-400',
      icon: '✅',
      bgColor: 'from-green-500/20 to-emerald-500/20'
    },
    {
      title: 'Total Amount',
      value: formatCurrency(stats.total_overdue_amount || 0),
      color: 'text-white',
      icon: '💰',
      bgColor: 'from-gray-500/20 to-gray-600/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div 
          key={index}
          className={`bg-gradient-to-r ${stat.bgColor} p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">{stat.title}</p>
              <p className={`text-xl font-bold mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
            <div className="text-2xl">
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverdueStatsCards;