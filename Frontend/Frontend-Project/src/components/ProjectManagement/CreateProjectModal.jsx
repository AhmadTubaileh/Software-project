import React, { useState } from 'react';
import WorkerDropdown from '../TaskManagement/WorkerDropdown.jsx';

const CreateProjectModal = ({ workers, currentUser, selectedBranchId, selectedBranchName, accessibleBranches, showBranchSelector, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    team_leader_id: '',
    branch_id: selectedBranchId || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a project title');
      return;
    }

    // If branch selector is shown, branch_id is required
    if (showBranchSelector && !formData.branch_id) {
      alert('Please select a branch for the project');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700/50 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Create New Project</h2>
            {!showBranchSelector && selectedBranchId && selectedBranchName && (
              <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                <span>🏢</span>
                <span>Branch: <strong className="text-white">{selectedBranchName}</strong></span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branch Selection - Only show when "All Branches" is selected */}
          {showBranchSelector && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Branch *
              </label>
              <select
                value={formData.branch_id}
                onChange={(e) => handleChange('branch_id', e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Choose a branch...</option>
                {accessibleBranches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Select the branch where this project will be created
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Enter project title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="4"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Describe the project goals and objectives..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Leader (Optional)
            </label>
            <WorkerDropdown
              value={formData.team_leader_id}
              onChange={(e) => handleChange('team_leader_id', e.target.value)}
              workers={workers}
              label="Select Team Leader"
              includeNoneOption={true}
            />
            <p className="text-xs text-gray-400 mt-1">
              Assign a team leader to manage project tasks and approvals
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;