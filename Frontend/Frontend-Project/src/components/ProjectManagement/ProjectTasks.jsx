import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ProjectTasks = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/project/${projectId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTasks(data);
      } else {
        toast.error('Failed to load tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  const statusStyles = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ready_for_review: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30'
  };

  const priorityStyles = {
    low: 'bg-gray-500/20 text-gray-300',
    medium: 'bg-blue-500/20 text-blue-300',
    high: 'bg-orange-500/20 text-orange-300',
    critical: 'bg-red-500/20 text-red-300'
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Tasks ({tasks.length})</h3>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-600 rounded-lg">
          <div className="text-4xl mb-2">📋</div>
          <p>No tasks yet</p>
          <p className="text-sm">Add tasks to get started with this project</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white">{task.task}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs border ${statusStyles[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${priorityStyles[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <span>👤</span>
                  <span>Assigned to: {task.assigned_to_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👤</span>
                  <span>By: {task.assigned_by_name}</span>
                </div>
                {task.estimated_time_minutes && (
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>Est: {Math.round(task.estimated_time_minutes / 60)}h {task.estimated_time_minutes % 60}m</span>
                  </div>
                )}
                {task.actual_time_minutes && (
                  <div className="flex items-center gap-1">
                    <span>⏰</span>
                    <span>Actual: {Math.round(task.actual_time_minutes / 60)}h {task.actual_time_minutes % 60}m</span>
                  </div>
                )}
              </div>

              {task.rejection_notes && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                  <strong>Revision needed:</strong> {task.rejection_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;