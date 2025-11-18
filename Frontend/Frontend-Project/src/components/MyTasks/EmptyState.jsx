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
      case 'completed':
        return {
          emoji: '✅',
          title: 'No completed tasks',
          description: "You haven't completed any tasks yet. Keep going!"
        };
      default:
        return {
          emoji: '📋',
          title: 'No tasks assigned',
          description: "You're all caught up! No tasks have been assigned to you yet."
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