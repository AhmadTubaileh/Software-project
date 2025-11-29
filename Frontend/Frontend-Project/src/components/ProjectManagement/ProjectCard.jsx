import React, { useState } from 'react';
import ProjectDetailsModal from './ProjectDetailsModal.jsx';
import EditProjectModal from './EditProjectModal.jsx';

const statusStyles = {
  active: 'bg-green-500/20 text-green-300 border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  archived: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
};

const ProjectCard = ({ project, onDelete, onUpdate, workers, currentUser }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const getProgressPercentage = () => {
    if (!project.task_count) return 0;
    // This would need to be calculated based on completed tasks
    // For now, using a simple calculation
    return Math.min(Math.round((project.completed_tasks || 0) / project.task_count * 100), 100);
  };

  const handleStatusChange = (newStatus) => {
    onUpdate(project.id, { status: newStatus });
  };

  const canEdit = currentUser.role === 'admin' || currentUser.id === project.created_by;

  return (
    <>
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 group">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[project.status]}`}>
                {project.status.toUpperCase()}
              </span>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>👥 {project.member_count} members</span>
                <span>•</span>
                <span>📋 {project.task_count} tasks</span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gray-100 transition-colors">
              {project.title}
            </h3>
            
            {project.description && (
              <p className="text-gray-400 mb-4 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Created by:</span>
                <span className="font-medium">{project.created_by_name}</span>
              </div>
              {project.team_leader_name && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Team Leader:</span>
                  <span className="font-medium">{project.team_leader_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Created:</span>
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              View Details
            </button>
            
            {canEdit && (
              <>
                <button
                  onClick={() => setShowEdit(true)}
                  className="p-2 text-gray-400 hover:text-yellow-300 transition-colors hover:bg-yellow-500/10 rounded-lg"
                  title="Edit Project"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(project.id)}
                  className="p-2 text-gray-400 hover:text-red-300 transition-colors hover:bg-red-500/10 rounded-lg"
                  title="Delete Project"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Project Progress</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetails && (
        <ProjectDetailsModal
          project={project}
          onClose={() => setShowDetails(false)}
          onStatusChange={handleStatusChange}
        />
      )}

      {showEdit && (
        <EditProjectModal
          project={project}
          workers={workers}
          onUpdate={onUpdate}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
};

export default ProjectCard;