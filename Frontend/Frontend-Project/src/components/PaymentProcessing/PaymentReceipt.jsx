// components/PaymentProcessing/PaymentReceipt.jsx
import React, { useEffect } from 'react';

const PaymentReceipt = ({ paymentData, onClose }) => {
  const { payment, contract, amountPaid, currentUser, timestamp, paymentId } = paymentData;
  
  // Format price
  const formatPrice = (price) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return numPrice.toFixed(2);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) {
      const now = new Date();
      return now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate remaining balance
  const totalAmount = parseFloat(contract?.total_price || 0);
  const totalPaid = parseFloat(contract?.total_paid || 0) + parseFloat(amountPaid);
  const remainingBalance = totalAmount - totalPaid;

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Auto-print on mount if needed (optional)
  useEffect(() => {
    // Uncomment the line below if you want auto-print on receipt display
    // handlePrint();
  }, []);

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0.5cm;
          }
          body * {
            visibility: hidden;
          }
          .receipt-container, .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .receipt-container {
            max-width: 450px;
            margin: 0 auto;
            min-width: 350px;
          }
        }
      `}</style>

      {/* Receipt Container */}
      <div className="receipt-container bg-white text-black p-6 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-3xl font-bold mb-2 tracking-wide">PAYMENT RECEIPT</h1>
          <p className="text-sm text-gray-600">Installment Payment Confirmation</p>
        </div>

        {/* Payment Information */}
        <div className="mb-4 space-y-2 text-sm bg-gray-50 p-3 rounded">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Payment ID:</span>
            <span className="font-mono font-bold text-gray-900">#{paymentId || payment?.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Contract ID:</span>
            <span className="font-mono font-bold text-gray-900">#{contract?.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Date & Time:</span>
            <span className="text-gray-900">{formatDate(timestamp)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Processed By:</span>
            <span className="text-gray-900">{currentUser?.username || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Worker ID:</span>
            <span className="font-mono text-gray-900">{currentUser?.id || 'N/A'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

        {/* Customer Information */}
        <div className="mb-4">
          <h2 className="font-bold text-lg mb-3 border-b-2 border-gray-400 pb-2">CUSTOMER INFORMATION</h2>
          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Name:</span>
              <span className="text-gray-900">{contract?.customer_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Phone:</span>
              <span className="text-gray-900">{contract?.customer_phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">ID Card:</span>
              <span className="text-gray-900 font-mono">{contract?.id_card_number || 'N/A'}</span>
            </div>
            {contract?.branch_name && (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Branch:</span>
                <span className="text-gray-900">{contract?.branch_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

        {/* Contract Details */}
        <div className="mb-4">
          <h2 className="font-bold text-lg mb-3 border-b-2 border-gray-400 pb-2">CONTRACT DETAILS</h2>
          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Item:</span>
              <span className="text-gray-900 font-medium">{contract?.item_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Contract Total:</span>
              <span className="text-gray-900 font-medium">${formatPrice(contract?.total_price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Down Payment:</span>
              <span className="text-gray-900">${formatPrice(contract?.installment_down_payment)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Monthly Payment:</span>
              <span className="text-gray-900">${formatPrice(contract?.monthly_payment)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Last Payment:</span>
              <span className="text-gray-900">${formatPrice(contract?.installment_last_payment)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total Months:</span>
              <span className="text-gray-900">{contract?.months} months</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

        {/* Payment Details */}
        <div className="mb-4">
          <h2 className="font-bold text-lg mb-3 border-b-2 border-gray-400 pb-2">PAYMENT DETAILS</h2>
          <div className="space-y-2 text-sm bg-blue-50 p-4 rounded border-2 border-blue-300">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Payment Type:</span>
              <span className="text-gray-900 font-medium">
                {payment?.month_number === 0 ? 'Down Payment' : `Month ${payment?.month_number}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Due Date:</span>
              <span className="text-gray-900">
                {payment?.due_date ? new Date(payment.due_date).toLocaleDateString('en-US') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold border-t-2 border-blue-400 pt-3 mt-3">
              <span className="text-green-700">AMOUNT PAID:</span>
              <span className="text-green-700">${formatPrice(amountPaid)}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

        {/* Balance Summary */}
        <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded">
          <div className="flex justify-between text-base mb-1">
            <span className="font-semibold text-gray-700">Total Contract Amount:</span>
            <span className="font-semibold text-gray-900">${formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-base mb-1">
            <span className="font-semibold text-gray-700">Previous Payments:</span>
            <span className="font-semibold text-gray-900">${formatPrice(contract?.total_paid || 0)}</span>
          </div>
          <div className="flex justify-between text-base mb-1">
            <span className="font-semibold text-green-700">This Payment:</span>
            <span className="font-bold text-green-700">${formatPrice(amountPaid)}</span>
          </div>
          <div className="flex justify-between text-base mb-1">
            <span className="font-semibold text-blue-700">Total Paid to Date:</span>
            <span className="font-bold text-blue-700">${formatPrice(totalPaid)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t-2 border-gray-800 pt-3 mt-3">
            <span className="text-gray-900">REMAINING BALANCE:</span>
            <span className={remainingBalance <= 0 ? 'text-green-700' : 'text-gray-900'}>
              ${formatPrice(Math.max(0, remainingBalance))}
            </span>
          </div>
          {remainingBalance <= 0 && (
            <div className="text-center mt-3 pt-3 border-t border-green-400">
              <p className="text-green-700 font-bold text-lg">✅ CONTRACT PAID IN FULL!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center border-t-2 border-gray-800 pt-4 mt-4">
          <p className="text-xs text-gray-600 mb-2">
            Payment Status: {payment?.status === 'paid' || remainingBalance <= 0 ? 'COMPLETED' : 'PROCESSED'}
          </p>
          <p className="text-xs text-gray-500">
            This is your official payment receipt. Please keep it for your records.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Thank you for your payment!
          </p>
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="no-print flex gap-3 mt-6 justify-center">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
        >
          🖨️ Print Receipt
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
        >
          Close
        </button>
      </div>
    </>
  );
};

export default PaymentReceipt;
