import React from 'react';

const EmptyState = () => {
  return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-6xl mb-4">🏗️</div>
      <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
      <p className="max-w-md mx-auto mb-6">
        Start by creating your first project to organize tasks and collaborate with your team
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-2xl mb-2">📋</div>
          <p className="text-sm">Organize tasks</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-2xl mb-2">👥</div>
          <p className="text-sm">Assign teams</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-2xl mb-2">💬</div>
          <p className="text-sm">Team collaboration</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;