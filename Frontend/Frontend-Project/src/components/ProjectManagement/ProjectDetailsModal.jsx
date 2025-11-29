import React, { useState, useEffect } from 'react';
import ProjectTasks from './ProjectTasks.jsx';
import ProjectMembers from './ProjectMembers.jsx';
import ProjectChat from './ProjectChat.jsx';

const ProjectDetailsModal = ({ project, onClose, onStatusChange }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [projectDetails, setProjectDetails] = useState(project);

  useEffect(() => {
    // Fetch full project details if needed
    const fetchProjectDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/projects/${project.id}`);
        if (response.ok) {
          const data = await response.json();
          setProjectDetails(data);
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      }
    };

    fetchProjectDetails();
  }, [project.id]);

  const tabs = [
    { id: 'tasks', label: 'Tasks', emoji: '📋' },
    { id: 'members', label: 'Team Members', emoji: '👥' },
    { id: 'chat', label: 'Chat', emoji: '💬' },
    { id: 'details', label: 'Project Info', emoji: 'ℹ️' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-6xl border border-gray-700/50 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white">{projectDetails.title}</h2>
            <p className="text-gray-400 mt-1">
              Created by {projectDetails.created_by_name} • {new Date(projectDetails.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'tasks' && (
            <ProjectTasks projectId={project.id} />
          )}
          
          {activeTab === 'members' && (
            <ProjectMembers projectId={project.id} />
          )}
          
          {activeTab === 'chat' && (
            <ProjectChat projectId={project.id} />
          )}
          
          {activeTab === 'details' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                    <p className="text-white">
                      {projectDetails.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Team Leader</h4>
                    <p className="text-white">
                      {projectDetails.team_leader_name || 'Not assigned'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Project Status</h4>
                    <select
                      value={projectDetails.status}
                      onChange={(e) => onStatusChange(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Last Updated</h4>
                    <p className="text-white">
                      {new Date(projectDetails.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;