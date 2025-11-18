import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import FilterTabs from '../components/MyTasks/FilterTabs.jsx';
import TaskCard from '../components/MyTasks/TaskCard.jsx';
import EmptyState from '../components/MyTasks/EmptyState.jsx';
import SummaryStats from '../components/MyTasks/SummaryStats.jsx';

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'in_progress', 'completed'
  const { currentUser } = useLocalSession();

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

          <FilterTabs
            filter={filter}
            setFilter={setFilter}
            counts={counts}
          />

          {/* Tasks Grid */}
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
              />
            ))}

            {filteredTasks.length === 0 && (
              <EmptyState filter={filter} />
            )}
          </div>

          {tasks.length > 0 && (
            <SummaryStats counts={counts} />
          )}
        </div>
      </main>
    </div>
  );
}

export default MyTasks;