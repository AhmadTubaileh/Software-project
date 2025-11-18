import React from 'react';

const statusStyles = {
  work: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' }
};

const CurrentStatusCard = ({
  currentSession,
  clockOutNotes,
  setClockOutNotes,
  onClockIn,
  onClockOut,
  isLoading,
  calculateCurrentDuration
}) => {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Current Status</h2>
          <p className="text-gray-400">
            {currentSession ? 'Active work session' : 'No active session'}
          </p>
        </div>
        {currentSession && (
          <div className={`px-4 py-2 rounded-full border ${statusStyles.work.bg} ${statusStyles.work.border} ${statusStyles.work.text}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusStyles.work.dot} animate-pulse`} />
              <span className="font-medium">Working</span>
            </div>
          </div>
        )}
      </div>

      {currentSession ? (
        <div className="text-center">
          <div className="text-5xl font-mono font-bold text-white mb-4">
            {calculateCurrentDuration()}
          </div>
          <p className="text-gray-400 mb-6">
            Started at {new Date(currentSession.in_time).toLocaleTimeString()}
          </p>
          
          <div className="space-y-4 max-w-md mx-auto">
            <textarea
              value={clockOutNotes}
              onChange={(e) => setClockOutNotes(e.target.value)}
              placeholder="Add notes for this work session (optional)"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
              rows="3"
            />
            <button
              onClick={onClockOut}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            >
              {isLoading ? 'Ending Work...' : 'End Work Session'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">⏰</div>
            <p className="text-gray-400">Ready to start your work day?</p>
          </div>
          <button
            onClick={onClockIn}
            disabled={isLoading}
            className="w-full max-w-md mx-auto bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? 'Starting Work...' : 'Start Work Session'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CurrentStatusCard;