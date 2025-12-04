import React from 'react';

const PaymentForm = ({ payment, paymentAmount, setPaymentAmount, processing, onSubmit, contract }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00' || dateString === 'null' || dateString === 'NULL') {
      return 'N/A';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to fix floating point precision
  const toFixedNumber = (num, decimals = 2) => {
    return parseFloat(parseFloat(num).toFixed(decimals));
  };

  const originalDueAmount = toFixedNumber(payment.amount_due);
  const currentPaidAmount = toFixedNumber(payment.amount_paid);
  const remainingAmount = Math.max(0, originalDueAmount - currentPaidAmount);
  const isDownPayment = payment.month_number === 0;
  
  // Get the exact due amount for down payment
  const downPaymentExactAmount = isDownPayment ? originalDueAmount : null;
  
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
      
      {/* Payment Details Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-600/30 rounded-lg">
        <div>
          <p className="text-gray-400 text-sm mb-2">Payment Details</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Bill Date:</span>
              <span className="font-medium">{formatDate(payment.bill_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Due Date:</span>
              <span className={`font-medium ${isDownPayment ? 'text-yellow-400' : ''}`}>
                {isDownPayment ? 'Immediate' : formatDate(payment.due_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Month:</span>
              <span className="font-medium">#{payment.month_number}</span>
            </div>
          </div>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm mb-2">Amount Details</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Original Due:</span>
              <span className="font-medium">{formatCurrency(originalDueAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Already Paid:</span>
              <span className="font-medium text-green-400">{formatCurrency(currentPaidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Remaining Due:</span>
              <span className={`font-medium ${remainingAmount > 0.01 ? 'text-yellow-400' : 'text-green-400'}`}>
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-600/30 rounded-lg">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Original Due</p>
          <p className="font-semibold text-lg">
            {formatCurrency(originalDueAmount)}
          </p>
        </div>
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
      </div>

      {/* Special message for down payment */}
      {isDownPayment && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold">Down Payment Rules:</p>
              <p className="text-sm">Must pay the exact amount: <span className="font-bold">{formatCurrency(downPaymentExactAmount)}</span></p>
              <div className="text-xs mt-1 space-y-1">
                <p>• Original Due: {formatCurrency(originalDueAmount)}</p>
                <p>• Already Paid: {formatCurrency(currentPaidAmount)}</p>
                <p>• Remaining: {formatCurrency(remainingAmount)}</p>
                <p>• No partial payments allowed</p>
                <p>• No overpayments allowed</p>
              </div>
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
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty or valid numbers
                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                  setPaymentAmount(value);
                }
              }}
              placeholder={isDownPayment ? formatCurrency(downPaymentExactAmount) : formatCurrency(remainingAmount)}
              className="flex-1 px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-lg font-semibold"
              min="0"
              max={isDownPayment ? downPaymentExactAmount : remainingAmount + 1000}
              step="0.01"
              disabled={isDownPaymentAlreadyPaid}
            />
            <button
              type="button"
              onClick={() => setPaymentAmount(remainingAmount.toFixed(2))}
              className="px-3 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm transition-colors duration-200"
              title="Fill with remaining amount"
            >
              Fill Remaining
            </button>
          </div>
          {isDownPayment && currentPaidAmount > 0 && (
            <p className="text-sm text-green-400 mt-1">
              ✅ Down payment already paid: {formatCurrency(currentPaidAmount)} of {formatCurrency(originalDueAmount)}
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
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Payment Amount:</span>
              <span className="font-semibold ml-2 text-lg">{formatCurrency(parseFloat(paymentAmount))}</span>
            </div>
            <div>
              <span className="text-gray-400">Will be Paid:</span>
              <span className="font-semibold ml-2 text-lg">
                {formatCurrency(parseFloat(paymentAmount) + currentPaidAmount)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Remaining After:</span>
              <span className={`font-semibold ml-2 text-lg ${
                Math.abs(remainingAmount - parseFloat(paymentAmount)) > tolerance 
                  ? 'text-yellow-400' 
                  : 'text-green-400'
              }`}>
                {formatCurrency(Math.max(0, remainingAmount - parseFloat(paymentAmount)))}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Completion:</span>
              <span className={`font-semibold ml-2 text-lg ${
                (parseFloat(paymentAmount) + currentPaidAmount) >= originalDueAmount
                  ? 'text-green-400' 
                  : 'text-blue-400'
              }`}>
                {(((parseFloat(paymentAmount) + currentPaidAmount) / originalDueAmount) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* Payment Logic Explanation */}
          <div className="mt-3 pt-3 border-t border-gray-600/50">
            <div className="text-xs">
              {isDownPayment ? (
                <>
                  {isExactAmount && !isDownPaymentAlreadyPaid && (
                    <div className="text-green-400 space-y-1">
                      <p>✅ Exact down payment amount - This will mark the down payment as PAID</p>
                      <p>• Will pay: {formatCurrency(parseFloat(paymentAmount))}</p>
                      <p>• Total paid after: {formatCurrency(parseFloat(paymentAmount) + currentPaidAmount)}</p>
                      <p>• Completion: 100%</p>
                    </div>
                  )}
                  {!isExactAmount && (
                    <div className="text-red-400">
                      ❌ Down payment must be exactly {formatCurrency(downPaymentExactAmount)}
                      <p className="mt-1">• You entered: {formatCurrency(parseFloat(paymentAmount))}</p>
                      <p>• Required: {formatCurrency(downPaymentExactAmount)}</p>
                      <p>• Difference: {formatCurrency(Math.abs(parseFloat(paymentAmount) - downPaymentExactAmount))}</p>
                    </div>
                  )}
                  {isDownPaymentAlreadyPaid && (
                    <span className="text-green-400">✅ Down payment already completed</span>
                  )}
                </>
              ) : (
                <>
                  {Math.abs(parseFloat(paymentAmount) - remainingAmount) <= tolerance && (
                    <div className="text-green-400 space-y-1">
                      <p>✅ Exact amount - This payment will be marked as PAID</p>
                      <p>• Will pay: {formatCurrency(parseFloat(paymentAmount))}</p>
                      <p>• Total paid for this month: {formatCurrency(parseFloat(paymentAmount) + currentPaidAmount)}</p>
                      <p>• Completion: 100%</p>
                    </div>
                  )}
                  {parseFloat(paymentAmount) < remainingAmount - tolerance && (
                    <div className="text-blue-400 space-y-1">
                      <p>🟡 Partial payment</p>
                      <p>• Will pay: {formatCurrency(parseFloat(paymentAmount))}</p>
                      <p>• Remaining due after: {formatCurrency(remainingAmount - parseFloat(paymentAmount))}</p>
                      <p>• Total paid for this month: {formatCurrency(parseFloat(paymentAmount) + currentPaidAmount)}</p>
                      <p>• Completion: {(((parseFloat(paymentAmount) + currentPaidAmount) / originalDueAmount) * 100).toFixed(1)}%</p>
                    </div>
                  )}
                  {parseFloat(paymentAmount) > remainingAmount + tolerance && (
                    <div className="text-purple-400 space-y-1">
                      <p>💜 Overpayment</p>
                      <p>• Will pay: {formatCurrency(parseFloat(paymentAmount))}</p>
                      <p>• Extra amount: {formatCurrency(parseFloat(paymentAmount) - remainingAmount)}</p>
                      <p>• Extra will be applied to next month's payment</p>
                      <p>• This payment will be marked as PAID (100%)</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
        <p className="text-xs text-gray-400">
          💡 <strong>Payment Summary:</strong> 
          <br/>• <span className="text-gray-300">Original Due:</span> {formatCurrency(originalDueAmount)}
          <br/>• <span className="text-green-400">Already Paid:</span> {formatCurrency(currentPaidAmount)}
          <br/>• <span className="text-yellow-400">Remaining Due:</span> {formatCurrency(remainingAmount)}
          <br/>• <span className="text-blue-400">Status:</span> {payment.status.toUpperCase()}
          {!isDownPayment && (
            <>
              <br/>• <span className="text-blue-400">Bill Date:</span> {formatDate(payment.bill_date)}
              <br/>• <span className={payment.due_date ? 'text-blue-400' : 'text-gray-400'}>Due Date:</span> {formatDate(payment.due_date)}
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default PaymentForm;