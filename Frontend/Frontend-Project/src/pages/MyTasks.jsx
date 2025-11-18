import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'in_progress', 'completed'
  const { currentUser } = useLocalSession();

  // Status styles mapping
  const statusStyles = {
    pending: {
      container: 'bg-yellow-500/20 border-yellow-500/30',
      text: 'text-yellow-300',
      dot: 'bg-yellow-400',
      gradient: 'from-yellow-500/10 to-amber-500/10',
      progress: 'bg-yellow-500'
    },
    in_progress: {
      container: 'bg-blue-500/20 border-blue-500/30',
      text: 'text-blue-300',
      dot: 'bg-blue-400',
      gradient: 'from-blue-500/10 to-cyan-500/10',
      progress: 'bg-blue-500'
    },
    completed: {
      container: 'bg-green-500/20 border-green-500/30',
      text: 'text-green-300',
      dot: 'bg-green-400',
      gradient: 'from-green-500/10 to-emerald-500/10',
      progress: 'bg-green-500'
    }
  };

  // Status options for enhanced dropdown
  const statusOptions = [
    { 
      value: 'pending', 
      label: 'Pending', 
      emoji: '⏳',
      description: 'Task is waiting to be started',
      color: 'yellow'
    },
    { 
      value: 'in_progress', 
      label: 'In Progress', 
      emoji: '🔄',
      description: 'Currently working on this task',
      color: 'blue'
    },
    { 
      value: 'completed', 
      label: 'Completed', 
      emoji: '✅',
      description: 'Task has been finished',
      color: 'green'
    }
  ];

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Tasks', emoji: '📋', count: 0 },
    { value: 'pending', label: 'Pending', emoji: '⏳', count: 0 },
    { value: 'in_progress', label: 'In Progress', emoji: '🔄', count: 0 },
    { value: 'completed', label: 'Completed', emoji: '✅', count: 0 }
  ];

  // Fetch tasks assigned to current user
  const fetchMyTasks = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/my-tasks/${currentUser.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
      
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // Update task status
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task status');
      }

      toast.success('Task status updated!');
      fetchMyTasks(); // Refresh the list
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error(error.message || 'Failed to update task status');
    }
  };

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => 
    filter === 'all' ? true : task.status === filter
  );

  // Calculate counts for each filter
  const calculateCounts = () => {
    return {
      all: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      in_progress: tasks.filter(task => task.status === 'in_progress').length,
      completed: tasks.filter(task => task.status === 'completed').length
    };
  };

  const counts = calculateCounts();

  // Enhanced Status Dropdown Component
  const StatusDropdown = ({ task, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentStatus = statusOptions.find(opt => opt.value === task.status);

    const handleOptionClick = (newStatus) => {
      onStatusChange(task.id, newStatus);
      setIsOpen(false);
    };

    return (
      <div className="relative">
        {/* Dropdown Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg ${
            statusStyles[task.status].container
          } ${statusStyles[task.status].text} group`}
        >
          <span className="text-sm">{currentStatus.emoji}</span>
          <span className="font-medium text-sm capitalize">
            {task.status.replace('_', ' ')}
          </span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-10 overflow-hidden">
            <div className="p-3 border-b border-gray-700/50">
              <h4 className="font-semibold text-white text-sm">Update Status</h4>
              <p className="text-gray-400 text-xs">Change task progress</p>
            </div>
            
            <div className="p-2 space-y-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                    task.status === option.value
                      ? `${statusStyles[option.value].container} ${statusStyles[option.value].text}`
                      : 'hover:bg-gray-700/50 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                      task.status === option.value 
                        ? 'bg-white/20' 
                        : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                    }`}>
                      {option.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{option.label}</span>
                        {task.status === option.value && (
                          <div className={`w-2 h-2 rounded-full ${statusStyles[option.value].dot}`} />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 group-hover:text-gray-300">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-0"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              My Tasks
            </h1>
            <p className="text-gray-400">Tasks assigned to you - Stay organized and productive</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3 mb-8 p-1 bg-gray-800/30 rounded-2xl border border-gray-700/50 w-fit">
            {filterOptions.map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  filter === filterOption.value
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'hover:bg-gray-700/50 border border-transparent'
                }`}
              >
                <span className="text-lg">{filterOption.emoji}</span>
                <div className="text-left">
                  <div className="font-medium text-sm">{filterOption.label}</div>
                  <div className={`text-xs ${
                    filter === filterOption.value ? 'text-blue-300' : 'text-gray-400'
                  }`}>
                    {counts[filterOption.value]} tasks
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Tasks Grid */}
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-gradient-to-r ${statusStyles[task.status].gradient} rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-3 h-3 rounded-full ${statusStyles[task.status].dot} animate-pulse`} />
                      <span className={`text-xs font-semibold uppercase tracking-wider ${statusStyles[task.status].text}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-gray-100 transition-colors">
                      {task.task}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                        <span className="text-gray-400">👤</span>
                        <span className="text-gray-300">Assigned by <span className="font-medium text-white">{task.assigned_by_name}</span></span>
                      </div>
                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                        <span className="text-gray-400">📅</span>
                        <span className="text-gray-300">{new Date(task.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    <StatusDropdown 
                      task={task} 
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 bg-black/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                        statusStyles[task.status].progress
                      } ${
                        task.status === 'completed' ? 'w-full' :
                        task.status === 'in_progress' ? 'w-2/3' :
                        'w-1/3'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${statusStyles[task.status].text} min-w-12 text-right`}>
                    {task.status === 'completed' ? '100% Complete' :
                     task.status === 'in_progress' ? 'In Progress' :
                     'Just Started'}
                  </span>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">
                  {filter === 'all' ? '📋' :
                   filter === 'pending' ? '⏳' :
                   filter === 'in_progress' ? '🔄' : '✅'}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {filter === 'all' ? 'No tasks assigned' :
                   filter === 'pending' ? 'No pending tasks' :
                   filter === 'in_progress' ? 'No tasks in progress' : 
                   'No completed tasks'}
                </h3>
                <p className="max-w-md mx-auto">
                  {filter === 'all' ? "You're all caught up! No tasks have been assigned to you yet." :
                   filter === 'pending' ? "Great! You don't have any pending tasks at the moment." :
                   filter === 'in_progress' ? "No tasks are currently in progress. Start working on some pending tasks!" :
                   "You haven't completed any tasks yet. Keep going!"}
                </p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {tasks.length > 0 && (
            <div className="mt-8 p-6 bg-gray-800/30 rounded-2xl border border-gray-700/50">
              <h4 className="font-semibold text-white mb-4">Task Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
                  <div className="text-2xl font-bold text-white">{counts.all}</div>
                  <div className="text-gray-400 text-sm">Total Tasks</div>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-300">{counts.pending}</div>
                  <div className="text-yellow-400/80 text-sm">Pending</div>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-300">{counts.in_progress}</div>
                  <div className="text-blue-400/80 text-sm">In Progress</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="text-2xl font-bold text-green-300">{counts.completed}</div>
                  <div className="text-green-400/80 text-sm">Completed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyTasks;