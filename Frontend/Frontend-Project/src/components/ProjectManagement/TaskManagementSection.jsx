import React, { useState, useEffect } from 'react';

const TaskManagementSection = ({ tasks, workers, projects, projectMembers, onTaskAction, onRejectTask }) => {
  const [filter, setFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');

  const filteredTasks = tasks.filter(task => {
    if (filter !== 'all' && task.status !== filter) return false;
    if (selectedProject !== 'all' && task.project_id !== parseInt(selectedProject)) return false;
    return true;
  });

  const handleReassign = async (taskId, newWorkerId) => {
    // Remove associated files first
    try {
      const filesResponse = await fetch(`http://localhost:5000/api/tasks/${taskId}/files`);
      if (filesResponse.ok) {
        const files = await filesResponse.json();
        // Delete all files associated with this task
        for (const file of files) {
          await fetch(`http://localhost:5000/api/tasks/${taskId}/files/${file.id}`, {
            method: 'DELETE',
          });
        }
      }
    } catch (error) {
      console.error('Error removing files:', error);
    }

    // Reassign task
    await onTaskAction('reassign', taskId, { assigned_to: parseInt(newWorkerId) });
  };

  const handleApprove = async (taskId) => {
    await onTaskAction('approve', taskId);
  };

  const handleReadyForReview = async (taskId) => {
    await onTaskAction('ready_for_review', taskId);
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    await onTaskAction('delete', taskId);
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const statusStyles = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ready_for_review: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    approved: 'bg-green-500/20 text-green-300 border-green-500/30',
    completed: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  };

  const priorityStyles = {
    low: 'bg-gray-500/20 text-gray-300',
    medium: 'bg-blue-500/20 text-blue-300',
    high: 'bg-orange-500/20 text-orange-300',
    critical: 'bg-red-500/20 text-red-300'
  };

  // Get workers for a specific task's project
  const getWorkersForTask = (task) => {
    if (!task.project_id || !projectMembers[task.project_id]) return workers;
    return workers.filter(worker => 
      projectMembers[task.project_id].some(member => member.user_id === worker.id)
    );
  };

  return (
    <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <div className="flex gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="ready_for_review">Ready for Review</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const taskWorkers = getWorkersForTask(task);
          
          return (
            <div
              key={task.id}
              className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 rounded text-xs border ${statusStyles[task.status]}`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${priorityStyles[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.project_title && (
                      <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-300">
                        {task.project_title}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-3">{task.task}</h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>Assigned to: 
                        <select
                          value={task.assigned_to}
                          onChange={(e) => handleReassign(task.id, e.target.value)}
                          className="ml-2 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          {taskWorkers.map(worker => (
                            <option key={worker.id} value={worker.id}>
                              {worker.username}
                            </option>
                          ))}
                        </select>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>By: {task.assigned_by_name}</span>
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
                    {task.start_time && (
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>Start: {new Date(task.start_time).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {task.rejection_notes && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 text-red-300 mb-1">
                        <span>⚠️</span>
                        <span className="font-semibold">Rejection Notes</span>
                      </div>
                      <p className="text-red-200 text-sm">{task.rejection_notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {/* Show Approve/Reject for both ready_for_review and approved tasks */}
                  {(task.status === 'ready_for_review' || task.status === 'approved') && (
                    <>
                      <button
                        onClick={() => handleApprove(task.id)}
                        className="px-3 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                        title="Approve Task"
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => onRejectTask(task.id, task.status)}
                        className="px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Reject Task"
                      >
                        ❌
                      </button>
                    </>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => handleReadyForReview(task.id)}
                      className="px-3 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
                      title="Mark as Ready for Review"
                    >
                      📤
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Delete Task"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Files Section */}
              <div className="mt-4">
                <TaskFiles taskId={task.id} />
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
            <p>No tasks match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for displaying task files
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
    <div className="bg-gray-700/30 rounded-lg p-3">
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

export default TaskManagementSection;