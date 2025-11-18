import React from 'react';

const EmptyState = () => {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-6xl mb-4">📝</div>
      <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
      <p>Start by assigning a new task to your team members</p>
    </div>
  );
};

export default EmptyState;