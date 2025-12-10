import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import FilterTabs from '../components/MyTasks/FilterTabs.jsx';
import TaskCard from '../components/MyTasks/TaskCard.jsx';
import EmptyState from '../components/MyTasks/EmptyState.jsx';
import SummaryStats from '../components/MyTasks/SummaryStats.jsx';

function MyTasks() {
  const { currentUser } = useLocalSession();
  
  // ========== ACCESS CONTROL START ==========
  // Get user_type from currentUser
  const userType = currentUser?.user_type ?? 5; // Default to trainee if not set
  
  // This page is accessible to ALL user types (0-5) - Everyone can see their own tasks
  const allowedRoles = [0, 1, 2, 3, 4, 5];
  
  if (!allowedRoles.includes(userType)) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        {currentUser && <AdminSidebar />}
        <div className={`${currentUser ? 'ml-64' : ''} min-h-screen flex items-center justify-center`}>
          <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-4">
                Please log in to view your tasks.
              </p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ========== ACCESS CONTROL END ==========

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [openDropdownId, setOpenDropdownId] = useState(null);

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

  // Update task status with smart workflow
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Use the smart submission endpoint for ready_for_review
      if (newStatus === 'ready_for_review') {
        const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/submit`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            user_id: currentUser.id 
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit task');
        }

        toast.success(data.message);
        setOpenDropdownId(null);
        fetchMyTasks();
      } else {
        // For other status changes, use the regular endpoint
        const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: newStatus,
            user_id: currentUser.id 
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update task status');
        }

        toast.success('Task status updated!');
        setOpenDropdownId(null);
        fetchMyTasks();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      
      // Check for duplicate member error and provide helpful message
      if (error.message.includes('Duplicate entry') || error.message.includes('unique_project_user')) {
        toast.error('Error in task workflow. Please contact administrator.');
      } else {
        toast.error(error.message || 'Failed to update task status');
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaded_by', currentUser.id);

      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/files`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      toast.success('File uploaded successfully!');
      fetchMyTasks(); // Refresh to show new files
      return Promise.resolve();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
      return Promise.reject(error);
    }
  };

  // Handle dropdown open/close
  const handleDropdownToggle = (taskId, isOpen) => {
    if (isOpen) {
      setOpenDropdownId(taskId);
    } else {
      setOpenDropdownId(null);
    }
  };

  // Filter tasks - EXCLUDE completed tasks and only show pending, in_progress, ready_for_review
  const filteredTasks = tasks.filter(task => {
    if (task.status === 'completed') return false; // Hide completed tasks
    
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // Calculate counts for each filter - EXCLUDE completed tasks
  const calculateCounts = () => {
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    
    return {
      all: activeTasks.length,
      pending: activeTasks.filter(task => task.status === 'pending').length,
      in_progress: activeTasks.filter(task => task.status === 'in_progress').length,
      ready_for_review: activeTasks.filter(task => task.status === 'ready_for_review').length
    };
  };

  const counts = calculateCounts();

  // Check if user should see sidebar (based on original logic)
  const showSidebar = currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee');

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      {showSidebar && <AdminSidebar />}

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${
        showSidebar ? 'ml-64' : ''
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              My Tasks
            </h1>
            <p className="text-gray-400">Active tasks assigned to you - Stay organized and productive</p>
            <p className="text-gray-500 text-sm mt-1">
              Logged in as: {currentUser?.username} ({getRoleName(userType)})
            </p>
          </div>

          <FilterTabs
            filter={filter}
            setFilter={setFilter}
            counts={counts}
          />

          {/* Tasks Grid */}
          <div className="space-y-4 relative">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onFileUpload={handleFileUpload}
                onDropdownToggle={handleDropdownToggle}
                isDropdownOpen={openDropdownId === task.id}
                hasOpenDropdown={!!openDropdownId}
                currentUser={currentUser}
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

// Helper function to get role name
function getRoleName(userType) {
  switch(userType) {
    case 0: return 'Administrator';
    case 1: return 'Senior Manager';
    case 2: return 'Manager';
    case 3: return 'Supervisor';
    case 4: return 'Employee';
    case 5: return 'Trainee';
    default: return 'User';
  }
}

export default MyTasks;