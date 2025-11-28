import React from 'react';

const SummaryCards = ({ totals }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10">
        <div className="text-3xl font-bold text-blue-300 mb-2">{totals.work}h</div>
        <div className="text-blue-400/80 font-medium">Total Work Hours</div>
        <div className="text-xs text-blue-500/60 mt-2">Active work time</div>
      </div>
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl p-6 border border-purple-500/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10">
        <div className="text-3xl font-bold text-purple-300 mb-2">{totals.break}h</div>
        <div className="text-purple-400/80 font-medium">Total Break Hours</div>
        <div className="text-xs text-purple-500/60 mt-2">Break time</div>
      </div>
      <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl p-6 border border-gray-600/50 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <div className="text-3xl font-bold text-white mb-2">{totals.total}h</div>
        <div className="text-gray-400 font-medium">Total Hours</div>
        <div className="text-xs text-gray-500 mt-2">Combined time</div>
      </div>
    </div>
  );
};

export default SummaryCards;