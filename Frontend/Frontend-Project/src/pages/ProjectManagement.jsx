import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import CreateProjectModal from '../components/ProjectManagement/CreateProjectModal.jsx';
import AddMemberModal from '../components/ProjectManagement/AddMemberModal.jsx';
import AddTaskModal from '../components/ProjectManagement/AddTaskModal.jsx';
import TaskManagementSection from '../components/ProjectManagement/TaskManagementSection.jsx';
import RejectTaskModal from '../components/ProjectManagement/RejectTaskModal.jsx';
import DeleteConfirmationModal from '../components/ProjectManagement/DeleteConfirmationModal.jsx';
import ProjectMembersModal from '../components/ProjectManagement/ProjectMembersModal.jsx';

function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projectMembers, setProjectMembers] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState(null);
  const [selectedTaskForReject, setSelectedTaskForReject] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [headerAddTaskData, setHeaderAddTaskData] = useState({
    projectId: '',
    workerId: ''
  });
  const [headerAddMemberData, setHeaderAddMemberData] = useState({
    projectId: '',
    workerId: ''
  });
  const [projectCardAddMemberData, setProjectCardAddMemberData] = useState({
    projectId: '',
    workerId: ''
  });
  const [showHeaderAddTaskDropdown, setShowHeaderAddTaskDropdown] = useState(false);
  const [showHeaderAddMemberDropdown, setShowHeaderAddMemberDropdown] = useState(false);
  const [showProjectCardAddMemberDropdown, setShowProjectCardAddMemberDropdown] = useState({});
  const [loading, setLoading] = useState(true);
  const { currentUser } = useLocalSession();

  // Debug currentUser
  useEffect(() => {
    console.log('Current User:', currentUser);
  }, [currentUser]);

  // Fetch all projects (only non-deleted ones)
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }
      
      // Filter out deleted projects (is_deleted = 1)
      const activeProjects = data.filter(project => project.is_deleted !== 1);
      setProjects(activeProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  }, []);

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

  // Fetch workers
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

  // Fetch members for each project
  const fetchProjectMembers = useCallback(async () => {
    try {
      const membersData = {};
      for (const project of projects) {
        const response = await fetch(`http://localhost:5000/api/projects/${project.id}/members`);
        if (response.ok) {
          const data = await response.json();
          membersData[project.id] = data;
        }
      }
      setProjectMembers(membersData);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  }, [projects]);

  // UPDATED: Complete refresh function
  const refreshAllData = useCallback(async () => {
    console.log('Refreshing all project data...');
    setLoading(true);
    try {
      await Promise.all([fetchProjects(), fetchTasks(), fetchWorkers()]);
      // Project members will be fetched in the useEffect below
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, fetchTasks, fetchWorkers]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchProjectMembers();
    }
  }, [projects, fetchProjectMembers]);

  // Create new project
  const handleCreateProject = async (projectData) => {
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...projectData,
          created_by: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // If team leader is assigned, automatically add them as member
      if (projectData.team_leader_id) {
        await fetch(`http://localhost:5000/api/projects/${data.projectId}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: parseInt(projectData.team_leader_id),
            role: 'team_leader'
          }),
        });
      }

      toast.success('Project created successfully!');
      setShowCreateModal(false);
      refreshAllData(); // Use the new refresh function
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    }
  };

  // Add member to project from header
  const handleHeaderAddMember = async () => {
    if (!headerAddMemberData.projectId || !headerAddMemberData.workerId) {
      toast.error('Please select both project and team member');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${headerAddMemberData.projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: parseInt(headerAddMemberData.workerId),
          role: 'member'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      toast.success('Member added successfully!');
      setHeaderAddMemberData({ projectId: '', workerId: '' });
      setShowHeaderAddMemberDropdown(false);
      refreshAllData(); // Use the new refresh function
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  // Add member to specific project from project card
  const handleProjectCardAddMember = async (projectId) => {
    if (!projectCardAddMemberData.workerId) {
      toast.error('Please select a team member');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: parseInt(projectCardAddMemberData.workerId),
          role: 'member'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      toast.success('Member added successfully!');
      setProjectCardAddMemberData({ projectId: '', workerId: '' });
      setShowProjectCardAddMemberDropdown(prev => ({ ...prev, [projectId]: false }));
      refreshAllData(); // Use the new refresh function
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  // Add task from header using AddTaskModal
  const handleHeaderAddTask = async (taskData) => {
    if (!headerAddTaskData.projectId) {
      toast.error('Please select a project first');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          project_id: parseInt(headerAddTaskData.projectId),
          assigned_by: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      toast.success('Task created successfully!');
      setHeaderAddTaskData({ projectId: '', workerId: '' });
      setShowHeaderAddTaskDropdown(false);
      setShowAddTaskModal(false);
      refreshAllData(); // Use the new refresh function
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to create task');
    }
  };

  // Add task to specific project from project card using AddTaskModal
  const handleProjectCardAddTask = async (taskData) => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          project_id: selectedProject.id,
          assigned_by: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      toast.success('Task created successfully!');
      setShowAddTaskModal(false);
      setSelectedProject(null);
      refreshAllData(); // Use the new refresh function
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to create task');
    }
  };

  // Show delete confirmation modal for project
  const handleDeleteProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Get tasks for this project
    const projectTasks = tasks.filter(task => task.project_id === projectId);
    const nonCompletedTasks = projectTasks.filter(task => task.status !== 'completed');
    const completedTasks = projectTasks.filter(task => task.status === 'completed');

    setItemToDelete({
      type: 'project',
      id: projectId,
      name: project.title,
      details: {
        nonCompletedTasks: nonCompletedTasks.length,
        completedTasks: completedTasks.length,
        memberCount: project.member_count,
        taskCount: project.task_count
      }
    });
    setShowDeleteModal(true);
  };

  // Handle actual project deletion after confirmation
  const handleConfirmProjectDelete = async (projectId) => {
    try {
      // First, archive all non-completed tasks for this project
      const archiveResponse = await fetch(`http://localhost:5000/api/tasks/project/${projectId}/archive-non-completed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const archiveData = await archiveResponse.json();

      if (!archiveResponse.ok) {
        throw new Error(archiveData.error || 'Failed to archive project tasks');
      }

      // Then soft delete the project by setting is_deleted = 1
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_deleted: 1
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }

      toast.success(`Project deleted successfully! ${archiveData.archivedTasks} non-completed tasks were archived.`);
      setShowDeleteModal(false);
      setItemToDelete(null);
      refreshAllData(); // Use the new refresh function
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(error.message || 'Failed to delete project');
    }
  };

  // Handle task actions from TaskManagementSection
  const handleTaskAction = async (action, taskId, data = {}) => {
    try {
      let response;
      
      switch (action) {
        case 'reassign':
          response = await fetch(`http://localhost:5000/api/tasks/${taskId}/reassign`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          break;
          
        case 'reject':
          // Set the task for rejection modal
          setSelectedTaskForReject({ taskId, currentStatus: data.currentStatus });
          setShowRejectModal(true);
          return; // Don't proceed further, wait for modal input
          
        case 'approve':
          // For approved tasks, change status to completed
          response = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'completed',
              user_id: currentUser.id
            }),
          });
          break;

        case 'ready_for_review':
          // Mark task as ready for review
          response = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'ready_for_review',
              user_id: currentUser.id
            }),
          });
          break;
          
        case 'delete':
          // Show delete confirmation modal for task
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            setItemToDelete({
              type: 'task',
              id: taskId,
              name: task.task,
              details: {
                project: task.project_title,
                assignedTo: task.assigned_to_name,
                status: task.status,
                priority: task.priority
              }
            });
            setShowDeleteModal(true);
          }
          return; // Don't proceed further, wait for modal input
          
        default:
          throw new Error('Unknown action');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} task`);
      }

      toast.success(`Task ${action === 'approve' ? 'completed' : action + 'ed'} successfully!`);
      refreshAllData(); // Use the new refresh function
    } catch (error) {
      console.error(`Error ${action}ing task:`, error);
      toast.error(error.message || `Failed to ${action} task`);
    }
  };

  // Handle actual task deletion after confirmation
  const handleConfirmTaskDelete = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/soft-delete`, {
        method: 'PUT',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete task');
      }

      toast.success('Task deleted successfully!');
      setShowDeleteModal(false);
      setItemToDelete(null);
      refreshAllData(); // Use the new refresh function
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error.message || 'Failed to delete task');
    }
  };

  // Handle task rejection with notes
  const handleTaskReject = async (rejectionNotes) => {
    if (!selectedTaskForReject) return;

    try {
      // Remove associated files first
      const filesResponse = await fetch(`http://localhost:5000/api/tasks/${selectedTaskForReject.taskId}/files`);
      if (filesResponse.ok) {
        const files = await filesResponse.json();
        for (const file of files) {
          await fetch(`http://localhost:5000/api/tasks/${selectedTaskForReject.taskId}/files/${file.id}`, {
            method: 'DELETE',
          });
        }
      }

      // Determine the new status based on current status
      let newStatus = 'pending';
      if (selectedTaskForReject.currentStatus === 'approved') {
        newStatus = 'ready_for_review'; // If approved task is rejected, send back to ready_for_review
      }

      // First update the status if needed
      if (newStatus !== selectedTaskForReject.currentStatus) {
        await fetch(`http://localhost:5000/api/tasks/${selectedTaskForReject.taskId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            user_id: currentUser.id
          }),
        });
      }

      // Then reject the task with notes
      const response = await fetch(`http://localhost:5000/api/tasks/${selectedTaskForReject.taskId}/reject-task`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: rejectionNotes,
          rejected_by_id: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject task');
      }

      toast.success('Task rejected successfully!');
      setShowRejectModal(false);
      setSelectedTaskForReject(null);
      refreshAllData(); // Use the new refresh function
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast.error(error.message || 'Failed to reject task');
    }
  };

  // Handle showing members modal
  const handleShowMembers = (project) => {
    setSelectedProjectForMembers(project);
    setShowMembersModal(true);
  };

  // UPDATED: Handle members updated callback - now properly refreshes all data
  const handleMembersUpdated = useCallback(async () => {
    console.log('Members updated - refreshing all data...');
    await refreshAllData();
    
    // Force a complete re-render of projects
    setProjects(prev => {
      const updatedProjects = [...prev];
      return updatedProjects;
    });
  }, [refreshAllData]);

  // Get workers for a specific project
  const getWorkersForProject = (projectId) => {
    if (!projectId || !projectMembers[projectId]) return [];
    return workers.filter(worker => 
      projectMembers[projectId].some(member => member.user_id === worker.id)
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close header dropdowns
      if (showHeaderAddTaskDropdown && !event.target.closest('.header-add-task-dropdown')) {
        setShowHeaderAddTaskDropdown(false);
      }
      if (showHeaderAddMemberDropdown && !event.target.closest('.header-add-member-dropdown')) {
        setShowHeaderAddMemberDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHeaderAddTaskDropdown, showHeaderAddMemberDropdown]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        <Toaster position="top-center" />
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}
        <main className={`flex-1 min-h-screen transition-all duration-300 ${
          currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
        }`}>
          <div className="p-6 flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}

      {/* Main Content */}
      <main className={`flex-1 min-h-screen bg-[#0e1830] transition-all duration-300 ${
        currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : 'ml-0'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                Project Management
              </h1>
              <p className="text-gray-400">Full administrative control over all projects and tasks</p>
            </div>
            <div className="flex gap-3">
              {/* Header Add Task Button with Enhanced Dropdown */}
              <div className="relative header-add-task-dropdown">
                <button
                  onClick={() => setShowHeaderAddTaskDropdown(!showHeaderAddTaskDropdown)}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <span>+</span>
                  Add Task
                </button>
                
                {/* Enhanced Dropdown Menu for Header Add Task */}
                {showHeaderAddTaskDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-96 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                      <h3 className="font-semibold text-white text-lg">Create New Task</h3>
                      <p className="text-gray-300 text-sm">Select a project to get started</p>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* Project Selection with Enhanced Design */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          Select Project *
                        </label>
                        <div className="relative">
                          <select
                            value={headerAddTaskData.projectId}
                            onChange={(e) => {
                              const projectId = e.target.value;
                              setHeaderAddTaskData(prev => ({
                                ...prev,
                                projectId: projectId,
                                workerId: '' // Reset worker when project changes
                              }));
                            }}
                            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all duration-300 appearance-none cursor-pointer"
                          >
                            <option value="">Choose a project...</option>
                            {projects.map(project => (
                              <option key={project.id} value={project.id}>
                                {project.title} ({project.task_count} tasks, {project.member_count} members)
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Project Info Display when selected */}
                        {headerAddTaskData.projectId && (
                          <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/50 mt-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-300">
                                Selected: <strong className="text-white">
                                  {projects.find(p => p.id === parseInt(headerAddTaskData.projectId))?.title}
                                </strong>
                              </span>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>👥 {getWorkersForProject(headerAddTaskData.projectId).length} available members</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            setShowHeaderAddTaskDropdown(false);
                            setHeaderAddTaskData({ projectId: '', workerId: '' });
                          }}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 border border-gray-600 hover:border-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!headerAddTaskData.projectId) {
                              toast.error('Please select a project first');
                              return;
                            }
                            setShowAddTaskModal(true);
                            setSelectedProject(projects.find(p => p.id === parseInt(headerAddTaskData.projectId)));
                            setShowHeaderAddTaskDropdown(false);
                          }}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                          disabled={!headerAddTaskData.projectId}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>Continue to Task Details</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Header Add Member Button with Dropdown */}
              <div className="relative header-add-member-dropdown">
                <button
                  onClick={() => setShowHeaderAddMemberDropdown(!showHeaderAddMemberDropdown)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <span>+</span>
                  Add Member
                </button>
                
                {/* Dropdown Menu for Header Add Member */}
                {showHeaderAddMemberDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                      <h3 className="font-semibold text-white">Add Member to Project</h3>
                      <p className="text-gray-300 text-sm">Select project and team member</p>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* Project Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Select Project *
                        </label>
                        <select
                          value={headerAddMemberData.projectId}
                          onChange={(e) => setHeaderAddMemberData(prev => ({
                            ...prev,
                            projectId: e.target.value
                          }))}
                          className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                        >
                          <option value="">Choose a project...</option>
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Worker Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Team Member *
                        </label>
                        <select
                          value={headerAddMemberData.workerId}
                          onChange={(e) => setHeaderAddMemberData(prev => ({
                            ...prev,
                            workerId: e.target.value
                          }))}
                          className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                        >
                          <option value="">Choose a team member...</option>
                          {workers.map(worker => (
                            <option key={worker.id} value={worker.id}>
                              {worker.username} ({worker.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            setShowHeaderAddMemberDropdown(false);
                            setHeaderAddMemberData({ projectId: '', workerId: '' });
                          }}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleHeaderAddMember}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!headerAddMemberData.projectId || !headerAddMemberData.workerId}
                        >
                          Add Member
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <span>+</span>
                Create Project
              </button>
            </div>
          </div>

          {/* Projects Overview Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Projects Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          project.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          project.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          'bg-gray-500/20 text-gray-300 border-gray-500/30'
                        }`}>
                          {project.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-4">
                      <span>👥 {project.member_count} members</span>
                      <span>📋 {project.task_count} tasks</span>
                    </div>
                    {project.team_leader_name && (
                      <span className="text-yellow-400">👑 {project.team_leader_name}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Project Card Add Member Button */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => setShowProjectCardAddMemberDropdown(prev => ({ 
                          ...prev, 
                          [project.id]: !prev[project.id] 
                        }))}
                        className="w-full bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg py-2 px-3 text-sm hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>+</span>
                        Add Member
                      </button>
                      
                      {/* Dropdown Menu for Project Card Add Member */}
                      {showProjectCardAddMemberDropdown[project.id] && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-40">
                          <div className="p-3 border-b border-gray-700/50">
                            <h4 className="font-semibold text-white text-sm">Add Member to {project.title}</h4>
                          </div>
                          
                          <div className="p-3 space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-300 mb-1">
                                Team Member *
                              </label>
                              <select
                                value={projectCardAddMemberData.workerId || ''}
                                onChange={(e) => setProjectCardAddMemberData({ 
                                  projectId: project.id, 
                                  workerId: e.target.value 
                                })}
                                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                              >
                                <option value="">Choose a team member...</option>
                                {workers.filter(worker => 
                                  !projectMembers[project.id]?.some(member => member.user_id === worker.id)
                                ).map(worker => (
                                  <option key={worker.id} value={worker.id}>
                                    {worker.username} ({worker.role})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setShowProjectCardAddMemberDropdown(prev => ({ ...prev, [project.id]: false }));
                                  setProjectCardAddMemberData({ projectId: '', workerId: '' });
                                }}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleProjectCardAddMember(project.id)}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-2 rounded text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!projectCardAddMemberData.workerId}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Project Card Add Task Button */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowAddTaskModal(true);
                        }}
                        className="w-full bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg py-2 px-3 text-sm hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>+</span>
                        Add Task
                      </button>
                    </div>

                    {/* Manage Team Button */}
                    <button
                      onClick={() => handleShowMembers(project)}
                      className="w-full bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg py-2 px-3 text-sm hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
                      title="Manage Team Members"
                    >
                      <span>👥</span>
                      Manage Team
                    </button>

                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Delete Project"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {projects.length === 0 && (
              <div className="text-center py-12 text-gray-400 border border-dashed border-gray-600 rounded-2xl">
                <div className="text-6xl mb-4">🏗️</div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p>Create your first project to get started</p>
              </div>
            )}
          </section>

          {/* Task Management Section */}
          <section>
            <TaskManagementSection 
              tasks={tasks}
              workers={workers}
              projects={projects}
              projectMembers={projectMembers}
              onTaskAction={handleTaskAction}
              onRejectTask={(taskId, currentStatus) => {
                setSelectedTaskForReject({ taskId, currentStatus });
                setShowRejectModal(true);
              }}
            />
          </section>
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal
          workers={workers}
          currentUser={currentUser}
          onSubmit={handleCreateProject}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showAddTaskModal && (
        <AddTaskModal
          projectId={selectedProject?.id}
          workers={selectedProject ? getWorkersForProject(selectedProject.id) : []}
          currentUser={currentUser}
          onSubmit={selectedProject ? handleProjectCardAddTask : handleHeaderAddTask}
          onClose={() => {
            setShowAddTaskModal(false);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Reject Task Modal */}
      {showRejectModal && (
        <RejectTaskModal
          taskId={selectedTaskForReject?.taskId}
          currentStatus={selectedTaskForReject?.currentStatus}
          onSubmit={handleTaskReject}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedTaskForReject(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <DeleteConfirmationModal
          item={itemToDelete}
          onConfirm={() => {
            if (itemToDelete.type === 'project') {
              handleConfirmProjectDelete(itemToDelete.id);
            } else if (itemToDelete.type === 'task') {
              handleConfirmTaskDelete(itemToDelete.id);
            }
          }}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
        />
      )}

      {/* Project Members Modal */}
      {showMembersModal && selectedProjectForMembers && (
        <ProjectMembersModal
          project={selectedProjectForMembers}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedProjectForMembers(null);
          }}
          onMembersUpdated={handleMembersUpdated}
        />
      )}
    </div>
  );
}

export default ProjectManagement;