import React from 'react';

const PaymentForm = ({ payment, paymentAmount, setPaymentAmount, processing, onSubmit, contract }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  // In PaymentForm.jsx, add this helper function
const formatInputAmount = (value) => {
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    return parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return cleaned;
};

  const remainingAmount = parseFloat(payment.amount_due);
  const isDownPayment = payment.month_number === 0;
  
  // Get the exact due amount for down payment
  const downPaymentExactAmount = isDownPayment ? parseFloat(payment.amount_due) : null;
  const currentPaidAmount = parseFloat(payment.amount_paid);
  
  // Fix floating point comparison tolerance
  const tolerance = 0.01;

  // Check if amount is exact for down payment
  const isExactAmount = isDownPayment 
    ? paymentAmount && Math.abs(parseFloat(paymentAmount) - downPaymentExactAmount) <= tolerance
    : false;

  // Check if down payment is already paid
  const isDownPaymentAlreadyPaid = isDownPayment && currentPaidAmount >= downPaymentExactAmount;

  return (
    <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-blue-500/30">
      <h5 className="font-semibold mb-3">
        Process Payment for Month {payment.month_number}
        {isDownPayment && <span className="ml-2 text-yellow-400">(Down Payment)</span>}
      </h5>
      
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-600/30 rounded-lg">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Already Paid</p>
          <p className="font-semibold text-lg text-green-400">
            {formatCurrency(currentPaidAmount)}
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
            {payment.status === 'paid' ? 'Paid' : 
             payment.status === 'partial' ? 'Partial' : 'Pending'}
          </p>
        </div>
      </div>

      {/* Special message for down payment */}
      {isDownPayment && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold">Down Payment Rules:</p>
              <p className="text-sm">Must pay the exact amount: <span className="font-bold">{formatCurrency(downPaymentExactAmount)}</span></p>
              <p className="text-xs mt-1">• No partial payments allowed</p>
              <p className="text-xs">• No overpayments allowed</p>
              <p className="text-xs">• Must be paid in full to proceed</p>
              {isDownPaymentAlreadyPaid && (
                <p className="text-xs text-green-400 mt-1">
                  ✅ Down payment already completed
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Input */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-gray-400 text-sm mb-2 block">
            Enter Payment Amount
            {isDownPayment && <span className="text-yellow-400 ml-1">(Must be exact: {formatCurrency(downPaymentExactAmount)})</span>}
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => {
  const formattedValue = formatInputAmount(e.target.value);
  setPaymentAmount(formattedValue);
}}
            placeholder={isDownPayment ? formatCurrency(downPaymentExactAmount) : "0.00"}
            className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-lg font-semibold"
            min="0"
            max={isDownPayment ? downPaymentExactAmount : remainingAmount + 1000}
            step="0.01"
            disabled={isDownPaymentAlreadyPaid}
          />
          {isDownPayment && currentPaidAmount > 0 && (
            <p className="text-sm text-green-400 mt-1">
              ✅ Down payment already paid: {formatCurrency(currentPaidAmount)}
            </p>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={
            processing || 
            !paymentAmount || 
            parseFloat(paymentAmount) <= 0 ||
            (isDownPayment && 
              (!isExactAmount || isDownPaymentAlreadyPaid))
          }
          className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
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
                Math.abs(remainingAmount - parseFloat(paymentAmount)) > tolerance 
                  ? 'text-yellow-400' 
                  : 'text-green-400'
              }`}>
                {formatCurrency(Math.max(0, remainingAmount - parseFloat(paymentAmount)))}
              </span>
            </div>
          </div>
          
          {/* Payment Logic Explanation */}
          <div className="mt-2 text-xs">
            {isDownPayment ? (
              <>
                {isExactAmount && !isDownPaymentAlreadyPaid && (
                  <span className="text-green-400">✅ Exact down payment amount - This will mark the down payment as PAID</span>
                )}
                {!isExactAmount && (
                  <span className="text-red-400">❌ Down payment must be exactly {formatCurrency(downPaymentExactAmount)}</span>
                )}
                {isDownPaymentAlreadyPaid && (
                  <span className="text-green-400">✅ Down payment already completed</span>
                )}
              </>
            ) : (
              <>
                {Math.abs(parseFloat(paymentAmount) - remainingAmount) <= tolerance && (
                  <span className="text-green-400">✅ Exact amount - This payment will be marked as PAID</span>
                )}
                {parseFloat(paymentAmount) < remainingAmount - tolerance && (
                  <span className="text-blue-400">🟡 Partial payment - Remaining due will be {formatCurrency(remainingAmount - parseFloat(paymentAmount))}</span>
                )}
                {parseFloat(paymentAmount) > remainingAmount + tolerance && (
                  <span className="text-purple-400">
                    💜 Overpayment - Extra {formatCurrency(parseFloat(paymentAmount) - remainingAmount)} will be applied to next month
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        💡 <strong>Payment Logic:</strong> 
        <br/>• <span className="text-green-400">Exact amount</span> = Mark as PAID (amount_due = 0)
        <br/>• <span className="text-blue-400">Less than due</span> = Decrease amount_due (status: partial)
        {!isDownPayment && (
          <>
            <br/>• <span className="text-purple-400">More than due</span> = Set amount_due to 0 + Apply excess to next month
          </>
        )}
        {isDownPayment && (
          <>
            <br/>• <span className="text-red-400">Down Payment</span> = Must be exact amount, no partial/overpayments
          </>
        )}
      </p>
    </div>
  );
};

export default PaymentForm;