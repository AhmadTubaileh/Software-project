import React from 'react';
import SessionCard from './SessionCard.jsx';

const statusStyles = {
  work: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
  break: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' }
};

const SessionGroup = ({ date, sessions }) => {
  const dateTotal = sessions.reduce((total, session) => 
    total + (session.duration ? parseFloat(session.duration) : 0), 0
  );

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">
          {new Date(date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        <div className="text-lg font-bold text-gray-300">Total: {dateTotal.toFixed(2)}h</div>
      </div>
      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            statusStyles={statusStyles}
          />
        ))}
      </div>
    </div>
  );
};

export default SessionGroup;