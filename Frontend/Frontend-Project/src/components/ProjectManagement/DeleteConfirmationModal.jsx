import React from 'react';

const DeleteConfirmationModal = ({ item, onConfirm, onClose }) => {
  const getModalContent = () => {
    if (item.type === 'project') {
      return {
        title: 'Delete Project',
        icon: '🏗️',
        color: 'red',
        message: `Are you sure you want to delete the project "${item.name}"?`,
        details: [
          `📋 ${item.details.taskCount} total tasks`,
          `👥 ${item.details.memberCount} team members`,
          `📁 ${item.details.nonCompletedTasks} non-completed tasks will be archived`,
          `✅ ${item.details.completedTasks} completed tasks will be preserved`
        ],
        warning: 'This action cannot be undone. The project will be marked as deleted and all non-completed tasks will be archived.'
      };
    } else if (item.type === 'task') {
      return {
        title: 'Delete Task',
        icon: '📋',
        color: 'orange',
        message: `Are you sure you want to delete the task "${item.name}"?`,
        details: [
          `📁 Project: ${item.details.project}`,
          `👤 Assigned to: ${item.details.assignedTo}`,
          `📊 Status: ${item.details.status.replace('_', ' ')}`,
          `⚡ Priority: ${item.details.priority}`
        ],
        warning: 'This task will be moved to the archive and can be restored if needed.'
      };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700/50 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${
            item.type === 'project' ? 'bg-red-500/20' : 'bg-orange-500/20'
          } rounded-full flex items-center justify-center mx-auto mb-4 border ${
            item.type === 'project' ? 'border-red-500/30' : 'border-orange-500/30'
          }`}>
            <span className="text-2xl">{content.icon}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{content.title}</h2>
          <p className="text-gray-300 text-sm">Please confirm this action</p>
        </div>

        {/* Warning Message */}
        <div className={`${
          item.type === 'project' ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'
        } border rounded-xl p-4 mb-6`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${
              item.type === 'project' ? 'bg-red-500/20' : 'bg-orange-500/20'
            } rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className={`text-lg ${
                item.type === 'project' ? 'text-red-400' : 'text-orange-400'
              }`}>⚠️</span>
            </div>
            <div>
              <p className={`font-medium text-sm ${
                item.type === 'project' ? 'text-red-200' : 'text-orange-200'
              }`}>
                {content.message}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-gray-700/30 rounded-xl p-4 mb-6 border border-gray-600/50">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span>📊</span>
            Details
          </h4>
          <div className="space-y-2">
            {content.details.map((detail, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0"></div>
                <span className="text-gray-300">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Project-Specific Information */}
        {item.type === 'project' && item.details.nonCompletedTasks > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 text-blue-300 mb-1">
              <span>ℹ️</span>
              <span className="font-medium text-sm">Task Archiving</span>
            </div>
            <p className="text-blue-200 text-xs">
              {item.details.nonCompletedTasks} non-completed task{item.details.nonCompletedTasks !== 1 ? 's' : ''} will be moved to the task archive. 
              Completed tasks ({item.details.completedTasks}) will remain accessible for reporting.
            </p>
          </div>
        )}

        {/* Warning Note */}
        <div className={`${
          item.type === 'project' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-orange-500/10 border-orange-500/20'
        } rounded-xl p-3 mb-6`}>
          <p className={`text-xs text-center ${
            item.type === 'project' ? 'text-yellow-200' : 'text-orange-200'
          }`}>
            {content.warning}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-600 hover:border-gray-500 transform hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 bg-gradient-to-r ${
              item.type === 'project' 
                ? 'from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
                : 'from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
            } text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg`}
          >
            {item.type === 'project' ? 'Delete Project' : 'Delete Task'}
          </button>
        </div>

        {/* Additional Info for Project Deletion */}
        {item.type === 'project' && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Project members will lose access to this project and its non-completed tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;