import React from 'react';

function BranchCard({ branch, onEdit, onDelete }) {
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get branch status color based on age
  const getBranchStatus = () => {
    const createdDate = new Date(branch.created_at);
    const now = new Date();
    const diffMonths = (now - createdDate) / (1000 * 60 * 60 * 24 * 30);
    
    if (diffMonths < 3) return { text: 'New', color: 'bg-green-600' };
    if (diffMonths < 12) return { text: 'Established', color: 'bg-blue-600' };
    return { text: 'Long-term', color: 'bg-purple-600' };
  };

  const status = getBranchStatus();

  // Get image URL - use the URL directly (like items main_img)
  const imageUrl = branch.branch_img && branch.branch_img.trim() !== '' ? branch.branch_img : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:scale-[1.02] transform-gpu group">
      {/* Branch Image */}
      {imageUrl && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={branch.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Hide image if it fails to load
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Header with Name and Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏢</span>
            </div>
            <h3 className="font-semibold text-lg truncate">{branch.name}</h3>
          </div>
          <span className={`${status.color} px-2 py-1 rounded text-xs font-medium`}>
            {status.text}
          </span>
        </div>
        <div className="text-sm text-gray-400 text-right">
          <div>ID: {branch.id}</div>
          <div className="text-xs">{formatDate(branch.created_at)}</div>
        </div>
      </div>

      {/* Branch Details */}
      <div className="space-y-3 text-sm mb-4">
        {branch.address && (
          <div className="flex gap-2">
            <span className="text-gray-400 min-w-[70px]">📍 Address:</span>
            <span className="text-gray-300 flex-1">{branch.address}</span>
          </div>
        )}
        
        {branch.phone && (
          <div className="flex gap-2">
            <span className="text-gray-400 min-w-[70px]">📞 Phone:</span>
            <span className="text-gray-300">{branch.phone}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-700">
        <button
          onClick={() => onEdit(branch)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm transition-colors duration-200 flex items-center justify-center gap-1"
        >
          <span>✏️</span> Edit
        </button>
        <button
          onClick={() => onDelete(branch.id)}
          className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 py-2 rounded text-sm transition-colors duration-200 flex items-center justify-center gap-1 border border-red-600/30"
        >
          <span>🗑️</span> Delete
        </button>
      </div>

      {/* Quick Info Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Created:</span>
          <span>{formatDate(branch.created_at)}</span>
        </div>
        {!branch.address && !branch.phone && (
          <div className="mt-2 text-amber-400 text-center">
            ⚠️ Missing contact information
          </div>
        )}
      </div>
    </div>
  );
}

export default BranchCard;