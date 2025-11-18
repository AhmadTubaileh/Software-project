import React from 'react';

const SessionCard = ({ session, statusStyles }) => {
  const styles = statusStyles[session.session_type];

  return (
    <div className={`p-4 rounded-xl border ${styles.bg} ${styles.border}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
            <span className={`font-medium capitalize ${styles.text}`}>
              {session.session_type}
            </span>
            {!session.out_time && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
                Active
              </span>
            )}
          </div>
          <div className="text-sm text-gray-300 space-y-1">
            <div>
              <strong>In:</strong> {new Date(session.in_time).toLocaleString()}
            </div>
            {session.out_time && (
              <div>
                <strong>Out:</strong> {new Date(session.out_time).toLocaleString()}
              </div>
            )}
            {session.duration && (
              <div>
                <strong>Duration:</strong> {session.duration} hours
              </div>
            )}
          </div>
          {session.notes && (
            <div className="mt-2 text-sm text-gray-300">
              <strong>Notes:</strong> {session.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionCard;