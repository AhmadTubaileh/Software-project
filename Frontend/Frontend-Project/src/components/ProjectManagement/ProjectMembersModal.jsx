import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ProjectMembersModal = ({ project, onClose, onMembersUpdated }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, [project.id]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${project.id}/members`);
      const data = await response.json();
      
      if (response.ok) {
        setMembers(data);
      } else {
        toast.error('Failed to load members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Error loading members');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    setUpdating(memberId);
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${project.id}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      // CRITICAL FIX: Update the project's team_leader_id when role changes
      if (newRole === 'team_leader') {
        // Set this member as the team leader in the project
        await fetch(`http://localhost:5000/api/projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ team_leader_id: memberId }),
        });
      } else {
        // If removing team leader role and this member was the team leader, clear it
        const currentMember = members.find(m => m.user_id === memberId);
        if (currentMember?.role === 'team_leader') {
          await fetch(`http://localhost:5000/api/projects/${project.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ team_leader_id: null }),
          });
        }
      }

      toast.success('Member role updated successfully!');
      
      // Update the local state immediately for better UX
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.user_id === memberId 
            ? { ...member, role: newRole }
            : member
        )
      );
      
      // Call the callback to refresh parent components
      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project? All tasks assigned to them will be unassigned.`)) {
      return;
    }

    setUpdating(memberId);
    try {
      // Check if the member being removed is the team leader
      const memberToRemove = members.find(member => member.user_id === memberId);
      const isTeamLeader = memberToRemove?.role === 'team_leader';

      const response = await fetch(`http://localhost:5000/api/projects/${project.id}/members/${memberId}/remove-with-tasks`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      // CRITICAL FIX: If removed member was team leader, clear team_leader_id
      if (isTeamLeader) {
        await fetch(`http://localhost:5000/api/projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ team_leader_id: null }),
        });
      }

      toast.success(`Member removed successfully! ${data.unassignedTasks} tasks were unassigned.`);
      
      // Remove from local state immediately
      setMembers(prevMembers => 
        prevMembers.filter(member => member.user_id !== memberId)
      );
      
      // Call the callback to refresh parent components
      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'team_leader') {
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
    return 'bg-green-500/20 text-green-300 border-green-500/30';
  };

  const getRoleLabel = (role) => {
    if (role === 'team_leader') return 'Team Leader';
    return 'Team Member';
  };

  // Check if user is the project creator (cannot be removed)
  const isProjectCreator = (member) => {
    return member.user_id === project.created_by;
  };

  // Count team leaders
  const teamLeadersCount = members.filter(member => member.role === 'team_leader').length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Project Members</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl border border-gray-700/50 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white">Team Members - {project.title}</h2>
            <p className="text-gray-400 mt-1">
              Manage roles and members for this project
              {teamLeadersCount > 0 && (
                <span className="ml-2 text-yellow-400">
                  ({teamLeadersCount} team leader{teamLeadersCount !== 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {member.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">
                        {member.username}
                        {isProjectCreator(member) && (
                          <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                            Project Creator
                          </span>
                        )}
                        {member.role === 'team_leader' && (
                          <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                            Team Leader
                          </span>
                        )}
                      </h4>
                      <p className="text-gray-400 text-sm truncate">{member.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs border ${getRoleBadge(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                        <span className="text-xs text-gray-400">
                          Level {member.user_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Selector - All members can change roles except project creator */}
                    {!isProjectCreator(member) && (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                        disabled={updating === member.user_id}
                        className="bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                      >
                        <option value="member">Team Member</option>
                        <option value="team_leader">Team Leader</option>
                      </select>
                    )}

                    {/* Remove Button - Only disable for project creator */}
                    {!isProjectCreator(member) ? (
                      <button
                        onClick={() => handleRemoveMember(member.user_id, member.username)}
                        disabled={updating === member.user_id}
                        className="px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                        title="Remove from project"
                      >
                        {updating === member.user_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-300"></div>
                        ) : (
                          '🗑️ Remove'
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-2 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg cursor-not-allowed flex items-center gap-2"
                        title="Cannot remove project creator"
                      >
                        🔒 Creator
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-400 mt-2">
                  Joined: {new Date(member.joined_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {members.length === 0 && (
            <div className="text-center py-12 text-gray-400 border border-dashed border-gray-600 rounded-xl">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">No team members yet</h3>
              <p>Add members to collaborate on this project</p>
            </div>
          )}
        </div>

        {/* Footer with team leader info */}
        <div className="p-6 border-t border-gray-700/50">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {members.length} team member{members.length !== 1 ? 's' : ''}
                {teamLeadersCount > 0 && (
                  <span className="ml-2 text-yellow-400">
                    • {teamLeadersCount} team leader{teamLeadersCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
            
            {/* Team leader information */}
            {teamLeadersCount === 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-300">
                  <span>💡</span>
                  <span className="text-sm font-medium">No Team Leaders</span>
                </div>
                <p className="text-yellow-200 text-xs mt-1">
                  Consider assigning team leaders to help manage project tasks and approvals.
                  Team leaders can access the "Ready for Review" section and approve tasks.
                </p>
              </div>
            )}
            
            {teamLeadersCount > 1 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-300">
                  <span>👥</span>
                  <span className="text-sm font-medium">Multiple Team Leaders</span>
                </div>
                <p className="text-blue-200 text-xs mt-1">
                  Multiple team leaders can collaborate on task management and approvals.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMembersModal;