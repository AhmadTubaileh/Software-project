import React from 'react';

function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-6xl mb-4">📦</div>
      <p className="text-lg">No items found</p>
      <p className="text-sm">Add your first item to get started</p>
    </div>
  );
}

export default EmptyState;
