import React, { useState } from 'react';

const TimelineBar = ({ sessions, date }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  // Define the day range - Full 24 hours (00:00 to 23:59)
  const dayStartHour = 0; // 12:00 AM (midnight)
  const dayEndHour = 24; // 12:00 AM (next day)
  const dayDuration = 24; // 24 hours
  const totalMinutesInDay = 24 * 60; // 1440 minutes

  // Convert time string (HH:MM:SS) to minutes from midnight
  const timeToMinutes = (timeString) => {
    if (!timeString || timeString === 'NULL') return null;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
  };

  // Convert minutes to percentage position on timeline
  const minutesToPosition = (minutes) => {
    if (minutes === null || minutes === undefined) return 0;
    // Clamp to 0-1440 minutes (full day)
    const clampedMinutes = Math.max(0, Math.min(totalMinutesInDay, minutes));
    return (clampedMinutes / totalMinutesInDay) * 100;
  };

  // Calculate width percentage for a session
  const calculateWidth = (startMinutes, endMinutes) => {
    if (!startMinutes || !endMinutes) return 0;
    
    // Clamp to 0-1440 minutes (full day)
    const clampedStart = Math.max(0, Math.min(totalMinutesInDay, startMinutes));
    const clampedEnd = Math.max(0, Math.min(totalMinutesInDay, endMinutes));
    
    // Calculate width based on minutes
    const durationMinutes = clampedEnd - clampedStart;
    const width = (durationMinutes / totalMinutesInDay) * 100;
    
    // Ensure minimum width for visibility
    return Math.max(width, 0.5);
  };

  // Sort sessions by start time
  const sortedSessions = [...sessions].sort((a, b) => {
    const aStart = timeToMinutes(a.in_time);
    const bStart = timeToMinutes(b.in_time);
    if (!aStart) return 1;
    if (!bStart) return -1;
    return aStart - bStart;
  });

  // Generate time markers for the timeline (every 2 hours for 24-hour timeline)
  const timeMarkers = [];
  for (let hour = 0; hour <= 24; hour += 2) {
    let label;
    if (hour === 0) {
      label = '12 AM';
    } else if (hour === 12) {
      label = '12 PM';
    } else if (hour === 24) {
      label = '12 AM';
    } else if (hour < 12) {
      label = `${hour} AM`;
    } else {
      label = `${hour - 12} PM`;
    }
    
    timeMarkers.push({
      hour,
      label,
      position: (hour / dayDuration) * 100
    });
  }

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString || timeString === 'NULL') return 'N/A';
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="w-full min-w-[600px]">
      {/* Timeline Container */}
      <div className="relative bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
        {/* Time Markers */}
        <div className="relative h-6 mb-2">
          {timeMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 transform -translate-x-1/2"
              style={{ left: `${marker.position}%` }}
            >
              <div className="w-px h-2 bg-gray-600"></div>
              <div className="text-xs text-gray-400 mt-1 whitespace-nowrap font-mono">
                {marker.label}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Bar */}
        <div className="relative h-14 bg-gray-800/30 rounded border border-gray-700/30 overflow-hidden">
          {sortedSessions.map((session, index) => {
            const startMinutes = timeToMinutes(session.in_time);
            const endMinutes = timeToMinutes(session.out_time);
            
            if (!startMinutes || !endMinutes) return null;

            const left = minutesToPosition(startMinutes);
            const width = calculateWidth(startMinutes, endMinutes);
            const isWork = session.session_type === 'work';
            const isUpdated = session.auto_generated === 0;

            // Color scheme - Edited sessions have distinct colors (orange/amber tones)
            const bgColor = isWork 
              ? (isUpdated ? 'bg-orange-500' : 'bg-blue-600')
              : (isUpdated ? 'bg-amber-500' : 'bg-purple-600');
            
            const borderColor = isWork 
              ? (isUpdated ? 'border-orange-400' : 'border-blue-500')
              : (isUpdated ? 'border-amber-400' : 'border-purple-500');

            // Calculate duration for display
            const durationMinutes = endMinutes - startMinutes;
            const durationHours = (durationMinutes / 60).toFixed(2);

            return (
              <div
                key={session.id || index}
                onClick={() => setSelectedSession(session)}
                className={`absolute h-full ${bgColor} ${borderColor} border-2 rounded transition-all hover:opacity-90 hover:scale-y-110 cursor-pointer group active:scale-95`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  minWidth: width < 0.5 ? '2px' : 'auto'
                }}
                title={`Click to view details - ${isWork ? 'Work' : 'Break'}: ${formatTime(session.in_time)} - ${formatTime(session.out_time)} (${durationHours}h)${isUpdated ? ' (Updated)' : ''}`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-gray-600 shadow-lg">
                    <div className="font-semibold">{isWork ? '💼 Work' : '☕ Break'}</div>
                    <div>{formatTime(session.in_time)} - {formatTime(session.out_time)}</div>
                    <div className="text-gray-300">Duration: {durationHours}h</div>
                    {isUpdated && <div className="text-orange-400 text-xs mt-1">✏️ Manually Updated</div>}
                    <div className="text-blue-400 text-xs mt-1">Click for details</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {sortedSessions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              No sessions
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-600 rounded border border-blue-400"></div>
            <span className="text-gray-300">Work (Auto)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-purple-600 rounded border border-purple-400"></div>
            <span className="text-gray-300">Break (Auto)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-orange-500 rounded border border-orange-400"></div>
            <span className="text-gray-300">Work (Edited)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-amber-500 rounded border border-amber-400"></div>
            <span className="text-gray-300">Break (Edited)</span>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSession(null)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Session Details</h2>
              <button 
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Session Type */}
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${
                  selectedSession.session_type === 'work' 
                    ? (selectedSession.auto_generated === 0 ? 'bg-orange-500' : 'bg-blue-600')
                    : (selectedSession.auto_generated === 0 ? 'bg-amber-500' : 'bg-purple-600')
                }`}></div>
                <div>
                  <div className="text-sm text-gray-400">Session Type</div>
                  <div className="text-lg font-semibold text-white capitalize">
                    {selectedSession.session_type === 'work' ? '💼 Work' : '☕ Break'}
                    {selectedSession.auto_generated === 0 && (
                      <span className="ml-2 text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded">Manually Updated</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">In Time</div>
                  <div className="text-lg font-mono font-semibold text-white">
                    {formatTime(selectedSession.in_time)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedSession.in_time}
                  </div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Out Time</div>
                  <div className="text-lg font-mono font-semibold text-white">
                    {formatTime(selectedSession.out_time)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedSession.out_time}
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                <div className="text-sm text-gray-400 mb-1">Duration</div>
                <div className="text-2xl font-bold text-blue-400">
                  {(() => {
                    const startMinutes = timeToMinutes(selectedSession.in_time);
                    const endMinutes = timeToMinutes(selectedSession.out_time);
                    if (!startMinutes || !endMinutes) return 'N/A';
                    const durationMinutes = endMinutes - startMinutes;
                    const hours = Math.floor(durationMinutes / 60);
                    const minutes = Math.floor(durationMinutes % 60);
                    return `${hours}h ${minutes}m`;
                  })()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const startMinutes = timeToMinutes(selectedSession.in_time);
                    const endMinutes = timeToMinutes(selectedSession.out_time);
                    if (!startMinutes || !endMinutes) return '';
                    const durationMinutes = endMinutes - startMinutes;
                    return `${(durationMinutes / 60).toFixed(2)} hours total`;
                  })()}
                </div>
              </div>

              {/* Additional Info */}
              {selectedSession.updater_username && (
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Updated By</div>
                  <div className="text-white font-medium">{selectedSession.updater_username}</div>
                  {selectedSession.updated_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(selectedSession.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedSession.notes && (
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Notes</div>
                  <div className="text-white">{selectedSession.notes}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedSession(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineBar;
