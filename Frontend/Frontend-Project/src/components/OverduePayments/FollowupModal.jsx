import React, { useState, useEffect } from 'react';

const FollowupModal = ({ payment, onClose, onSubmit, formatCurrency }) => {
  const [status, setStatus] = useState('waiting');
  const [customerResponse, setCustomerResponse] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Helper date functions
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getNextWeekDate = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  // Set next follow-up date automatically based on status
  useEffect(() => {
    console.log('Status changed to:', status);
    console.log('Today:', getTodayDate());
    console.log('Tomorrow:', getTomorrowDate());
    
    if (status === 'not_responding') {
      // Set next follow-up to tomorrow
      const tomorrow = getTomorrowDate();
      console.log('Setting next follow-up to:', tomorrow);
      setNextFollowupDate(tomorrow);
      setPromiseDate(''); // Clear promise date for not responding
    } else if (status === 'waiting') {
      // For waiting, set next follow-up to next week if not already set
      if (!nextFollowupDate) {
        const nextWeek = getNextWeekDate();
        console.log('Setting waiting follow-up to:', nextWeek);
        setNextFollowupDate(nextWeek);
      }
    } else if (status === 'resolved') {
      // For resolved, clear next follow-up date
      console.log('Clearing dates for resolved status');
      setNextFollowupDate('');
      setPromiseDate('');
    }
  }, [status]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerResponse.trim()) {
      alert('Please enter customer response');
      return;
    }

    // For waiting status, check dates
    if (status === 'waiting') {
      if (!promiseDate) {
        alert('Please enter promise date for waiting status');
        return;
      }
      if (!nextFollowupDate) {
        alert('Please enter next follow-up date for waiting status');
        return;
      }
    }

    // For not responding status, ensure next follow-up date is set (it should be from useEffect)
    if (status === 'not_responding' && !nextFollowupDate) {
      // Auto-set to tomorrow if somehow not set
      const tomorrow = getTomorrowDate();
      setNextFollowupDate(tomorrow);
    }

    // Double-check: if nextFollowupDate is today, change it to tomorrow
    if (status === 'not_responding' && nextFollowupDate === getTodayDate()) {
      const tomorrow = getTomorrowDate();
      console.log('Correcting date from today to tomorrow:', tomorrow);
      setNextFollowupDate(tomorrow);
    }

    setSubmitting(true);
    
    try {
      await onSubmit({
        status,
        customer_response: customerResponse,
        promise_date: promiseDate || null,
        next_followup_date: nextFollowupDate || null
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Status descriptions
  const statusDescriptions = {
    waiting: {
      title: "Customer Will Pay Later",
      description: "Customer promised to pay on a specific date. Set the promise date and next follow-up.",
      color: "text-blue-400",
      icon: "⏳"
    },
    not_responding: {
      title: "Customer Not Responding",
      description: "Customer didn't answer or respond. System will automatically schedule follow-up for tomorrow.",
      color: "text-red-400",
      icon: "🚫"
    }/*,
      resolved: {
      title: "Payment Resolved",
      description: "Payment has been completed or issue resolved. No further follow-up needed.",
      color: "text-green-400",
      icon: "✅"
    }*/
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">Add Follow-up</h3>
            <p className="text-gray-400">
              Contract #{payment.contract_id} • Month {payment.month_number}
            </p>
            <p className="text-sm text-gray-500">
              Customer: {payment.customer_name} • Phone: {payment.customer_phone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-700/50 p-4 rounded-lg mb-6 border border-gray-600/50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Item</p>
              <p className="font-semibold">{payment.item_name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Amount Due</p>
              <p className="font-semibold">{formatCurrency(payment.amount_due)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Amount Paid</p>
              <p className="font-semibold text-green-400">{formatCurrency(payment.amount_paid)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Remaining</p>
              <p className="font-semibold text-red-400">
                {formatCurrency(payment.amount_due - payment.amount_paid)}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Due Date</p>
              <p className="font-semibold">{formatDate(payment.due_date)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Payment Status</p>
              <p className="font-semibold">{payment.payment_status}</p>
            </div>
          </div>
        </div>

        {/* Status Selection with Descriptions */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-medium">Follow-up Result</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'waiting', label: 'Waiting', color: 'bg-blue-600', icon: '⏳' },
                { value: 'not_responding', label: 'Not Responding', color: 'bg-red-600', icon: '🚫' },
               // { value: 'resolved', label: 'Resolved', color: 'bg-green-600', icon: '✅' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`p-4 rounded-lg flex flex-col items-center transition-all duration-200 ${
                    status === option.value 
                      ? `${option.color} ring-2 ring-white ring-opacity-50` 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <span className="text-3xl mb-2">{option.icon}</span>
                  <span className="text-sm font-medium mb-1">{option.label}</span>
                  <span className={`text-xs text-center ${status === option.value ? 'text-white' : 'text-gray-400'}`}>
                    {statusDescriptions[option.value].description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Status Details */}
          <div className={`mb-6 p-4 rounded-lg border ${status === 'waiting' ? 'bg-blue-900/20 border-blue-700/30' : status === 'not_responding' ? 'bg-red-900/20 border-red-700/30' : 'bg-green-900/20 border-green-700/30'}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{statusDescriptions[status].icon}</span>
              <div>
                <h4 className={`font-semibold ${statusDescriptions[status].color}`}>
                  {statusDescriptions[status].title}
                </h4>
                <p className="text-sm text-gray-300">
                  {statusDescriptions[status].description}
                </p>
              </div>
            </div>
            
            {/* Show next follow-up info for not responding */}
            {status === 'not_responding' && nextFollowupDate && (
              <div className="mt-3 p-3 bg-red-900/30 rounded border border-red-700/30">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⏰</span>
                  <span className="text-sm text-white">
                    Next follow-up automatically scheduled for: <strong>{formatDate(nextFollowupDate)}</strong>
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  System will change status back to "pending" on {formatDate(nextFollowupDate)} for re-try
                </p>
              </div>
            )}
          </div>

          {/* Customer Response */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-medium">
              Customer Response / Notes
              <span className="text-red-400 ml-1">*</span>
            </label>
            <textarea
              value={customerResponse}
              onChange={(e) => setCustomerResponse(e.target.value)}
              placeholder="What happened during the call? (Required)"
              rows={4}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Examples: "No answer", "Line busy", "Phone switched off", "Customer refused to talk", etc.
            </p>
          </div>

          {/* Date Fields - Show only for waiting status */}
          {status === 'waiting' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">
                    Promise Date
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={promiseDate}
                    onChange={(e) => setPromiseDate(e.target.value)}
                    min={getTomorrowDate()}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    When did the customer promise to pay?
                  </p>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">
                    Next Follow-up Date
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={nextFollowupDate}
                    onChange={(e) => setNextFollowupDate(e.target.value)}
                    min={getTomorrowDate()}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    When should we follow up next?
                  </p>
                </div>
              </div>

              {/* Quick Date Buttons for Waiting Status */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2 font-medium">Quick Date Presets</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = getTomorrowDate();
                      const nextWeek = getNextWeekDate();
                      setPromiseDate(tomorrow);
                      setNextFollowupDate(nextWeek);
                    }}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                  >
                    Tomorrow + Next Week
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextWeek = getNextWeekDate();
                      setPromiseDate(nextWeek);
                      const nextMonth = new Date(nextWeek);
                      nextMonth.setDate(nextMonth.getDate() + 30);
                      setNextFollowupDate(nextMonth.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                  >
                    Next Week + Next Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const threeDays = new Date();
                      threeDays.setDate(threeDays.getDate() + 3);
                      const oneWeek = getNextWeekDate();
                      setPromiseDate(threeDays.toISOString().split('T')[0]);
                      setNextFollowupDate(oneWeek);
                    }}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                  >
                    3 Days + 1 Week
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Show next follow-up date for not responding (read-only) */}
          {status === 'not_responding' && nextFollowupDate && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">
                Next Follow-up Date (Auto-set)
              </label>
              <div className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white">
                {formatDate(nextFollowupDate)} (Tomorrow)
              </div>
              <p className="text-xs text-gray-400 mt-1">
                System automatically sets follow-up for tomorrow
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                status === 'waiting' ? 'bg-blue-600 hover:bg-blue-700' :
                status === 'not_responding' ? 'bg-red-600 hover:bg-red-700' :
                'bg-green-600 hover:bg-green-700'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  {status === 'waiting' && '✓ Mark as Waiting'}
                  {status === 'not_responding' && '⏰ Mark as Not Responding'}
                  {status === 'resolved' && '✅ Mark as Resolved'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowupModal;