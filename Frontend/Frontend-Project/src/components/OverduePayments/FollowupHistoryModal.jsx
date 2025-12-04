import React from 'react';

const FollowupHistoryModal = ({ payment, followups, onClose, formatCurrency }) => {
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '📞';
      case 'waiting': return '⏳';
      case 'not_responding': return '🚫';
      case 'resolved': return '✅';
      default: return '📝';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">Follow-up History</h3>
            <p className="text-gray-400">
              Contract #{payment.contract_id} • Month {payment.month_number}
            </p>
            <p className="text-sm text-gray-500">
              Customer: {payment.customer_name} • Total Due: {formatCurrency(payment.amount_due)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {followups.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 text-gray-600">📝</div>
              <h4 className="text-xl font-semibold text-gray-400 mb-2">No Follow-up History</h4>
              <p className="text-gray-500">No follow-ups recorded for this payment yet.</p>
            </div>
          ) : (
            followups.map((followup, index) => (
              <div 
                key={followup.id} 
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getStatusIcon(followup.status)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        followup.status === 'pending' ? 'bg-yellow-600' :
                        followup.status === 'waiting' ? 'bg-blue-600' :
                        followup.status === 'not_responding' ? 'bg-red-600' :
                        'bg-green-600'
                      }`}>
                        {followup.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Follow-up #{followups.length - index} • {formatDateTime(followup.call_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">By: {followup.worker_name || 'Unknown'}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* Customer Response */}
                  {followup.customer_response && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Customer Response:</p>
                      <p className="bg-gray-800/50 p-3 rounded border border-gray-600/30">
                        {followup.customer_response}
                      </p>
                    </div>
                  )}
                  
                  {/* Dates - Show only if available */}
                  {(followup.promise_date || followup.next_followup_date) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {followup.promise_date && (
                        <div>
                          <p className="text-gray-400 text-sm">Promise Date:</p>
                          <p className="font-semibold">{formatDate(followup.promise_date)}</p>
                        </div>
                      )}
                      {followup.next_followup_date && (
                        <div>
                          <p className="text-gray-400 text-sm">Next Follow-up:</p>
                          <p className={`font-semibold ${
                            new Date(followup.next_followup_date) <= new Date() 
                              ? 'text-red-400' 
                              : 'text-blue-400'
                          }`}>
                            {formatDate(followup.next_followup_date)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {followups.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Follow-ups</p>
                <p className="text-2xl font-bold text-white">{followups.length}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">First Follow-up</p>
                <p className="text-sm font-semibold">
                  {formatDate(followups[followups.length - 1]?.call_date)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Latest Follow-up</p>
                <p className="text-sm font-semibold">
                  {formatDate(followups[0]?.call_date)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Current Status</p>
                <p className="text-sm font-semibold capitalize">
                  {payment.status || followups[0]?.status}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowupHistoryModal;