import React, { useState, useEffect } from 'react';
import { useLocalSession } from '../../hooks/useLocalSession.js';
import toast from 'react-hot-toast';

const ProjectMembers = ({ projectId, onMemberRemoved }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useLocalSession();

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/members`);
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

  // Remove member from project
  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Member removed successfully!');
        fetchMembers(); // Refresh the list
        if (onMemberRemoved) onMemberRemoved();
      } else {
        throw new Error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const getRoleBadge = (role, userType) => {
    if (role === 'team_leader') {
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
    if (userType === 0) {
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
    if (userType <= 3) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
    return 'bg-green-500/20 text-green-300 border-green-500/30';
  };

  const getRoleLabel = (role, userType) => {
    if (role === 'team_leader') return 'Team Leader';
    if (userType === 0) return 'Admin';
    if (userType <= 3) return 'Senior Worker';
    return 'Junior Worker';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Team Members ({members.length})</h3>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-600 rounded-lg">
          <div className="text-4xl mb-2">👥</div>
          <p>No team members yet</p>
          <p className="text-sm">Add members to collaborate on this project</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {members.map((member) => (
            <div
              key={member.user_id}
              className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {member.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{member.username}</h4>
                    <p className="text-sm text-gray-400">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs border ${getRoleBadge(member.role, member.user_type)}`}>
                      {getRoleLabel(member.role, member.user_type)}
                    </span>
                    <span className="text-xs text-gray-400">
                      Level {member.user_type}
                    </span>
                  </div>
                  
                  {/* Remove button - only show for admins or project creators */}
                  {(currentUser?.role === 'admin' || currentUser?.id === member.created_by) && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                      title="Remove from project"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                Joined: {new Date(member.joined_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectMembers;