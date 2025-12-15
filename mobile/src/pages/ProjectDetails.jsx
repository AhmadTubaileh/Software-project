import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { apiClient } from '../shared/api/apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import MobileModal from '../components/MobileModal.jsx';
import './MobilePage.css';

function MobileProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useLocalSession();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [readyTasks, setReadyTasks] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Form data
  const [addTaskData, setAddTaskData] = useState({
    assigned_to: '',
    task: '',
    priority: 'medium',
    estimated_time_minutes: ''
  });
  const [addMemberData, setAddMemberData] = useState({
    user_id: '',
    role: 'member'
  });
  const [selectedTaskForReject, setSelectedTaskForReject] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');

  // Fetch project
  const fetchProject = useCallback(async () => {
    try {
      const data = await apiClient.get(`/api/projects/${id}`);
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
    if (!project?.branch_id) return;
    
    try {
      const data = await apiClient.get(`/api/tasks/workers?branch_id=${project.branch_id}`);
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  }, [project?.branch_id]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const data = await apiClient.get(`/api/tasks/project/${id}`);
      setTasks(data.filter(t => !t.is_deleted));
      // Filter ready tasks
      setReadyTasks(data.filter(t => t.status === 'ready_for_review' && !t.is_deleted));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [id]);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      const data = await apiClient.get(`/api/projects/${id}/members`);
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [id]);

  // Fetch chat messages
  const fetchChatMessages = useCallback(async () => {
    try {
      const data = await apiClient.get(`/api/chats/project/${id}`);
      setChatMessages(data);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  }, [id]);

  // Refresh all data
  const refreshProjectData = useCallback(async () => {
    await Promise.all([fetchProject(), fetchMembers(), fetchTasks()]);
  }, [fetchProject, fetchMembers, fetchTasks]);

  useEffect(() => {
    fetchProject();
    fetchMembers();
    fetchTasks();
  }, [fetchProject, fetchMembers, fetchTasks]);

  useEffect(() => {
    if (project?.branch_id) {
      fetchWorkers();
    }
  }, [project?.branch_id, fetchWorkers]);

  // Poll chat messages
  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchChatMessages]);

  // Check permissions
  const userType = currentUser?.user_type ?? 5;
  const allowedRoles = [0, 1, 2];
  const isAdmin = allowedRoles.includes(userType);
  
  const canManageTasks = currentUser && (
    isAdmin || 
    currentUser.id === project?.created_by ||
    currentUser.id === project?.team_leader_id
  );

  const canManageMembers = currentUser && (
    isAdmin || 
    currentUser.id === project?.created_by ||
    currentUser.id === project?.team_leader_id
  );

  const canSeeReadyTasks = currentUser && (
    isAdmin || 
    currentUser.id === project?.created_by ||
    currentUser.id === project?.team_leader_id
  );
  
  // Check if user is a project member (for viewing access)
  const isProjectMember = currentUser && project && members.some(m => m.user_id === currentUser.id);

  // Add task
  const handleAddTask = async () => {
    if (!addTaskData.assigned_to || !addTaskData.task.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await apiClient.post('/api/tasks', {
        ...addTaskData,
        project_id: parseInt(id),
        assigned_by: currentUser.id,
        estimated_time_minutes: addTaskData.estimated_time_minutes || null
      });

      toast.success('Task created successfully!');
      setShowAddTask(false);
      setAddTaskData({ assigned_to: '', task: '', priority: 'medium', estimated_time_minutes: '' });
      refreshProjectData();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to create task');
    }
  };

  // Add member
  const handleAddMember = async () => {
    if (!addMemberData.user_id) {
      toast.error('Please select a team member');
      return;
    }

    try {
      await apiClient.post(`/api/projects/${id}/members`, {
        ...addMemberData,
        user_id: parseInt(addMemberData.user_id)
      });

      toast.success('Member added successfully!');
      setShowAddMember(false);
      setAddMemberData({ user_id: '', role: 'member' });
      refreshProjectData();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  // Update project status
  const handleStatusChange = async (newStatus) => {
    try {
      await apiClient.put(`/api/projects/${id}`, { status: newStatus });
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
      await apiClient.put(`/api/projects/${id}/members/${userId}/role`, { role: newRole });
      
      // Update project team_leader_id if needed
      if (newRole === 'team_leader') {
        await apiClient.put(`/api/projects/${id}`, { team_leader_id: userId });
      } else if (members.find(m => m.user_id === userId)?.role === 'team_leader') {
        await apiClient.put(`/api/projects/${id}`, { team_leader_id: null });
      }

      toast.success('Member role updated successfully!');
      refreshProjectData();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error(error.message || 'Failed to update member role');
    }
  };

  // Handle member removal
  const handleMemberRemoved = async (userId) => {
    try {
      const removedMember = members.find(m => m.user_id === userId);
      if (removedMember?.role === 'team_leader') {
        await apiClient.put(`/api/projects/${id}`, { team_leader_id: null });
      }

      refreshProjectData();
      toast.success('Member removed successfully!');
    } catch (error) {
      console.error('Error handling member removal:', error);
      toast.error('Failed to update project after member removal');
    }
  };

  // Approve task
  const handleApproveTask = async (taskId) => {
    try {
      await apiClient.put(`/api/tasks/${taskId}/approve`, {
        approved_by: currentUser.id,
        role: currentUser.role
      });
      toast.success('Task approved successfully!');
      refreshProjectData();
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error(error.message || 'Failed to approve task');
    }
  };

  // Reject task
  const handleTaskReject = async () => {
    if (!selectedTaskForReject || !rejectionNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }

    try {
      // Delete associated files
      try {
        const files = await apiClient.get(`/api/tasks/${selectedTaskForReject.taskId}/files`);
        for (const file of files) {
          await apiClient.delete(`/api/tasks/${selectedTaskForReject.taskId}/files/${file.id}`);
        }
      } catch (error) {
        console.error('Error deleting files:', error);
      }

      // Reject task
      await apiClient.put(`/api/tasks/${selectedTaskForReject.taskId}/reject-task`, {
        notes: rejectionNotes.trim(),
        rejected_by_id: currentUser.id
      });

      toast.success('Task rejected successfully!');
      setShowRejectModal(false);
      setSelectedTaskForReject(null);
      setRejectionNotes('');
      refreshProjectData();
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast.error(error.message || 'Failed to reject task');
    }
  };

  // Send chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !currentUser) return;

    try {
      await apiClient.post(`/api/chats/project/${id}`, {
        user_id: currentUser.id,
        message: newChatMessage.trim()
      });
      setNewChatMessage('');
      fetchChatMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Get available workers for adding member
  // Members can only be added if they:
  // 1. Are in the same branch as the project (primary_branch_id matches project.branch_id)
  // 2. Are NOT already members of the project
  const getAvailableWorkers = () => {
    if (!project) return [];
    return workers.filter(worker => 
      worker.primary_branch_id === project.branch_id &&
      !members.some(member => member.user_id === worker.id)
    );
  };

  // Get workers who are project members (for task assignment)
  // Tasks can only be assigned to workers who:
  // 1. Are in the same branch as the project
  // 2. Are already members of the project
  const getProjectMemberWorkers = () => {
    if (!project) return [];
    return workers.filter(worker => 
      worker.primary_branch_id === project.branch_id &&
      members.some(member => member.user_id === worker.id)
    );
  };

  const teamLeaders = members.filter(member => member.role === 'team_leader');

  // Define tabs
  const baseTabs = [
    { id: 'tasks', label: 'Tasks', emoji: '📋' },
    { id: 'members', label: 'Team', emoji: '👥' },
    { id: 'chat', label: 'Chat', emoji: '💬' },
    { id: 'info', label: 'Info', emoji: 'ℹ️' }
  ];

  const tabs = canSeeReadyTasks 
    ? [...baseTabs, { id: 'ready_tasks', label: 'Review', emoji: '📝' }]
    : baseTabs;

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

  if (!project) {
    return (
      <div className="mobile-page">
        <div className="mobile-page-content">
          <div className="mobile-empty-state">
            <div className="text-6xl mb-4">❌</div>
            <div className="text-gray-400">Project not found</div>
            <button
              onClick={() => navigate('/project-management')}
              className="mobile-button mobile-button-primary mt-4"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check access for normal workers - they must be project members
  // Only check if members have been loaded (members.length > 0 means fetch completed)
  if (!isAdmin && !isProjectMember && members.length > 0) {
    return (
      <div className="mobile-page">
        <div className="mobile-page-content">
          <div className="mobile-empty-state">
            <div className="text-6xl mb-4">🚫</div>
            <div className="text-gray-400">You don't have access to this project</div>
            <button
              onClick={() => navigate('/project-management')}
              className="mobile-button mobile-button-primary mt-4"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page">
      <Toaster position="top-center" />
      <div className="mobile-page-header">
        <button
          onClick={() => navigate('/project-management')}
          className="mobile-button mobile-button-secondary mb-2"
          style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
        >
          ← Back
        </button>
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
        <h1 className="mobile-page-title">{project.title}</h1>
        {project.description && (
          <p className="text-sm text-gray-400 mt-2">{project.description}</p>
        )}
      </div>
      
      <div className="mobile-page-content">
        {/* Tabs */}
        <div className="mobile-filter-tabs" style={{ marginBottom: '16px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mobile-filter-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span>{tab.emoji}</span>
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' && (
          <div>
            {canManageTasks && (
              <button
                onClick={() => setShowAddTask(true)}
                className="mobile-button mobile-button-primary mb-4"
                style={{ width: '100%' }}
              >
                + Add Task
              </button>
            )}

            {tasks.length === 0 ? (
              <div className="mobile-empty-state">
                <div className="text-gray-400">No tasks in this project</div>
              </div>
            ) : (
              <div className="mobile-task-list">
                {tasks.map(task => (
                  <div key={task.id} className="mobile-card">
                    <div className="mobile-task-header">
                      <h3 className="mobile-task-title">{task.task}</h3>
                      <span className={`mobile-task-status mobile-task-status-${task.status}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="mobile-task-meta" style={{ marginTop: '8px' }}>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span>👤 {task.assigned_to_name}</span>
                        {task.priority && (
                          <span className={`priority-${task.priority}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    {task.rejection_notes && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mt-2">
                        <p className="text-red-200 text-xs">⚠️ {task.rejection_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            {canManageMembers && (
              <button
                onClick={() => setShowAddMember(true)}
                className="mobile-button mobile-button-primary mb-4"
                style={{ width: '100%' }}
              >
                + Add Member
              </button>
            )}

            {members.length === 0 ? (
              <div className="mobile-empty-state">
                <div className="text-gray-400">No team members yet</div>
              </div>
            ) : (
              <div className="mobile-task-list">
                {members.map(member => (
                  <div key={member.user_id} className="mobile-card">
                    <div className="mobile-task-header">
                      <div>
                        <h3 className="mobile-task-title">{member.username}</h3>
                        <p className="text-xs text-gray-400 mt-1">{member.email}</p>
                      </div>
                      <span className={`mobile-task-status ${
                        member.role === 'team_leader' 
                          ? 'mobile-task-status-completed' 
                          : 'mobile-task-status-pending'
                      }`}>
                        {member.role === 'team_leader' ? '👑 Leader' : 'Member'}
                      </span>
                    </div>

                    {canManageMembers && (
                      <div className="mobile-task-actions">
                        <select
                          value={member.role}
                          onChange={(e) => handleMemberRoleChange(member.user_id, e.target.value)}
                          className="mobile-input mobile-select flex-1"
                        >
                          <option value="member">Team Member</option>
                          <option value="team_leader">Team Leader</option>
                        </select>
                        {member.role !== 'team_leader' && (
                          <button
                            onClick={async () => {
                              if (confirm('Remove this member from the project?')) {
                                try {
                                  await apiClient.delete(`/api/projects/${id}/members/${member.user_id}/remove-with-tasks`);
                                  await handleMemberRemoved(member.user_id);
                                } catch (error) {
                                  toast.error('Failed to remove member');
                                }
                              }
                            }}
                            className="px-3 py-2 bg-red-500/20 text-red-300 rounded text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
            <div className="flex-1 overflow-y-auto mb-4 mobile-card" style={{ maxHeight: '400px' }}>
              {chatMessages.length === 0 ? (
                <div className="mobile-empty-state">
                  <div className="text-gray-400">No messages yet</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.user_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.user_id === currentUser?.id
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-gray-700/50 border border-gray-600/30'
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">{message.username}</div>
                        <p className="text-white text-sm">{message.message}</p>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(message.sent_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Type your message..."
                className="mobile-input flex-1"
                disabled={!currentUser}
              />
              <button
                type="submit"
                disabled={!newChatMessage.trim() || !currentUser}
                className="mobile-button mobile-button-primary"
                style={{ padding: '12px 20px' }}
              >
                Send
              </button>
            </form>
          </div>
        )}

        {activeTab === 'ready_tasks' && canSeeReadyTasks && (
          <div>
            {readyTasks.length === 0 ? (
              <div className="mobile-empty-state">
                <div className="text-gray-400">No tasks ready for review</div>
              </div>
            ) : (
              <div className="mobile-task-list">
                {readyTasks.map(task => (
                  <div key={task.id} className="mobile-card" style={{ borderColor: 'rgba(139, 92, 246, 0.5)' }}>
                    <div className="mobile-task-header">
                      <h3 className="mobile-task-title">{task.task}</h3>
                      <span className="mobile-task-status mobile-task-status-ready_for_review">
                        Ready
                      </span>
                    </div>
                    
                    <div className="mobile-task-meta" style={{ marginTop: '8px', marginBottom: '12px' }}>
                      <div className="text-xs">
                        👤 Assigned to: {task.assigned_to_name}
                      </div>
                    </div>

                    {/* Task Files */}
                    <TaskFiles taskId={task.id} />

                    <div className="mobile-task-actions">
                      <button
                        onClick={() => handleApproveTask(task.id)}
                        className="mobile-button flex-1"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', color: 'white' }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTaskForReject({ taskId: task.id, currentStatus: 'ready_for_review' });
                          setShowRejectModal(true);
                        }}
                        className="mobile-button flex-1"
                        style={{ background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', color: 'white' }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="mobile-card">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Status</h4>
                {canManageTasks ? (
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="mobile-input mobile-select"
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
                <h4 className="text-sm font-medium text-gray-400 mb-2">Created By</h4>
                <p className="text-white">{project.created_by_name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>

              {teamLeaders.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Team Leaders</h4>
                  {teamLeaders.map(leader => (
                    <div key={leader.user_id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mt-2">
                      <p className="text-yellow-300 text-sm">👑 {leader.username}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <div className="text-2xl font-bold text-white">{members.length}</div>
                  <div className="text-xs text-gray-400">Total Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{tasks.length}</div>
                  <div className="text-xs text-gray-400">Total Tasks</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <MobileModal
        isOpen={showAddTask}
        onClose={() => {
          setShowAddTask(false);
          setAddTaskData({ assigned_to: '', task: '', priority: 'medium', estimated_time_minutes: '' });
        }}
        title="Add Task"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Assign To *</label>
            <select
              value={addTaskData.assigned_to}
              onChange={(e) => setAddTaskData({ ...addTaskData, assigned_to: e.target.value })}
              className="mobile-input mobile-select"
              required
            >
              <option value="">Choose a team member...</option>
              {getProjectMemberWorkers().map(worker => (
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
              className="mobile-input mobile-select"
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
                setShowAddTask(false);
                setAddTaskData({ assigned_to: '', task: '', priority: 'medium', estimated_time_minutes: '' });
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
      </MobileModal>

      {/* Add Member Modal */}
      <MobileModal
        isOpen={showAddMember}
        onClose={() => {
          setShowAddMember(false);
          setAddMemberData({ user_id: '', role: 'member' });
        }}
        title="Add Member"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Team Member *</label>
            <select
              value={addMemberData.user_id}
              onChange={(e) => setAddMemberData({ ...addMemberData, user_id: e.target.value })}
              className="mobile-input mobile-select"
              required
            >
              <option value="">Choose a team member...</option>
              {getAvailableWorkers().map(worker => (
                <option key={worker.id} value={worker.id}>{worker.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Role</label>
            <select
              value={addMemberData.role}
              onChange={(e) => setAddMemberData({ ...addMemberData, role: e.target.value })}
              className="mobile-input mobile-select"
            >
              <option value="member">Team Member</option>
              <option value="team_leader">Team Leader</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowAddMember(false);
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
      >
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-200 text-sm">
              Please provide detailed feedback on what needs to be improved.
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

export default MobileProjectDetails;

