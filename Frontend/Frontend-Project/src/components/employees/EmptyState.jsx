import React from 'react';

function EmptyState({ onAddEmployee, userType, userBranches }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-6xl mb-4">👨‍💼</div>
      <p className="text-lg">No employees found</p>
      <p className="text-sm">Add your first employee to get started</p>
      
      {userType !== 0 && userBranches.length > 0 && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-gray-300 mb-2">Your Access Information:</p>
          <p className="text-xs text-gray-400">
            You can only manage employees in these branches:
          </p>
          <ul className="text-xs text-gray-400 mt-1">
            {userBranches.map(branch => (
              <li key={branch.id}>• {branch.name}</li>
            ))}
          </ul>
        </div>
      )}
      
      <button
        onClick={onAddEmployee}
        className="mt-4 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors duration-200"
      >
        Add First Employee
      </button>
    </div>
  );
}

export default EmptyState;