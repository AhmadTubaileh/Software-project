import React, { useState } from 'react';

const BranchDropdown = ({ filter, setFilter, branches }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedBranch = branches.find(branch => branch.id.toString() === filter.branchId);

  const handleSelect = (branchId) => {
    setFilter(prev => ({ ...prev, branchId: branchId }));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Branch
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-left text-white focus:outline-none focus:border-blue-500 transition-all duration-200 hover:bg-gray-600/50 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          {selectedBranch ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                🏢
              </div>
              <div className="text-left">
                <div className="font-medium text-white">{selectedBranch.name}</div>
                <div className="text-xs text-gray-400">Branch</div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-gray-400">
                🏢
              </div>
              <span className="text-gray-400">All Branches</span>
            </div>
          )}
        </div>
        
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
          <div className="p-3 border-b border-gray-700/50 bg-gray-900/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-sm">🏢</span>
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Select Branch</h4>
                <p className="text-gray-400 text-xs">{branches.length} branches</p>
              </div>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            <button
              onClick={() => handleSelect('')}
              className={`w-full text-left p-3 transition-all duration-200 group ${
                !filter.branchId 
                  ? 'bg-green-500/20 border-r-2 border-green-500' 
                  : 'hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-sm">
                  🌟
                </div>
                <div>
                  <div className={`font-medium ${
                    !filter.branchId ? 'text-green-300' : 'text-white group-hover:text-white'
                  }`}>
                    All Branches
                  </div>
                  <div className="text-xs text-gray-400">View all branches</div>
                </div>
              </div>
            </button>

            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch.id.toString())}
                className={`w-full text-left p-3 transition-all duration-200 group border-l-2 ${
                  filter.branchId === branch.id.toString()
                    ? 'bg-green-500/20 border-green-500' 
                    : 'border-transparent hover:bg-gray-700/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    🏢
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${
                      filter.branchId === branch.id.toString() 
                        ? 'text-green-300' 
                        : 'text-white group-hover:text-white'
                    }`}>
                      {branch.name}
                    </div>
                  </div>
                  {filter.branchId === branch.id.toString() && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-700/50 bg-gray-900/50">
            <div className="text-center text-xs text-gray-400">
              {selectedBranch ? `Viewing ${selectedBranch.name} branch` : 'Viewing all branches'}
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default BranchDropdown;
