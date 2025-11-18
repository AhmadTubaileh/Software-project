import React from 'react';

const statusStyles = {
  work: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300' },
  break: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300' }
};

const SessionsTable = ({ sessions, isLoading, onEditSession, onDeleteSession }) => {
  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-700/80 to-gray-800/80">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Session Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">In Time</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Out Time</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Duration</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Notes</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-700/30 transition-all duration-200 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {session.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-white">{session.username}</div>
                      <div className="text-xs text-gray-400">Level {session.user_type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{session.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${statusStyles[session.session_type].bg} ${statusStyles[session.session_type].text} border ${statusStyles[session.session_type].border}`}>
                    {session.session_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{new Date(session.in_time).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{session.out_time ? new Date(session.out_time).toLocaleString() : 'Active'}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{session.duration ? `${session.duration}h` : '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">{session.notes || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => onEditSession(session)} 
                      className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-blue-500/10 rounded-lg transform hover:scale-110 duration-200"
                      title="Edit Session"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => onDeleteSession(session.id)} 
                      className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg transform hover:scale-110 duration-200"
                      title="Delete Session"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessions.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
          <p className="text-gray-500">No duty hours recorded for the selected filters</p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading sessions...</p>
        </div>
      )}
    </div>
  );
};

export default SessionsTable;