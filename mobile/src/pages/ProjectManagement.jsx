import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { apiClient } from '../shared/api/apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import MobileModal from '../components/MobileModal.jsx';
import './MobilePage.css';

function MobileProjectManagement() {
  const { currentUser } = useLocalSession();
  const navigate = useNavigate();
  
  // Access control
  const userType = currentUser?.user_type ?? 5;
  const allowedRoles = [0, 1, 2];
  const isAdmin = allowedRoles.includes(userType);
  
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projectMembers, setProjectMembers] = useState({});
  const [accessibleBranches, setAccessibleBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Selected items
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState(null);
  const [selectedTaskForReject, setSelectedTaskForReject] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Form data
  const [createProjectData, setCreateProjectData] = useState({
    title: '',
    description: '',
    team_leader_id: '',
    branch_id: ''
  });
  const [addTaskData, setAddTaskData] = useState({
    assigned_to: '',
    task: '',
    priority: 'medium',
    estimated_time_minutes: '',
    start_time: '',
    end_time: ''
  });
  const [addMemberData, setAddMemberData] = useState({
    user_id: '',
    role: 'member'
  });
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Load accessible branches
  useEffect(() => {
    const loadBranches = async () => {
      if (!currentUser?.id) return;
      
      try {
        const data = await apiClient.get(`/api/employees/branches/accessible?userId=${currentUser.id}`);
        setAccessibleBranches(data);
        setSelectedBranchId(null); // Default to "all"
      } catch (error) {
        console.error('Error loading branches:', error);
        toast.error('Failed to load branches');
      }
    };

    loadBranches();
  }, [currentUser]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      let url;
      if (isAdmin) {
        // Admins/Managers see all projects
        url = '/api/projects';
        if (selectedBranchId !== null) {
          url += `?branch_id=${selectedBranchId}`;
        }
      } else {
        // Normal workers see only their projects
        url = `/api/projects/user/${currentUser.id}`;
      }
      
      const data = await apiClient.get(url);
      setProjects(data.filter(p => !p.is_deleted));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  }, [selectedBranchId, isAdmin, currentUser]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/tasks');
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  // Fetch workers
  const fetchWorkers = useCallback(async () => {
    try {
      if (selectedBranchId === null && accessibleBranches.length > 0) {
        // Fetch from all accessible branches
        const branchIds = accessibleBranches.map(b => b.id);
        const allWorkers = [];
        
        for (const branchId of branchIds) {
          try {
            const data = await apiClient.get(`/api/tasks/workers?branch_id=${branchId}`);
            allWorkers.push(...data);
          } catch (error) {
            console.error(`Error fetching workers for branch ${branchId}:`, error);
          }
        }
        
        // Remove duplicates
        const uniqueWorkers = allWorkers.filter((worker, index, self) =>
          index === self.findIndex(w => w.id === worker.id)
        );
        setWorkers(uniqueWorkers);
      } else if (selectedBranchId !== null) {
        const data = await apiClient.get(`/api/tasks/workers?branch_id=${selectedBranchId}`);
        setWorkers(data);
      } else {
        setWorkers([]);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      setWorkers([]);
    }
  }, [selectedBranchId, accessibleBranches]);

  // Fetch project members
  const fetchProjectMembers = useCallback(async () => {
    try {
      const membersData = {};
      for (const project of projects) {
        try {
          const data = await apiClient.get(`/api/projects/${project.id}/members`);
          membersData[project.id] = data;
        } catch (error) {
          console.error(`Error fetching members for project ${project.id}:`, error);
        }
      }
      setProjectMembers(membersData);
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  }, [projects]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProjects(), fetchTasks(), fetchWorkers()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, fetchTasks, fetchWorkers]);

  // Get approved tasks from accessible branches
  const getApprovedTasks = useCallback(() => {
    if (!isAdmin) return [];
    
    // Get branch IDs the user has access to
    const accessibleBranchIds = accessibleBranches.map(b => b.id);
    
    // Filter tasks that are:
    // 1. Status is "approved"
    // 2. Belong to projects in accessible branches
    return tasks.filter(task => {
      if (task.status !== 'approved') return false;
      
      // Find the project for this task
      const project = projects.find(p => p.id === task.project_id);
      if (!project) return false;
      
      // Check if project's branch is accessible
      return accessibleBranchIds.includes(project.branch_id);
    });
  }, [tasks, projects, accessibleBranches, isAdmin]);

  // Handle approve task (complete it)
  const handleApproveTask = async (taskId) => {
    try {
      await apiClient.put(`/api/tasks/${taskId}/status`, {
        status: 'completed',
        user_id: currentUser.id
      });
      toast.success('Task completed successfully!');
      refreshAllData();
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error(error.message || 'Failed to complete task');
    }
  };

  // Handle reject task
  const handleTaskReject = async () => {
    if (!selectedTaskForReject || !rejectionNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }

    try {
      // Remove associated files
      try {
        const files = await apiClient.get(`/api/tasks/${selectedTaskForReject.taskId}/files`);
        for (const file of files) {
          await apiClient.delete(`/api/tasks/${selectedTaskForReject.taskId}/files/${file.id}`);
        }
      } catch (error) {
        console.error('Error deleting files:', error);
      }

      // Reject task - change status back to ready_for_review
      await apiClient.put(`/api/tasks/${selectedTaskForReject.taskId}/status`, {
        status: 'ready_for_review',
        user_id: currentUser.id
      });

      // Add rejection notes
      await apiClient.put(`/api/tasks/${selectedTaskForReject.taskId}/reject-task`, {
        notes: rejectionNotes.trim(),
        rejected_by_id: currentUser.id
      });

      toast.success('Task rejected successfully!');
      setShowRejectModal(false);
      setSelectedTaskForReject(null);
      setRejectionNotes('');
      refreshAllData();
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast.error(error.message || 'Failed to reject task');
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      refreshAllData();
    }
  }, [currentUser, selectedBranchId, refreshAllData]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchProjectMembers();
    }
  }, [projects, fetchProjectMembers]);

  // Create project
  const handleCreateProject = async () => {
    const branchIdForProject = createProjectData.branch_id || selectedBranchId;
    
    if (!branchIdForProject) {
      toast.error('Please select a branch for the project');
      return;
    }

    if (!createProjectData.title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    try {
      const response = await apiClient.post('/api/projects', {
        ...createProjectData,
        created_by: currentUser.id,
        branch_id: parseInt(branchIdForProject)
      });

      // If team leader is assigned, add them as member
      if (createProjectData.team_leader_id) {
        await apiClient.post(`/api/projects/${response.projectId}/members`, {
          user_id: parseInt(createProjectData.team_leader_id),
          role: 'team_leader'
        });
      }

      toast.success('Project created successfully!');
      setShowCreateModal(false);
      setCreateProjectData({ title: '', description: '', team_leader_id: '', branch_id: '' });
      refreshAllData();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    }
  };

  // Add task
  const handleAddTask = async () => {
    if (!selectedProject?.id) {
      toast.error('Please select a project');
      return;
    }

    if (!addTaskData.assigned_to || !addTaskData.task.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await apiClient.post('/api/tasks', {
        ...addTaskData,
        project_id: parseInt(selectedProject.id),
        assigned_by: currentUser.id,
        estimated_time_minutes: addTaskData.estimated_time_minutes || null
      });

      toast.success('Task created successfully!');
      setShowAddTaskModal(false);
      setAddTaskData({ assigned_to: '', task: '', priority: 'medium', estimated_time_minutes: '', start_time: '', end_time: '' });
      setSelectedProject(null);
      refreshAllData();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to create task');
    }
  };

  // Add member
  const handleAddMember = async () => {
    if (!selectedProject?.id) {
      toast.error('Please select a project');
      return;
    }

    if (!addMemberData.user_id) {
      toast.error('Please select a team member');
      return;
    }

    try {
      await apiClient.post(`/api/projects/${selectedProject.id}/members`, {
        ...addMemberData,
        user_id: parseInt(addMemberData.user_id)
      });

      toast.success('Member added successfully!');
      setShowAddMemberModal(false);
      setAddMemberData({ user_id: '', role: 'member' });
      refreshAllData();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  // Delete project
  const handleDeleteProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

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
        memberCount: project.member_count || 0,
        taskCount: project.task_count || 0
      }
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'project') {
        // Archive non-completed tasks
        await apiClient.put(`/api/tasks/project/${itemToDelete.id}/archive-non-completed`);
        
        // Soft delete project
        await apiClient.put(`/api/projects/${itemToDelete.id}`, {
          is_deleted: 1
        });

        toast.success('Project deleted successfully!');
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      refreshAllData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete');
    }
  };

  // Get workers for a project
  const getWorkersForProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];
    
    return workers.filter(worker => 
      worker.primary_branch_id === project.branch_id &&
      projectMembers[projectId]?.some(member => member.user_id === worker.id)
    );
  };

  // Get available workers for a project (not already members)
  const getAvailableWorkersForProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];
    
    return workers.filter(worker => 
      worker.primary_branch_id === project.branch_id &&
      !projectMembers[projectId]?.some(member => member.user_id === worker.id)
    );
  };


  if (loading) {
    return (
      <div className="mobile-page">
        <div className="mobile-page-content">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page">
      <Toaster position="top-center" />
      <div className="mobile-page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mobile-page-title">Projects</h1>
            <p className="text-sm text-gray-400 mt-1">
              {currentUser?.username} ({getRoleName(userType)})
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mobile-button mobile-button-primary"
              style={{ padding: '10px 16px', fontSize: '14px' }}
            >
              + Create
            </button>
          )}
        </div>

        {/* Branch Filter - Only for admins */}
        {isAdmin && accessibleBranches.length > 0 && (
          <div className="mt-3">
            <select
              value={selectedBranchId !== null ? selectedBranchId : 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedBranchId(value === 'all' ? null : parseInt(value));
              }}
              className="mobile-input"
            >
              <option value="all">All Branches</option>
              {accessibleBranches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="mobile-page-content">
        {projects.length === 0 ? (
          <div className="mobile-empty-state">
            <div className="text-6xl mb-4">🏗️</div>
            <div className="text-gray-400">
              {isAdmin ? 'No projects yet' : 'You are not a member of any projects'}
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mobile-button mobile-button-primary mt-4"
              >
                Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className="mobile-task-list">
            {projects.map(project => (
              <div key={project.id} className="mobile-card">
                <div className="mobile-task-header">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`mobile-task-status mobile-task-status-${project.status}`}>
                        {project.status}
                      </span>
                      {project.branch_name && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          🏢 {project.branch_name}
                        </span>
                      )}
                    </div>
                    <h3 className="mobile-task-title">{project.title}</h3>
                    {project.description && (
                      <p className="mobile-task-meta mt-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mobile-task-meta" style={{ marginTop: '8px', marginBottom: '12px' }}>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span>👥 {project.member_count || 0} members</span>
                    <span>📋 {project.task_count || 0} tasks</span>
                    {project.team_leader_name && (
                      <span>👑 {project.team_leader_name}</span>
                    )}
                  </div>
                </div>

                <div className="mobile-task-actions">
                  <button
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="mobile-button mobile-button-primary flex-1"
                  >
                    View Details
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowAddTaskModal(true);
                        }}
                        className="mobile-button mobile-button-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        + Task
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowAddMemberModal(true);
                        }}
                        className="mobile-button mobile-button-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        + Member
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-3 py-2 bg-red-500/20 text-red-300 rounded text-xs"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approved Tasks Section - Only for Admin/Manager */}
        {isAdmin && (
          <div style={{ marginTop: '32px' }}>
            <h2 className="mobile-page-title" style={{ marginBottom: '16px', fontSize: '20px' }}>
              Approved Tasks
            </h2>
            {getApprovedTasks().length === 0 ? (
              <div className="mobile-empty-state">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-gray-400">No approved tasks pending completion</div>
              </div>
            ) : (
              <div className="mobile-task-list">
                {getApprovedTasks().map(task => {
                  const project = projects.find(p => p.id === task.project_id);
                  return (
                    <div key={task.id} className="mobile-card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                      <div className="mobile-task-header">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="mobile-task-status" style={{ 
                              background: 'rgba(34, 197, 94, 0.2)', 
                              color: '#4ade80',
                              border: '1px solid rgba(34, 197, 94, 0.3)'
                            }}>
                              ✅ Approved
                            </span>
                            {project && (
                              <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                📁 {project.title}
                              </span>
                            )}
                            {task.priority && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                task.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                                task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                task.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          <h3 className="mobile-task-title">{task.task}</h3>
                          <div className="mobile-task-meta" style={{ marginTop: '8px' }}>
                            <div className="flex flex-wrap gap-3 text-xs">
                              {task.assigned_to_name && (
                                <span>👤 {task.assigned_to_name}</span>
                              )}
                              {task.assigned_by_name && (
                                <span>📝 By: {task.assigned_by_name}</span>
                              )}
                              {task.estimated_time_minutes && (
                                <span>⏱️ Est: {Math.floor(task.estimated_time_minutes / 60)}h {task.estimated_time_minutes % 60}m</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Task Files */}
                      <TaskFiles taskId={task.id} />

                      <div className="mobile-task-actions" style={{ marginTop: '12px' }}>
                        <button
                          onClick={() => handleApproveTask(task.id)}
                          className="mobile-button flex-1"
                          style={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', 
                            color: 'white' 
                          }}
                        >
                          ✅ Complete Task
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTaskForReject({ taskId: task.id, currentStatus: 'approved' });
                            setShowRejectModal(true);
                          }}
                          className="mobile-button flex-1"
                          style={{ 
                            background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', 
                            color: 'white' 
                          }}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <MobileModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateProjectData({ title: '', description: '', team_leader_id: '', branch_id: '' });
        }}
        title="Create New Project"
      >
        <div className="space-y-4">
          {accessibleBranches.length > 0 && selectedBranchId === null && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Branch *</label>
              <select
                value={createProjectData.branch_id}
                onChange={(e) => {
                  // Reset team leader when branch changes
                  setCreateProjectData({ 
                    ...createProjectData, 
                    branch_id: e.target.value,
                    team_leader_id: '' 
                  });
                }}
                className="mobile-input"
                required
              >
                <option value="">Choose a branch...</option>
                {accessibleBranches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Project Title *</label>
            <input
              type="text"
              value={createProjectData.title}
              onChange={(e) => setCreateProjectData({ ...createProjectData, title: e.target.value })}
              className="mobile-input"
              placeholder="Enter project title..."
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea
              value={createProjectData.description}
              onChange={(e) => setCreateProjectData({ ...createProjectData, description: e.target.value })}
              className="mobile-input"
              placeholder="Enter project description..."
              rows="3"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Team Leader (Optional)</label>
            <select
              value={createProjectData.team_leader_id}
              onChange={(e) => setCreateProjectData({ ...createProjectData, team_leader_id: e.target.value })}
              className="mobile-input"
            >
              <option value="">No team leader</option>
              {(() => {
                // Get the branch_id to filter by (either from form or selectedBranchId)
                const branchIdToFilter = createProjectData.branch_id || selectedBranchId;
                
                // Filter workers by the selected branch
                const filteredWorkers = branchIdToFilter 
                  ? workers.filter(worker => worker.primary_branch_id === parseInt(branchIdToFilter))
                  : workers;
                
                return filteredWorkers.map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.username}</option>
                ));
              })()}
            </select>
            {createProjectData.branch_id && (
              <p className="text-xs text-gray-400 mt-1">
                Showing workers from selected branch only
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setCreateProjectData({ title: '', description: '', team_leader_id: '', branch_id: '' });
              }}
              className="mobile-button mobile-button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProject}
              className="mobile-button mobile-button-primary flex-1"
            >
              Create Project
            </button>
          </div>
        </div>
      </MobileModal>

      {/* Add Task Modal */}
      <MobileModal
        isOpen={showAddTaskModal}
        onClose={() => {
          setShowAddTaskModal(false);
          setSelectedProject(null);
          setAddTaskData({ assigned_to: '', task: '', priority: 'medium', estimated_time_minutes: '', start_time: '', end_time: '' });
        }}
        title={selectedProject ? `Add Task to ${selectedProject.title}` : 'Add Task'}
      >
        {selectedProject && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Assign To *</label>
              <select
                value={addTaskData.assigned_to}
                onChange={(e) => setAddTaskData({ ...addTaskData, assigned_to: e.target.value })}
                className="mobile-input"
                required
              >
                <option value="">Choose a team member...</option>
                {getWorkersForProject(selectedProject.id).map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.username}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Task Description *</label>
              <textarea
                value={addTaskData.task}
                onChange={(e) => setAddTaskData({ ...addTaskData, task: e.target.value })}
                className="mobile-input"
                placeholder="Enter task description..."
                rows="3"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Priority</label>
              <select
                value={addTaskData.priority}
                onChange={(e) => setAddTaskData({ ...addTaskData, priority: e.target.value })}
                className="mobile-input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Estimated Time (minutes)</label>
              <input
                type="number"
                value={addTaskData.estimated_time_minutes}
                onChange={(e) => setAddTaskData({ ...addTaskData, estimated_time_minutes: e.target.value })}
                className="mobile-input"
                placeholder="e.g., 120"
                min="0"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAddTaskModal(false);
                  setSelectedProject(null);
                  setAddTaskData({ assigned_to: '', task: '', priority: 'medium', estimated_time_minutes: '', start_time: '', end_time: '' });
                }}
                className="mobile-button mobile-button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="mobile-button mobile-button-primary flex-1"
              >
                Create Task
              </button>
            </div>
          </div>
        )}
      </MobileModal>

      {/* Add Member Modal */}
      <MobileModal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setSelectedProject(null);
          setAddMemberData({ user_id: '', role: 'member' });
        }}
        title={selectedProject ? `Add Member to ${selectedProject.title}` : 'Add Member'}
      >
        {selectedProject && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Team Member *</label>
              <select
                value={addMemberData.user_id}
                onChange={(e) => setAddMemberData({ ...addMemberData, user_id: e.target.value })}
                className="mobile-input"
                required
              >
                <option value="">Choose a team member...</option>
                {getAvailableWorkersForProject(selectedProject.id).map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.username}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Role</label>
              <select
                value={addMemberData.role}
                onChange={(e) => setAddMemberData({ ...addMemberData, role: e.target.value })}
                className="mobile-input"
              >
                <option value="member">Team Member</option>
                <option value="team_leader">Team Leader</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedProject(null);
                  setAddMemberData({ user_id: '', role: 'member' });
                }}
                className="mobile-button mobile-button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="mobile-button mobile-button-primary flex-1"
              >
                Add Member
              </button>
            </div>
          </div>
        )}
      </MobileModal>

      {/* Delete Confirmation Modal */}
      <MobileModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        title={itemToDelete?.type === 'project' ? 'Delete Project' : 'Delete Task'}
      >
        {itemToDelete && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-200 text-sm">
                Are you sure you want to delete "{itemToDelete.name}"?
              </p>
            </div>

            {itemToDelete.type === 'project' && (
              <div className="bg-gray-700/30 rounded-lg p-3">
                <div className="text-xs text-gray-300 space-y-1">
                  <div>📋 {itemToDelete.details.taskCount} total tasks</div>
                  <div>👥 {itemToDelete.details.memberCount} members</div>
                  <div>📁 {itemToDelete.details.nonCompletedTasks} tasks will be archived</div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="mobile-button mobile-button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="mobile-button flex-1"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', color: 'white' }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </MobileModal>

      {/* Reject Task Modal */}
      <MobileModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedTaskForReject(null);
          setRejectionNotes('');
        }}
        title="Reject Task"
        size="large"
      >
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-200 text-sm">
              Please provide detailed feedback on what needs to be improved. The task will be sent back to "Ready for Review" status.
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Rejection Reason *</label>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              className="mobile-input"
              placeholder="Provide detailed feedback..."
              rows="4"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setSelectedTaskForReject(null);
                setRejectionNotes('');
              }}
              className="mobile-button mobile-button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleTaskReject}
              className="mobile-button flex-1"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', color: 'white' }}
            >
              Reject Task
            </button>
          </div>
        </div>
      </MobileModal>
    </div>
  );
}

// Task Files Component
function TaskFiles({ taskId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [taskId]);

  const fetchFiles = async () => {
    try {
      const data = await apiClient.get(`/api/tasks/${taskId}/files`);
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || files.length === 0) return null;

  return (
    <div className="bg-gray-700/30 rounded-lg p-2 mt-2">
      <div className="text-xs text-gray-400 mb-1">📎 Files ({files.length})</div>
      <div className="space-y-1">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-300 truncate flex-1">{file.file_name}</span>
            <a
              href={`http://localhost:5000${file.file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 ml-2"
            >
              Open
            </a>
          </div>
        ))}
      </div>
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

export default MobileProjectManagement;

