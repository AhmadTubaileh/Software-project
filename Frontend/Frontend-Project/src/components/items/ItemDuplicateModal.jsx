import React, { useState } from 'react';
import toast from 'react-hot-toast';

function ItemDuplicateModal({ isOpen, item, allBranches, currentUser, onDuplicate, onCancel }) {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBranch) {
      toast.error('Please select a target branch');
      return;
    }

    if (parseInt(selectedBranch) === item.branch_id) {
      toast.error('Item is already in this branch');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('target_branch_id', selectedBranch);
      formData.append('currentUserId', currentUser.id);

      const response = await fetch(`http://localhost:5000/api/items/${item.id}/duplicate`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        toast.success(`Item duplicated to ${allBranches.find(b => b.id === parseInt(selectedBranch))?.name}`);
        onDuplicate();
        onCancel();
      } else {
        throw new Error(result.message || 'Duplication failed');
      }
    } catch (error) {
      console.error('Error duplicating item:', error);
      toast.error(error.message || 'Failed to duplicate item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Duplicate Item</h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded">
            <p className="text-blue-300 text-sm">
              <strong>Item:</strong> {item.name}
            </p>
            <p className="text-blue-300 text-sm">
              <strong>Current Branch:</strong> {item.branch_name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Target Branch *
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose a branch --</option>
                {allBranches.map(branch => (
                  <option 
                    key={branch.id} 
                    value={branch.id}
                    disabled={branch.id === item.branch_id}
                  >
                    {branch.name} {branch.id === item.branch_id ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-gray-800 border border-gray-700 rounded text-sm text-gray-300">
              <p>✅ All item details including prices will be copied to the selected branch.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedBranch}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Duplicating...' : 'Duplicate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ItemDuplicateModal;
