import React from 'react';

const EmptyState = ({ filter }) => {
  const getEmptyStateContent = () => {
    switch (filter) {
      case 'pending':
        return {
          emoji: '⏳',
          title: 'No pending tasks',
          description: "Great! You don't have any pending tasks at the moment."
        };
      case 'in_progress':
        return {
          emoji: '🔄',
          title: 'No tasks in progress',
          description: "No tasks are currently in progress. Start working on some pending tasks!"
        };
      case 'ready_for_review':
        return {
          emoji: '📤',
          title: 'No tasks ready for review',
          description: "You haven't submitted any tasks for review yet."
        };
      default:
        return {
          emoji: '📋',
          title: 'No active tasks',
          description: "You're all caught up! No active tasks have been assigned to you."
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-6xl mb-4">
        {content.emoji}
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {content.title}
      </h3>
      <p className="max-w-md mx-auto">
        {content.description}
      </p>
    </div>
  );
};

export default EmptyState;