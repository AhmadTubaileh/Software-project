import React from 'react';

function EmptyState({ onAddBranch }) {
  return (
    <div className="text-center py-16 px-4 max-w-2xl mx-auto">
      <div className="text-8xl mb-6 opacity-50">🏢</div>
      <h2 className="text-2xl font-bold text-white mb-3">No Branches Yet</h2>
      <p className="text-gray-400 mb-6">
        You haven't added any branches to your system. Branches are physical store locations
        where your business operates. Add your first branch to get started.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm">
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl mb-2">📍</div>
          <h4 className="font-medium mb-1">Store Locations</h4>
          <p className="text-gray-500 text-xs">Track all physical locations</p>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl mb-2">📞</div>
          <h4 className="font-medium mb-1">Contact Info</h4>
          <p className="text-gray-500 text-xs">Manage phone numbers</p>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl mb-2">📊</div>
          <h4 className="font-medium mb-1">Organization</h4>
          <p className="text-gray-500 text-xs">Structure your business</p>
        </div>
      </div>
      
      <button
        onClick={onAddBranch}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 inline-flex items-center gap-2"
      >
        <span className="text-xl">+</span>
        Add Your First Branch
      </button>
      
      <p className="text-gray-500 text-sm mt-4">
        Need help? <a href="/help/branches" className="text-blue-400 hover:text-blue-300">Learn about branch management</a>
      </p>
    </div>
  );
}

export default EmptyState;