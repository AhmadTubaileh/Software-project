import React from 'react';

const PaymentForm = ({ payment, paymentAmount, setPaymentAmount, processing, onSubmit }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const remainingAmount = payment.amount_due;

  return (
    <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-blue-500/30">
      <h5 className="font-semibold mb-3">
        Process Payment for Month {payment.month_number}
      </h5>
      
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-600/30 rounded-lg">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Already Paid</p>
          <p className="font-semibold text-lg text-green-400">
            {formatCurrency(payment.amount_paid)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Remaining Due</p>
          <p className="font-semibold text-lg text-yellow-400">
            {formatCurrency(remainingAmount)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Status</p>
          <p className="font-semibold text-lg">
            {payment.status === 'partial' ? 'Partial' : 'Pending'}
          </p>
        </div>
      </div>

      {/* Payment Input */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-gray-400 text-sm mb-2 block">
            Enter Payment Amount
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-lg font-semibold"
            min="0"
            max={remainingAmount + 1000}
            step="0.01"
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={processing || !paymentAmount || parseFloat(paymentAmount) <= 0}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            '💳 Process Payment'
          )}
        </button>
      </div>

      {/* Payment Preview */}
      {paymentAmount && parseFloat(paymentAmount) > 0 && (
        <div className="mt-4 p-3 bg-gray-600/30 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Payment Preview:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Payment Amount:</span>
              <span className="font-semibold ml-2">{formatCurrency(parseFloat(paymentAmount))}</span>
            </div>
            <div>
              <span className="text-gray-400">Remaining After:</span>
              <span className={`font-semibold ml-2 ${
                (remainingAmount - parseFloat(paymentAmount)) > 0 
                  ? 'text-yellow-400' 
                  : 'text-green-400'
              }`}>
                {formatCurrency(remainingAmount - parseFloat(paymentAmount))}
              </span>
            </div>
          </div>
          
          {/* Payment Logic Explanation */}
          <div className="mt-2 text-xs text-gray-400">
            {parseFloat(paymentAmount) === remainingAmount && (
              <span className="text-green-400">✅ Exact amount - This payment will be marked as PAID</span>
            )}
            {parseFloat(paymentAmount) < remainingAmount && (
              <span className="text-blue-400">🟡 Partial payment - Remaining due will be {formatCurrency(remainingAmount - parseFloat(paymentAmount))}</span>
            )}
            {parseFloat(paymentAmount) > remainingAmount && (
              <span className="text-purple-400">
                💜 Overpayment - Extra {formatCurrency(parseFloat(paymentAmount) - remainingAmount)} will be applied to next month
              </span>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        💡 <strong>Payment Logic:</strong> 
        <br/>• <span className="text-green-400">Exact amount</span> = Mark as PAID (amount_due = 0)
        <br/>• <span className="text-blue-400">Less than due</span> = Decrease amount_due (status: partial)
        <br/>• <span className="text-purple-400">More than due</span> = Set amount_due to 0 + Apply excess to next month
      </p>
    </div>
  );
};

export default PaymentForm;