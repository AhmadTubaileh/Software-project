import React from 'react';

const SummaryCards = ({ totals }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20 text-center">
        <div className="text-3xl font-bold text-blue-300 mb-2">{totals.work}h</div>
        <div className="text-blue-400/80 font-medium">Work Hours</div>
      </div>
      <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/20 text-center">
        <div className="text-3xl font-bold text-purple-300 mb-2">{totals.break}h</div>
        <div className="text-purple-400/80 font-medium">Break Hours</div>
      </div>
      <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50 text-center">
        <div className="text-3xl font-bold text-white mb-2">{totals.total}h</div>
        <div className="text-gray-400 font-medium">Total Hours</div>
      </div>
    </div>
  );
};

export default SummaryCards;