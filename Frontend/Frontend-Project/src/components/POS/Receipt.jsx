// components/POS/Receipt.jsx
import React, { useEffect } from 'react';

const Receipt = ({ saleData, onClose }) => {
  const { saleId, cart, total, currentUser, timestamp } = saleData;
  
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

  // Calculate subtotal
  const subtotal = cart.reduce((sum, item) => {
    const originalPrice = item.original_price || item.price_cash;
    return sum + (originalPrice * item.qty);
  }, 0);

  // Calculate discount
  const discount = subtotal - total;

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
            max-width: 400px;
            margin: 0 auto;
            min-width: 300px;
          }
        }
      `}</style>

      {/* Receipt Container */}
      <div className="receipt-container bg-white text-black p-6 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-3xl font-bold mb-2 tracking-wide">STORE RECEIPT</h1>
          <p className="text-sm text-gray-600">Thank you for your purchase!</p>
        </div>

        {/* Sale Information */}
        <div className="mb-4 space-y-2 text-sm bg-gray-50 p-3 rounded">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Sale ID:</span>
            <span className="font-mono font-bold text-gray-900">#{saleId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Date & Time:</span>
            <span className="text-gray-900">{formatDate(timestamp)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Cashier ID:</span>
            <span className="font-mono text-gray-900">{currentUser?.id || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Cashier Name:</span>
            <span className="text-gray-900">{currentUser?.username || 'N/A'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

        {/* Items List */}
        <div className="mb-4">
          <h2 className="font-bold text-lg mb-3 border-b-2 border-gray-400 pb-2">ITEMS PURCHASED</h2>
          <div className="space-y-3">
            {cart.map((item, index) => {
              const itemTotal = (item.price_cash * item.qty);
              const originalPrice = item.original_price || item.price_cash;
              const hasDiscount = item.price_cash !== originalPrice;
              
              return (
                <div key={index} className="border-b border-gray-300 pb-3 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-base text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-600 mt-1 italic">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <div className="text-gray-700">
                      <span className="font-semibold">${formatPrice(item.price_cash)}</span>
                      <span className="text-gray-500 mx-1">×</span>
                      <span className="font-semibold">{item.qty}</span>
                      {hasDiscount && (
                        <span className="text-red-600 ml-2 text-xs line-through">
                          was ${formatPrice(originalPrice)}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-lg text-gray-900">${formatPrice(itemTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

        {/* Totals */}
        <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded">
          <div className="flex justify-between text-base mb-1">
            <span className="font-semibold text-gray-700">Subtotal:</span>
            <span className="font-semibold text-gray-900">${formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-base mb-1">
              <span className="font-semibold text-green-700">Discount Applied:</span>
              <span className="font-bold text-green-700">-${formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold border-t-2 border-gray-800 pt-3 mt-3">
            <span className="text-gray-900">TOTAL:</span>
            <span className="text-gray-900">${formatPrice(total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t-2 border-gray-800 pt-4 mt-4">
          <p className="text-xs text-gray-600 mb-2">
            Items: {cart.length} | Units: {cart.reduce((sum, item) => sum + item.qty, 0)}
          </p>
          <p className="text-xs text-gray-500">
            This is your receipt. Please keep it for your records.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Thank you for shopping with us!
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

export default Receipt;

