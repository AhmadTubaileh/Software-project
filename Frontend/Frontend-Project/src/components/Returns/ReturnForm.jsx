import React, { useState } from 'react';

const ReturnForm = ({ cashRecord, currentUser, onProcessReturn, onCancel }) => {
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnType, setReturnType] = useState('resale');
  const [processing, setProcessing] = useState(false);

  const maxQuantity = cashRecord.available_for_return;
  const refundAmount = returnQuantity * cashRecord.price;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (returnQuantity < 1 || returnQuantity > maxQuantity) {
      return;
    }

    setProcessing(true);
    
    const returnData = {
      saleId: cashRecord.sale_id || cashRecord.saleId,
      itemId: cashRecord.item_id,
      cashRecordId: cashRecord.id,
      returnQuantity: parseInt(returnQuantity),
      returnType: returnType,
      userId: currentUser.id,
      originalPrice: cashRecord.price
    };

    try {
      await onProcessReturn(returnData);
    } catch (error) {
      console.error('Return submission error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🔄</span>
        Process Return
      </h2>
      
      {/* Item Info */}
      <div className="mb-6 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-white">{cashRecord.item_name}</h3>
            <p className="text-sm text-gray-400">From Sale #{cashRecord.sale_id || cashRecord.saleId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Original Price</p>
            <p className="text-lg font-bold text-blue-400">${cashRecord.price}</p>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Available for Return</p>
            <p className="text-xl font-bold text-green-400">{maxQuantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Original Quantity</p>
            <p className="text-xl font-bold text-blue-400">{cashRecord.quantity}</p>
          </div>
        </div>
      </div>
      
      {/* Return Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Return Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Quantity to Return
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max={maxQuantity}
              value={returnQuantity}
              onChange={(e) => setReturnQuantity(e.target.value)}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-24">
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={returnQuantity}
                onChange={(e) => {
                  const val = Math.min(Math.max(1, parseInt(e.target.value) || 1), maxQuantity);
                  setReturnQuantity(val);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-center"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Maximum: {maxQuantity} items
          </p>
        </div>
        
        {/* Return Type */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Return Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                returnType === 'resale'
                  ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setReturnType('resale')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  returnType === 'resale' ? 'bg-green-500/20' : 'bg-gray-700'
                }`}>
                  <span className={returnType === 'resale' ? 'text-green-400' : 'text-gray-400'}>
                    🔄
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">Resale Return</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Item can be resold
                  </p>
                </div>
              </div>
            </div>
            
            <div
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                returnType === 'broken'
                  ? 'bg-gradient-to-br from-red-900/30 to-orange-900/30 border-red-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setReturnType('broken')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  returnType === 'broken' ? 'bg-red-500/20' : 'bg-gray-700'
                }`}>
                  <span className={returnType === 'broken' ? 'text-red-400' : 'text-gray-400'}>
                    ⚠️
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">Broken Return</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Item is damaged
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            {returnType === 'resale' ? (
              <div className="p-3 bg-green-900/20 rounded border border-green-500/30">
                <p className="text-green-400">✓ Item will be added back to inventory</p>
                <p className="text-xs text-green-300 mt-1">Inventory quantity will increase</p>
              </div>
            ) : (
              <div className="p-3 bg-red-900/20 rounded border border-red-500/30">
                <p className="text-red-400">⚠️ Item will NOT be added back to inventory</p>
                <p className="text-xs text-red-300 mt-1">Only return tracking, no stock update</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Refund Summary */}
        <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700">
          <h4 className="font-medium text-gray-300 mb-3">Refund Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Return Quantity:</span>
              <span className="font-medium">{returnQuantity} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Price per Item:</span>
              <span className="font-medium">${cashRecord.price}</span>
            </div>
            <div className="flex justify-between text-lg border-t border-gray-700 pt-2">
              <span className="text-white font-bold">Total Refund:</span>
              <span className="text-green-400 font-bold">${refundAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing || returnQuantity < 1 || returnQuantity > maxQuantity}
            className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 ${
              processing || returnQuantity < 1 || returnQuantity > maxQuantity
                ? 'bg-gray-700 cursor-not-allowed'
                : returnType === 'resale'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                : 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700'
            }`}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : returnType === 'resale' ? (
              <span className="flex items-center justify-center gap-2">
                🔄 Process Resale Return
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                ⚠️ Process Broken Return
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Make sure this export is at the bottom
export default ReturnForm;