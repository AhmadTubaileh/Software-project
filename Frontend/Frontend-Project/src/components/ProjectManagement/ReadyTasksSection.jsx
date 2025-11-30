import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ReadyTasksSection = ({ projectId, currentUser, onTaskAction }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadyTasks();
  }, [projectId]);

  const fetchReadyTasks = async () => {
    try {
      // Fetch all tasks for the project first
      const response = await fetch(`http://localhost:5000/api/tasks/project/${projectId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter tasks to only show those with status 'ready_for_review'
        const readyTasks = data.filter(task => task.status === 'ready_for_review');
        setTasks(readyTasks);
      } else {
        toast.error('Failed to load tasks');
      }
    } catch (error) {
      console.error('Error fetching ready tasks:', error);
      toast.error('Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: currentUser.id,
          role: currentUser.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve task');
      }

      toast.success('Task approved successfully!');
      fetchReadyTasks(); // Refresh the list
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error(error.message || 'Failed to approve task');
    }
  };

  // UPDATED: Use the onTaskAction callback for rejection instead of browser prompt
  const handleReject = (taskId) => {
    if (onTaskAction) {
      // Call the parent's reject handler which will open the modal
      onTaskAction('reject', taskId, { currentStatus: 'ready_for_review' });
    } else {
      // Fallback to old method if no callback provided
      const notes = prompt('Enter rejection notes:');
      if (!notes) return;
      handleRejectWithNotes(taskId, notes);
    }
  };

  // Fallback reject method (old way)
  const handleRejectWithNotes = async (taskId, notes) => {
    try {
      // First, delete associated files
      const filesResponse = await fetch(`http://localhost:5000/api/tasks/${taskId}/files`);
      if (filesResponse.ok) {
        const files = await filesResponse.json();
        for (const file of files) {
          await fetch(`http://localhost:5000/api/tasks/${taskId}/files/${file.id}`, {
            method: 'DELETE',
          });
        }
      }

      // Then reject the task using the new endpoint
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/reject-task`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          rejected_by_id: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject task');
      }

      toast.success('Task rejected successfully!');
      fetchReadyTasks(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast.error(error.message || 'Failed to reject task');
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading ready tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          Tasks Ready for Review ({tasks.length})
        </h3>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-600 rounded-lg">
          <div className="text-4xl mb-2">📝</div>
          <p>No tasks ready for review</p>
          <p className="text-sm">Tasks submitted by team members will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-800/30 rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-1 rounded text-xs border bg-purple-500/20 text-purple-300 border-purple-500/30">
                      READY FOR REVIEW
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                      task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                      task.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-3">{task.task}</h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>Assigned to: <span className="font-medium text-white">{task.assigned_to_name}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>By: <span className="font-medium text-white">{task.assigned_by_name}</span></span>
                    </div>
                    {task.estimated_time_minutes && (
                      <div className="flex items-center gap-2">
                        <span>⏱️</span>
                        <span>Est: {formatTime(task.estimated_time_minutes)}</span>
                      </div>
                    )}
                    {task.actual_time_minutes && (
                      <div className="flex items-center gap-2">
                        <span>⏰</span>
                        <span>Actual: {formatTime(task.actual_time_minutes)}</span>
                      </div>
                    )}
                  </div>

                  {/* Files Section */}
                  <TaskFiles taskId={task.id} />
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(task.id)}
                    className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                    title="Approve Task"
                  >
                    ✅ Approve
                  </button>
                  {/* UPDATED: Use the new handleReject function that calls the parent callback */}
                  <button
                    onClick={() => handleReject(task.id)}
                    className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Reject Task"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// TaskFiles component for displaying files
const TaskFiles = ({ taskId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [taskId]);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/files`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (files.length === 0) return null;

  return (
    <div className="bg-gray-700/30 rounded-lg p-3 mt-3">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <span>📎</span>
        <span>Attached Files ({files.length})</span>
      </div>
      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-300">{file.file_name}</span>
            <a
              href={`http://localhost:5000${file.file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadyTasksSection;