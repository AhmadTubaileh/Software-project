import React from 'react';

function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-6xl mb-4">👨‍💼</div>
      <p className="text-lg">No employees found</p>
      <p className="text-sm">Add your first employee to get started</p>
    </div>
  );
}

export default EmptyState;