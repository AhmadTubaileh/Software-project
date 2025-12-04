import React from 'react';

const ApproveModal = ({ contract, processing, onClose, onApprove }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Approve Contract</h3>
        <p className="text-gray-300 mb-2">
          Are you sure you want to approve this contract?
        </p>
        <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
          <p><strong>Customer:</strong> {contract.customer_name}</p>
          <p><strong>Item:</strong> {contract.item_name}</p>
          <p><strong>Total:</strong> {formatCurrency(contract.total_price)}</p>
          <p><strong>Months:</strong> {contract.months}</p>
        </div>
        <p className="text-green-400 text-sm mb-4">
          ✅ Contract will be activated and payment schedule created.
        </p>
        <p className="text-yellow-400 text-sm mb-4">
          📝 Item quantity will remain the same (reserved for installment).
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            disabled={processing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              'Approve Contract'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveModal;