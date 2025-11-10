import React from 'react';

const RejectModal = ({ contract, processing, rejectionReason, onRejectionReasonChange, onClose, onReject }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Reject Contract</h3>
        <p className="text-gray-300 mb-4">
          Please provide a reason for rejecting this contract:
        </p>
        <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
          <p><strong>Customer:</strong> {contract.customer_name}</p>
          <p><strong>Item:</strong> {contract.item_name}</p>
        </div>
        <textarea
          value={rejectionReason}
          onChange={(e) => onRejectionReasonChange(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={4}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 mb-4"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onReject}
            disabled={processing || !rejectionReason.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              'Reject Contract'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;