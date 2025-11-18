import React from 'react';

const statusStyles = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-300 border-green-500/30'
};

const TaskCard = ({ task, onDelete }) => {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            {task.task}
          </h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Assigned by:</span>
              <span className="font-medium">{task.assigned_by_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Assigned to:</span>
              <span className="font-medium">{task.assigned_to_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Created:</span>
              <span>{new Date(task.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[task.status]}`}>
            {task.status.replace('_', ' ').toUpperCase()}
          </span>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-400 hover:text-red-300 transition-colors duration-200 p-2 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transform hover:scale-110"
            title="Delete Task"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;