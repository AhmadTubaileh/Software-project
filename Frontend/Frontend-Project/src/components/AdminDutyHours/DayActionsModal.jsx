import React from 'react';

const DayActionsModal = ({ dayData, onEditSession, onAddSession, onDeleteSession, onClose }) => {
  const formatTime = (timeString) => {
    if (!timeString || timeString === 'NULL') return 'NULL';
    
    try {
      const [hours, minutes, seconds] = timeString.split(':');
      let hourNum = parseInt(hours);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      
      hourNum = hourNum % 12;
      hourNum = hourNum ? hourNum : 12;
      
      return `${hourNum}:${minutes}:${seconds} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return timeString;
    }
  };

  const getSessionForEditing = (pairIndex) => {
    console.log('Getting session for editing, pairIndex:', pairIndex);
    
    const pair = dayData.pairs[pairIndex];
    if (!pair || !pair.sessionId) {
      console.log('No pair or sessionId found');
      return null;
    }

    const originalSession = dayData.sessions?.find(session => session.id === pair.sessionId);
    if (!originalSession) {
      console.log('No original session found for sessionId:', pair.sessionId);
      return null;
    }

    console.log('Found session for editing:', originalSession);

    // Convert table display date (DD/MM/YYYY) to YYYY-MM-DD format
    const tableDateParts = dayData.date.split('/');
    const correctDate = `${tableDateParts[2]}-${tableDateParts[1]}-${tableDateParts[0]}`;

    console.log('Date conversion for editing:', {
      tableDate: dayData.date,
      backendFormat: correctDate
    });

    return {
      id: originalSession.id,
      session_type: originalSession.session_type || 'work',
      in_time: originalSession.in_time || '',
      out_time: originalSession.out_time || '',
      date: correctDate, // Use the converted date in YYYY-MM-DD format
      notes: originalSession.notes || '',
      auto_generated: originalSession.auto_generated || 0,
      username: originalSession.username || dayData.userName
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Sessions - {dayData.userName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Date: {dayData.date} ({dayData.dayName})</h3>
          
          <div className="space-y-3 mb-4">
            <h4 className="font-medium text-gray-300">Existing Sessions:</h4>
            {dayData.pairs.map((pair, index) => {
              const sessionData = getSessionForEditing(index);
              const isUpdated = sessionData ? sessionData.auto_generated === 0 : false;
              
              console.log(`Session ${index}:`, sessionData, 'isUpdated:', isUpdated);
              
              return (
                <div key={index} className={`rounded-lg p-3 border ${
                  isUpdated ? 'border-orange-500/50 bg-orange-500/10' : 'border-gray-600/50 bg-gray-700/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Duration {index + 1}:</span>
                        {isUpdated && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                            Manual
                          </span>
                        )}
                      </div>
                      <span className="ml-2 text-gray-300">
                        {formatTime(pair.inTime)} - {formatTime(pair.outTime)}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        Session ID: {pair.sessionId}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          console.log('Edit button clicked for session:', sessionData);
                          if (sessionData) {
                            console.log('Sending to EditModal - Date (YYYY-MM-DD):', sessionData.date);
                            onEditSession(sessionData);
                          } else {
                            console.error('No session data found for editing');
                          }
                        }}
                        className="text-blue-400 hover:text-blue-300 px-3 py-1 rounded border border-blue-500/50 hover:bg-blue-500/10 transition-colors"
                        disabled={!sessionData}
                      >
                        Edit
                      </button>
                      {pair.sessionId && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this session?')) {
                              onDeleteSession(pair.sessionId);
                              onClose();
                            }
                          }}
                          className="text-red-400 hover:text-red-300 px-3 py-1 rounded border border-red-500/50 hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                console.log('Add session clicked for row:', dayData);
                onAddSession(dayData);
              }}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              + Add New Session
            </button>
          </div>
        </div>

       

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayActionsModal;