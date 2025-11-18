import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';

function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    assigned_to: '',
    task: ''
  });
  const { currentUser } = useLocalSession();

  // Status styles mapping
  const statusStyles = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30'
  };

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
      
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    }
  }, []);

  // Fetch workers (user_type 0-9)
  const fetchWorkers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks/workers');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch workers');
      }
      
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to load workers');
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchWorkers();
  }, [fetchTasks, fetchWorkers]);

  // Add new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    
    if (!newTask.assigned_to || !newTask.task.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const taskData = {
        assigned_by: currentUser.id,
        assigned_to: parseInt(newTask.assigned_to),
        task: newTask.task.trim()
      };

      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      toast.success('Task created successfully!');
      setShowAddModal(false);
      setNewTask({ assigned_to: '', task: '' });
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to create task');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }

      toast.success('Task deleted successfully!');
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error.message || 'Failed to delete task');
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${
        currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Task Management
              </h1>
              <p className="text-gray-400">Assign and manage tasks for your team</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              + Assign New Task
            </button>
          </div>

          {/* Tasks Grid */}
          <div className="grid gap-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {task.task}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Assigned by:</span>
                        <span className="font-medium">{task.assigned_by_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Assigned to:</span>
                        <span className="font-medium">{task.assigned_to_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Created:</span>
                        <span>{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[task.status]}`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200 p-2 hover:bg-red-500/10 rounded-lg"
                      title="Delete Task"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
                <p>Start by assigning a new task to your team members</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700/50">
            <h2 className="text-xl font-bold mb-4">Assign New Task</h2>
            
            <form onSubmit={handleAddTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign To
                  </label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Select a worker</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.username} (Level {worker.user_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Task Description
                  </label>
                  <textarea
                    value={newTask.task}
                    onChange={(e) => setNewTask(prev => ({ ...prev, task: e.target.value }))}
                    rows="4"
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="Describe the task in detail..."
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskManagement;