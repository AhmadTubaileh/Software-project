import React, { useState } from 'react';

const TaskTimelineBar = ({ tasks, date, onEditTask }) => {
  const [selectedTask, setSelectedTask] = useState(null);

  // Define the day range - Full 24 hours (00:00 to 23:59)
  const dayStartHour = 0; // 12:00 AM (midnight)
  const dayEndHour = 24; // 12:00 AM (next day)
  const dayDuration = 24; // 24 hours
  const totalMinutesInDay = 24 * 60; // 1440 minutes

  // Convert timestamp to minutes from midnight
  const timestampToMinutes = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return null;
      return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
    } catch (error) {
      return null;
    }
  };

  // Convert time string (HH:MM:SS) to minutes from midnight
  const timeToMinutes = (timeString) => {
    if (!timeString || timeString === 'NULL') return null;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
  };

  // Convert minutes to percentage position on timeline
  const minutesToPosition = (minutes) => {
    if (minutes === null || minutes === undefined) return 0;
    const clampedMinutes = Math.max(0, Math.min(totalMinutesInDay, minutes));
    return (clampedMinutes / totalMinutesInDay) * 100;
  };

  // Calculate width percentage for a task
  const calculateWidth = (startMinutes, endMinutes) => {
    if (!startMinutes || !endMinutes) return 0;
    const clampedStart = Math.max(0, Math.min(totalMinutesInDay, startMinutes));
    const clampedEnd = Math.max(0, Math.min(totalMinutesInDay, endMinutes));
    const durationMinutes = clampedEnd - clampedStart;
    const width = (durationMinutes / totalMinutesInDay) * 100;
    return Math.max(width, 0.5);
  };

  // Filter tasks that have valid time data
  const validTasks = tasks.filter(task => {
    const startTime = task.time_started || task.start_time;
    const endTime = task.time_completed || task.end_time;
    return startTime && endTime;
  });

  // Sort tasks by start time
  const sortedTasks = [...validTasks].sort((a, b) => {
    const aStart = timestampToMinutes(a.time_started || a.start_time);
    const bStart = timestampToMinutes(b.time_started || b.start_time);
    if (!aStart) return 1;
    if (!bStart) return -1;
    return aStart - bStart;
  });

  // Calculate overlapping layers for tasks
  const calculateLayers = () => {
    const layers = [];
    
    sortedTasks.forEach(task => {
      const taskStart = timestampToMinutes(task.time_started || task.start_time);
      const taskEnd = timestampToMinutes(task.time_completed || task.end_time);
      
      if (!taskStart || !taskEnd) return;

      // Find which layer this task should be placed in
      let layerIndex = 0;
      let placed = false;

      while (!placed) {
        // Check if this layer exists
        if (!layers[layerIndex]) {
          layers[layerIndex] = [];
        }

        // Check if task overlaps with any task in this layer
        const hasOverlap = layers[layerIndex].some(existingTask => {
          const existingStart = timestampToMinutes(existingTask.time_started || existingTask.start_time);
          const existingEnd = timestampToMinutes(existingTask.time_completed || existingTask.end_time);
          
          if (!existingStart || !existingEnd) return false;

          // Check for overlap
          return !(taskEnd <= existingStart || taskStart >= existingEnd);
        });

        if (!hasOverlap) {
          layers[layerIndex].push(task);
          placed = true;
        } else {
          layerIndex++;
        }
      }
    });

    return layers;
  };

  const layers = calculateLayers();
  const maxLayers = layers.length;

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
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: 'bg-yellow-500', border: 'border-yellow-400' },
      in_progress: { bg: 'bg-blue-500', border: 'border-blue-400' },
      ready_for_review: { bg: 'bg-purple-500', border: 'border-purple-400' },
      approved: { bg: 'bg-green-500', border: 'border-green-400' },
      completed: { bg: 'bg-green-600', border: 'border-green-500' }
    };
    return colors[status] || { bg: 'bg-gray-500', border: 'border-gray-400' };
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-400',
      medium: 'bg-blue-400',
      high: 'bg-orange-400',
      critical: 'bg-red-400'
    };
    return colors[priority] || 'bg-gray-400';
  };

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      {/* Timeline Container */}
      <div className="relative bg-gray-900/50 rounded-lg p-3 border border-gray-700/50 min-w-[600px]">
        {/* Time Markers */}
        <div className="relative h-8 mb-2 overflow-visible">
          {timeMarkers.map((marker, index) => {
            let transformClass = 'transform -translate-x-1/2';
            if (marker.position === 0) {
              transformClass = 'transform translate-x-0';
            } else if (marker.position === 100) {
              transformClass = 'transform -translate-x-full';
            }
            
            return (
              <div
                key={index}
                className={`absolute top-0 ${transformClass}`}
                style={{ 
                  left: `${marker.position}%`,
                  maxWidth: marker.position === 0 || marker.position === 100 ? 'auto' : '100%'
                }}
              >
                <div className="w-px h-2 bg-gray-600 mx-auto"></div>
                <div className="text-xs text-gray-400 mt-1 font-mono text-center whitespace-nowrap">
                  {marker.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Bar with Multiple Layers */}
        <div 
          className="relative bg-gray-800/30 rounded border border-gray-700/30 overflow-hidden"
          style={{ height: `${maxLayers * 20 + (maxLayers - 1) * 4}px` }}
        >
          {layers.map((layerTasks, layerIndex) => (
            <div
              key={layerIndex}
              className="absolute w-full"
              style={{
                top: `${layerIndex * 24}px`,
                height: '20px'
              }}
            >
              {layerTasks.map((task, taskIndex) => {
                const startMinutes = timestampToMinutes(task.time_started || task.start_time);
                const endMinutes = timestampToMinutes(task.time_completed || task.end_time);
                
                if (!startMinutes || !endMinutes) return null;

                const left = minutesToPosition(startMinutes);
                const width = calculateWidth(startMinutes, endMinutes);
                const statusColor = getStatusColor(task.status);
                const priorityDot = getPriorityColor(task.priority);

                // Calculate duration
                const durationMinutes = endMinutes - startMinutes;
                const hours = Math.floor(durationMinutes / 60);
                const minutes = Math.floor(durationMinutes % 60);

                return (
                  <div
                    key={task.id || taskIndex}
                    onClick={() => setSelectedTask(task)}
                    className={`absolute h-full ${statusColor.bg} ${statusColor.border} border-2 rounded transition-all hover:opacity-90 hover:scale-y-110 cursor-pointer group active:scale-95`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      minWidth: width < 0.5 ? '2px' : 'auto',
                      zIndex: layerIndex === 0 ? 10 : 5 - layerIndex
                    }}
                    title={`${task.task} - ${formatTime(task.time_started || task.start_time)} to ${formatTime(task.time_completed || task.end_time)}`}
                  >
                    {/* Priority indicator dot */}
                    <div className={`absolute top-0 right-0 w-2 h-2 ${priorityDot} rounded-full border border-white/50`}></div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-gray-600 shadow-lg">
                        <div className="font-semibold">{task.task}</div>
                        <div>{formatTime(task.time_started || task.start_time)} - {formatTime(task.time_completed || task.end_time)}</div>
                        <div className="text-gray-300">Duration: {hours}h {minutes}m</div>
                        <div className="text-gray-300">Assigned to: {task.assigned_to_name}</div>
                        <div className="text-blue-400 text-xs mt-1">Click for details</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Empty state */}
          {sortedTasks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              No tasks with time data
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-3 sm:gap-4 mt-3 text-xs flex-wrap items-center">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-3 h-3 bg-yellow-500 rounded border border-yellow-400 shrink-0"></div>
            <span className="text-gray-300 whitespace-nowrap">Pending</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-3 h-3 bg-blue-500 rounded border border-blue-400 shrink-0"></div>
            <span className="text-gray-300 whitespace-nowrap">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-3 h-3 bg-purple-500 rounded border border-purple-400 shrink-0"></div>
            <span className="text-gray-300 whitespace-nowrap">Ready for Review</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-3 h-3 bg-green-500 rounded border border-green-400 shrink-0"></div>
            <span className="text-gray-300 whitespace-nowrap">Completed</span>
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Task Details</h2>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Task Title */}
              <div>
                <div className="text-sm text-gray-400 mb-1">Task</div>
                <div className="text-lg font-semibold text-white">{selectedTask.task}</div>
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Status</div>
                  <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    selectedTask.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                    selectedTask.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                    selectedTask.status === 'ready_for_review' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {selectedTask.status.replace('_', ' ')}
                  </div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Priority</div>
                  <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    selectedTask.priority === 'low' ? 'bg-gray-500/20 text-gray-300' :
                    selectedTask.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                    selectedTask.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {selectedTask.priority}
                  </div>
                </div>
              </div>

              {/* Time Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Start Time</div>
                  <div className="text-lg font-mono font-semibold text-white">
                    {formatTime(selectedTask.time_started || selectedTask.start_time)}
                  </div>
                  {selectedTask.time_started || selectedTask.start_time ? (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(selectedTask.time_started || selectedTask.start_time).toLocaleString()}
                    </div>
                  ) : null}
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">End Time</div>
                  <div className="text-lg font-mono font-semibold text-white">
                    {formatTime(selectedTask.time_completed || selectedTask.end_time)}
                  </div>
                  {selectedTask.time_completed || selectedTask.end_time ? (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(selectedTask.time_completed || selectedTask.end_time).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Duration */}
              {selectedTask.time_started && selectedTask.time_completed && (
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Duration</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {(() => {
                      const start = timestampToMinutes(selectedTask.time_started);
                      const end = timestampToMinutes(selectedTask.time_completed);
                      if (!start || !end) return 'N/A';
                      const durationMinutes = end - start;
                      const hours = Math.floor(durationMinutes / 60);
                      const minutes = Math.floor(durationMinutes % 60);
                      return `${hours}h ${minutes}m`;
                    })()}
                  </div>
                </div>
              )}

              {/* Assigned Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Assigned To</div>
                  <div className="text-white font-medium">{selectedTask.assigned_to_name || 'Not assigned'}</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                  <div className="text-sm text-gray-400 mb-1">Assigned By</div>
                  <div className="text-white font-medium">{selectedTask.assigned_by_name || 'Unknown'}</div>
                </div>
              </div>

              {/* Estimated/Actual Time */}
              {(selectedTask.estimated_time_minutes || selectedTask.actual_time_minutes) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedTask.estimated_time_minutes && (
                    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                      <div className="text-sm text-gray-400 mb-1">Estimated Time</div>
                      <div className="text-white">
                        {Math.floor(selectedTask.estimated_time_minutes / 60)}h {selectedTask.estimated_time_minutes % 60}m
                      </div>
                    </div>
                  )}
                  {selectedTask.actual_time_minutes && (
                    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                      <div className="text-sm text-gray-400 mb-1">Actual Time</div>
                      <div className="text-white">
                        {Math.floor(selectedTask.actual_time_minutes / 60)}h {selectedTask.actual_time_minutes % 60}m
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Notes */}
              {selectedTask.rejection_notes && (
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <div className="text-sm text-red-400 mb-1">Revision Needed</div>
                  <div className="text-white text-sm">{selectedTask.rejection_notes}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {onEditTask && (
                <button
                  onClick={() => {
                    onEditTask(selectedTask);
                    setSelectedTask(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                >
                  ✏️ Edit Task
                </button>
              )}
              <button
                onClick={() => setSelectedTask(null)}
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

export default TaskTimelineBar;
