import React, { useState, useEffect } from 'react';
import BranchForm from './BranchForm.jsx';

function BranchModal({ isOpen, branch, onSubmit, onCancel }) {
  if (!isOpen) return null;

  const modalTitle = branch ? `Edit Branch: ${branch.name}` : 'Add New Branch';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gray-800 rounded-lg w-full max-w-lg mx-auto border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            {modalTitle}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <BranchForm
            branch={branch}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}

export default BranchModal;