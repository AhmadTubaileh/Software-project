import React from 'react';

const statusStyles = {
  work: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
  break: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' }
};

const Timeline = ({ todaySessions, todayStats }) => {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
      <h3 className="text-xl font-semibold text-white mb-4">Today's Timeline</h3>
      
      {todaySessions.length > 0 ? (
        <div className="space-y-4">
          {/* Work Sessions */}
          {todaySessions.map((session, index) => (
            <div key={session.id}>
              {/* Auto-detected Break (if any) */}
              {index > 0 && todayStats.autoBreaks[index - 1] && (
                <div className="mb-3 p-4 rounded-xl border border-purple-500/30 bg-purple-500/10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-purple-400" />
                      <span className="font-medium text-purple-300">Auto Break</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-mono">
                        {todayStats.autoBreaks[index - 1].start.toLocaleTimeString()} -{' '}
                        {todayStats.autoBreaks[index - 1].end.toLocaleTimeString()}
                      </div>
                      <div className="text-sm text-purple-300">
                        Duration: {todayStats.autoBreaks[index - 1].duration}h
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Work Session */}
              <div className={`p-4 rounded-xl border ${statusStyles[session.session_type].bg} ${statusStyles[session.session_type].border}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusStyles[session.session_type].dot}`} />
                    <span className="font-medium capitalize">{session.session_type}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">
                      {new Date(session.in_time).toLocaleTimeString()} -{' '}
                      {session.out_time ? new Date(session.out_time).toLocaleTimeString() : 'Active'}
                    </div>
                    {session.duration && (
                      <div className="text-sm text-gray-300">
                        Duration: {session.duration}h
                      </div>
                    )}
                  </div>
                </div>
                {session.notes && (
                  <div className="mt-2 text-sm text-gray-300">
                    📝 {session.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📅</div>
          <p>No sessions recorded today</p>
        </div>
      )}
    </div>
  );
};

export default Timeline;