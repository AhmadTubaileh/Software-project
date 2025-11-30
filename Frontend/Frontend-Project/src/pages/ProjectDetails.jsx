import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import ProjectTasks from '../components/ProjectManagement/ProjectTasks.jsx';
import ProjectMembers from '../components/ProjectManagement/ProjectMembers.jsx';
import ProjectChat from '../components/ProjectManagement/ProjectChat.jsx';
import ReadyTasksSection from '../components/ProjectManagement/ReadyTasksSection.jsx';
import AddTaskModal from '../components/ProjectManagement/AddTaskModal.jsx';
import AddMemberModal from '../components/ProjectManagement/AddMemberModal.jsx';
import RejectTaskModal from '../components/ProjectManagement/RejectTaskModal.jsx'; // Import the reject modal

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false); // Add reject modal state
  const [selectedTaskForReject, setSelectedTaskForReject] = useState(null); // Add selected task for rejection
  const [workers, setWorkers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useLocalSession();

  // Fetch project details
  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch project');
      }
      
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      navigate('/project-management');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

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
    }
  }, []);

  // Fetch project members
  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}/members`);
      const data = await response.json();
      
      if (response.ok) {
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [id]);

  // Refresh all data when project changes
  const refreshProjectData = useCallback(async () => {
    await Promise.all([fetchProject(), fetchMembers()]);
  }, [fetchProject, fetchMembers]);

  useEffect(() => {
    fetchProject();
    fetchWorkers();
    fetchMembers();
  }, [fetchProject, fetchWorkers, fetchMembers]);

  // Check if user can manage tasks (admin, project creator, or team leader)
  const canManageTasks = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.id === project?.created_by ||
    currentUser.id === project?.team_leader_id
  );

  // Check if user can manage members (admin, project creator, or team leader)
  const canManageMembers = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.id === project?.created_by ||
    currentUser.id === project?.team_leader_id
  );

  // Check if user can see ready tasks (admin, project creator, or team leader)
  const canSeeReadyTasks = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.id === project?.created_by ||
    currentUser.id === project?.team_leader_id
  );

  // Get team leaders from members
  const teamLeaders = members.filter(member => member.role === 'team_leader');

  // Create new task
  const handleAddTask = async (taskData) => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          project_id: parseInt(id),
          assigned_by: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      toast.success('Task created successfully!');
      setShowAddTask(false);
      // Refresh tasks in the tasks tab
      refreshProjectData();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to create task');
    }
  };

  // Add member to project
  const handleAddMember = async (memberData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      toast.success('Member added successfully!');
      setShowAddMember(false);
      refreshProjectData(); // Refresh members list and project data
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  // Update project status
  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project');
      }

      toast.success('Project status updated!');
      setProject(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'Failed to update project');
    }
  };

  // Handle member role change
  const handleMemberRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member role');
      }

      toast.success('Member role updated successfully!');
      
      // If the role change involves team leader, update the project data
      if (newRole === 'team_leader') {
        // Update project with new team leader
        await fetch(`http://localhost:5000/api/projects/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ team_leader_id: userId }),
        });
      } else if (members.find(member => member.user_id === userId)?.role === 'team_leader') {
        // If removing team leader role, clear team_leader_id
        await fetch(`http://localhost:5000/api/projects/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ team_leader_id: null }),
        });
      }

      // Refresh all data to reflect changes
      await refreshProjectData();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error(error.message || 'Failed to update member role');
    }
  };

  // Handle member removal
  const handleMemberRemoved = async (userId) => {
    try {
      // Check if removed member was the team leader
      const removedMember = members.find(member => member.user_id === userId);
      if (removedMember?.role === 'team_leader') {
        // Clear team leader from project
        await fetch(`http://localhost:5000/api/projects/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ team_leader_id: null }),
        });
      }

      // Refresh all data
      await refreshProjectData();
      toast.success('Member removed successfully!');
    } catch (error) {
      console.error('Error handling member removal:', error);
      toast.error('Failed to update project after member removal');
    }
  };

  // NEW: Handle task rejection from Ready Tasks section
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
      
      // Refresh the ready tasks section
      if (activeTab === 'ready_tasks') {
        // You might want to trigger a refresh in ReadyTasksSection component
        // For now, we'll refresh the project data
        refreshProjectData();
      }
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast.error(error.message || 'Failed to reject task');
    }
  };

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

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        <Toaster position="top-center" />
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}
        <main className={`flex-1 min-h-screen transition-all duration-300 ${
          currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
        }`}>
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
            <p className="text-gray-400 mb-4">The project you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/project-management')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Define tabs based on user permissions
  const baseTabs = [
    { id: 'tasks', label: 'Tasks', emoji: '📋' },
    { id: 'members', label: 'Team Members', emoji: '👥' },
    { id: 'chat', label: 'Chat', emoji: '💬' },
    { id: 'info', label: 'Project Info', emoji: 'ℹ️' }
  ];

  // Add ready tasks tab if user has permission
  const tabs = canSeeReadyTasks 
    ? [...baseTabs, { id: 'ready_tasks', label: 'Ready for Review', emoji: '📝' }]
    : baseTabs;

  const statusStyles = {
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    archived: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
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
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[project.status]}`}>
                  {project.status.toUpperCase()}
                </span>
                <span className="text-gray-400 text-sm">
                  Created by {project.created_by_name}
                </span>
                {teamLeaders.length > 0 && (
                  <span className="text-gray-400 text-sm">
                    • {teamLeaders.length} Team Leader{teamLeaders.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-gray-400 max-w-3xl">
                  {project.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Show Add Task button only for users with permission */}
              {activeTab === 'tasks' && canManageTasks && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  + Add Task
                </button>
              )}
              {/* Show Add Member button only for users with permission */}
              {activeTab === 'members' && canManageMembers && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  + Add Member
                </button>
              )}
              <button
                onClick={() => navigate('/project-management')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700/50 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-300 bg-blue-500/10'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <span>{tab.emoji}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'tasks' && (
              <ProjectTasks projectId={id} />
            )}
            
            {activeTab === 'members' && (
              <ProjectMembers 
                projectId={id} 
                onMemberRemoved={handleMemberRemoved}
                onMemberRoleChange={handleMemberRoleChange}
                currentUser={currentUser}
              />
            )}
            
            {activeTab === 'chat' && (
              <ProjectChat projectId={id} />
            )}
            
            {activeTab === 'ready_tasks' && canSeeReadyTasks && (
              <ReadyTasksSection 
                projectId={id}
                currentUser={currentUser}
                onTaskAction={(action, taskId, data) => {
                  // Handle task actions (approve/reject)
                  if (action === 'reject') {
                    // Use the reject modal instead of browser prompt
                    setSelectedTaskForReject({ taskId, currentStatus: data.currentStatus });
                    setShowRejectModal(true);
                  } else {
                    console.log('Task action:', action, taskId, data);
                  }
                }}
              />
            )}
            
            {activeTab === 'info' && (
              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                      <p className="text-white">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>
                    
                    {/* Team Leaders Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Team Leadership</h4>
                      {teamLeaders.length > 0 ? (
                        <div className="space-y-3">
                          {teamLeaders.map((leader) => (
                            <div key={leader.user_id} className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                                {leader.username?.charAt(0).toUpperCase() || 'L'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">{leader.username}</span>
                                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded text-xs font-medium">
                                    Team Leader
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm">{leader.email}</p>
                                <p className="text-gray-400 text-xs">Level {leader.user_type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 border border-dashed border-gray-600 rounded-lg">
                          <div className="text-2xl mb-2">👑</div>
                          <p className="text-sm">No team leaders assigned</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Team leaders can approve tasks and manage the project
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Project Status</h4>
                      {canManageTasks ? (
                        <select
                          value={project.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      ) : (
                        <p className="text-white capitalize">{project.status}</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Project Creator</h4>
                      <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                          {project.created_by_name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <span className="font-medium text-white">{project.created_by_name}</span>
                          <p className="text-gray-400 text-xs">Project Creator</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Created</h4>
                        <p className="text-white text-sm">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(project.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Last Updated</h4>
                        <p className="text-white text-sm">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(project.updated_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Team Summary */}
                    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Team Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{members.length}</div>
                          <div className="text-xs text-gray-400">Total Members</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-300">{teamLeaders.length}</div>
                          <div className="text-xs text-gray-400">Team Leaders</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Task Modal - Only show if user has permission */}
      {showAddTask && canManageTasks && (
        <AddTaskModal
          projectId={id}
          workers={workers.filter(worker => 
            members.some(member => member.user_id === worker.id) || 
            worker.id === project.team_leader_id
          )}
          currentUser={currentUser}
          onSubmit={handleAddTask}
          onClose={() => setShowAddTask(false)}
        />
      )}

      {/* Add Member Modal - Only show if user has permission */}
      {showAddMember && canManageMembers && (
        <AddMemberModal
          projectId={id}
          workers={workers.filter(worker => 
            !members.some(member => member.user_id === worker.id)
          )}
          currentUser={currentUser}
          onSubmit={handleAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {/* Reject Task Modal - Used in Ready Tasks section */}
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
    </div>
  );
}

export default ProjectDetails;