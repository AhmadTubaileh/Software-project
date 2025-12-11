import React from 'react';
import EmployeeForm from './EmployeeForm.jsx';

function EmployeeModal({ isOpen, employee, onSubmit, onCancel, currentUser, allBranches, loadAccessibleBranches }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <h2 className="text-xl font-bold mb-4 text-white">
          {employee ? 'Edit Employee' : 'Add New Employee'}
        </h2>
        <EmployeeForm
          employee={employee}
          onSubmit={onSubmit}
          onCancel={onCancel}
          currentUser={currentUser}
          allBranches={allBranches}
          loadAccessibleBranches={loadAccessibleBranches}
        />
      </div>
    </div>
  );
}

export default EmployeeModal;