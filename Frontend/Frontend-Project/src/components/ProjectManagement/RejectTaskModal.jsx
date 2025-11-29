import React, { useState } from 'react';

const RejectTaskModal = ({ taskId, currentStatus, onSubmit, onClose }) => {
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rejectionNotes.trim()) {
      alert('Please provide rejection notes');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(rejectionNotes);
    } finally {
      setLoading(false);
    }
  };

  const getRejectionMessage = () => {
    if (currentStatus === 'approved') {
      return "This task was previously approved but needs revisions. Please provide detailed feedback.";
    } else if (currentStatus === 'ready_for_review') {
      return "This task is ready for review but needs improvements. Please provide constructive feedback.";
    }
    return "Please provide detailed reasons for rejecting this task.";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Reject Task</h2>
            <p className="text-gray-400 text-sm mt-1">
              {currentStatus === 'approved' ? 'Approved Task' : 'Ready for Review Task'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-300 mb-2">
              <span>⚠️</span>
              <span className="font-semibold">Rejection Notice</span>
            </div>
            <p className="text-yellow-200 text-sm">
              {getRejectionMessage()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rejection Reason *
            </label>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              rows="4"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
              placeholder="Provide detailed feedback on what needs to be improved..."
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              This feedback will help the team member understand what needs improvement.
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
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Rejecting...' : `Reject ${currentStatus === 'approved' ? 'Approved' : 'Review'} Task`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectTaskModal;