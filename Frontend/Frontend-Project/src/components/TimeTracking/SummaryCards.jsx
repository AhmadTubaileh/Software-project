import React from 'react';

const SummaryCards = ({ todayStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
        <div className="text-2xl font-bold text-blue-300">{todayStats.work}h</div>
        <div className="text-blue-400/80 text-sm">Work Hours</div>
      </div>
      <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
        <div className="text-2xl font-bold text-purple-300">{todayStats.break}h</div>
        <div className="text-purple-400/80 text-sm">Break Hours</div>
      </div>
      <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50 text-center">
        <div className="text-2xl font-bold text-white">{todayStats.total}h</div>
        <div className="text-gray-400 text-sm">Total Hours</div>
      </div>
    </div>
  );
};

export default SummaryCards;