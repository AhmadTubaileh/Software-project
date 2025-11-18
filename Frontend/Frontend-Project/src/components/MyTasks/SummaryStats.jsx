import React from 'react';

const SummaryStats = ({ counts }) => {
  return (
    <div className="mt-8 p-6 bg-gray-800/30 rounded-2xl border border-gray-700/50">
      <h4 className="font-semibold text-white mb-4">Task Summary</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
          <div className="text-2xl font-bold text-white">{counts.all}</div>
          <div className="text-gray-400 text-sm">Total Tasks</div>
        </div>
        <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
          <div className="text-2xl font-bold text-yellow-300">{counts.pending}</div>
          <div className="text-yellow-400/80 text-sm">Pending</div>
        </div>
        <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-300">{counts.in_progress}</div>
          <div className="text-blue-400/80 text-sm">In Progress</div>
        </div>
        <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
          <div className="text-2xl font-bold text-green-300">{counts.completed}</div>
          <div className="text-green-400/80 text-sm">Completed</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;