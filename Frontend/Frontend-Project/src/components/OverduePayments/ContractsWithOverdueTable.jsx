import React, { useState } from 'react';

const ContractsWithOverdueTable = ({ 
  contracts, 
  loading, 
  searchTerm, 
  onSearch, 
  onClearSearch,
  expandedContract,
  contractDetails,
  contractAllPayments,
  contractOverdueData,
  onExpandContract,
  onAddFollowup,
  onViewHistory,
  onUpdateStatus,
  formatCurrency 
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);

  console.log('ContractsWithOverdueTable props:', {
    contractsCount: contracts?.length,
    expandedContract,
    contractAllPaymentsKeys: Object.keys(contractAllPayments || {}),
    contractDetailsKeys: Object.keys(contractDetails || {})
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  const handleClear = () => {
    setLocalSearch('');
    onClearSearch();
  };

  // Handle payment detail expansion
  const handleTogglePaymentDetails = (paymentId) => {
    if (expandedPaymentId === paymentId) {
      setExpandedPaymentId(null);
    } else {
      setExpandedPaymentId(paymentId);
    }
  };

  // Render payment row
  const renderPaymentRow = (payment, contractId) => {
    if (!payment) {
      return null;
    }
    
    const isOverdue = payment.is_overdue === true || payment.is_overdue === 1;
    const isExpanded = expandedPaymentId === payment.id;
    const overdueStatus = payment.overdue_status || payment.status;
    
    return (
      <div key={payment.id} className={`border-b border-gray-700/50 last:border-b-0 ${
        isOverdue ? 'bg-red-900/10' : 'bg-gray-800/30'
      }`}>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  isOverdue 
                    ? overdueStatus === 'pending' ? 'bg-yellow-600' :
                      overdueStatus === 'waiting' ? 'bg-blue-600' :
                      overdueStatus === 'not_responding' ? 'bg-red-600' :
                      'bg-green-600'
                    : payment.status === 'paid' ? 'bg-green-600' :
                      payment.status === 'partial' ? 'bg-blue-600' :
                      'bg-gray-600'
                }`}>
                  {isOverdue ? (overdueStatus || 'unknown') : (payment.status || 'unknown')}
                </span>
                <span className="font-medium text-white">
                  Month {payment.month_number || 'N/A'}
                </span>
                {isOverdue && (
                  <span className="text-xs px-2 py-1 bg-red-600 rounded">
                    ⚠️ OVERDUE
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Amount Due</p>
                  <p className="font-medium text-white">{formatCurrency(payment.amount_due || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Amount Paid</p>
                  <p className={`font-medium ${
                    payment.amount_paid > 0 ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {formatCurrency(payment.amount_paid || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Remaining</p>
                  <p className={`font-medium ${
                    ((payment.amount_due || 0) - (payment.amount_paid || 0)) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {formatCurrency((payment.amount_due || 0) - (payment.amount_paid || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Due Date</p>
                  <p className={`font-medium ${
                    isOverdue ? 'text-red-400' : 'text-gray-300'
                  }`}>
                    {formatDate(payment.due_date)}
                  </p>
                </div>
              </div>
              
              {/* Payment Dates */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 text-xs">
                <div>
                  <span className="text-gray-500">Bill Date: </span>
                  <span className="text-gray-300">{formatDate(payment.bill_date)}</span>
                </div>
                {payment.paid_date && (
                  <div>
                    <span className="text-gray-500">Paid Date: </span>
                    <span className="text-green-400">{formatDate(payment.paid_date)}</span>
                  </div>
                )}
                {isOverdue && payment.last_followup_date && (
                  <div>
                    <span className="text-gray-500">Last Follow-up: </span>
                    <span className="text-yellow-400">{formatDate(payment.last_followup_date)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 ml-4">
              {/* Show Details Button - Only for overdue payments */}
              {isOverdue && (
                <button
                  onClick={() => handleTogglePaymentDetails(payment.id)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    isExpanded ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {isExpanded ? '▲ Hide Details' : '▼ Show Details'}
                </button>
              )}
              
              {/* Follow-up History Button - Always visible for overdue */}
              {isOverdue && (
                <button
                  onClick={() => onViewHistory(payment)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium"
                >
                  📋 History
                </button>
              )}
              
              {/* Add Follow-up Button - Only for pending overdue payments */}
              {isOverdue && overdueStatus === 'pending' && (
                <button
                  onClick={() => onAddFollowup(payment)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium"
                >
                  📞 Follow-up
                </button>
              )}
            </div>
          </div>
          
          {/* Expanded Payment Details - Only for overdue payments */}
          {isOverdue && isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h6 className="font-semibold text-white">Follow-up Details</h6>
                  
                  {/* Quick Status Update Buttons */}
                  <div className="flex gap-1">
                    {overdueStatus !== 'pending' && (
                      <button
                        onClick={() => onUpdateStatus(payment.payment_id || payment.id, 'pending')}
                        className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
                        title="Mark as Pending"
                      >
                        📞
                      </button>
                    )}
                    {overdueStatus !== 'waiting' && (
                      <button
                        onClick={() => onUpdateStatus(payment.payment_id || payment.id, 'waiting')}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                        title="Mark as Waiting"
                      >
                        ⏳
                      </button>
                    )}
                    {overdueStatus !== 'not_responding' && (
                      <button
                        onClick={() => onUpdateStatus(payment.payment_id || payment.id, 'not_responding')}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                        title="Mark as Not Responding"
                      >
                        🚫
                      </button>
                    )}
                    {overdueStatus !== 'resolved' && (
                      <button
                        onClick={() => onUpdateStatus(payment.payment_id || payment.id, 'resolved')}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                        title="Mark as Resolved"
                      >
                        ✅
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Follow-up Information */}
                {payment.next_followup_date && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-400">Next Follow-up Date:</p>
                    <p className={`font-medium ${
                      new Date(payment.next_followup_date) <= new Date() 
                        ? 'text-red-400' 
                        : 'text-blue-400'
                    }`}>
                      {formatDate(payment.next_followup_date)}
                    </p>
                  </div>
                )}
                
                {payment.promise_date && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-400">Promise Date:</p>
                    <p className="font-medium text-yellow-400">{formatDate(payment.promise_date)}</p>
                  </div>
                )}
                
                {payment.last_response && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-400">Last Response:</p>
                    <p className="text-gray-300 bg-gray-900/30 p-2 rounded">
                      {payment.last_response}
                    </p>
                  </div>
                )}
                
                {/* Follow-up Messages */}
                {payment.followups && payment.followups.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">
                      Follow-up Messages ({payment.followups.length}):
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {payment.followups.map((followup, index) => (
                        <div key={followup.id || index} className="bg-gray-900/50 p-3 rounded border border-gray-700/50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                followup.status === 'pending' ? 'bg-yellow-600' :
                                followup.status === 'waiting' ? 'bg-blue-600' :
                                followup.status === 'not_responding' ? 'bg-red-600' :
                                'bg-green-600'
                              }`}>
                                {followup.status || 'unknown'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(followup.call_date)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              By: {followup.worker_name || 'Unknown'}
                            </span>
                          </div>
                          
                          {followup.customer_response && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-400 mb-1">Customer Response:</p>
                              <p className="text-sm text-gray-300">
                                {followup.customer_response}
                              </p>
                            </div>
                          )}
                          
                          {(followup.promise_date || followup.next_followup_date) && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {followup.promise_date && (
                                <div>
                                  <span className="text-gray-500">Promise: </span>
                                  <span className="text-yellow-400">{formatDate(followup.promise_date)}</span>
                                </div>
                              )}
                              {followup.next_followup_date && (
                                <div>
                                  <span className="text-gray-500">Next Follow-up: </span>
                                  <span className="text-blue-400">{formatDate(followup.next_followup_date)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-gray-500 text-sm">
                    No follow-up messages yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render expanded contract details
  const renderExpandedContract = (contract) => {
    const allPayments = contractAllPayments[contract.id];
    const details = contractDetails[contract.id];
    
    console.log(`Rendering expanded contract ${contract.id}:`, {
      allPaymentsCount: allPayments?.length,
      details: details
    });
    
    // Check if data is still loading or undefined
    if (!allPayments) {
      return (
        <div className="bg-gray-900/30 p-4 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="text-gray-400">Loading payment details...</p>
          </div>
        </div>
      );
    }
    
    // Separate overdue vs regular payments
    const overduePayments = allPayments.filter(p => p.is_overdue === true || p.is_overdue === 1);
    const regularPayments = allPayments.filter(p => !p.is_overdue || p.is_overdue === 0 || p.is_overdue === false);
    
    console.log(`Contract ${contract.id}:`, {
      totalPayments: allPayments.length,
      overduePayments: overduePayments.length,
      regularPayments: regularPayments.length
    });
    
    return (
      <div className="bg-gray-900/30 p-4 rounded-lg border-l-4 border-blue-500">
        {/* Contract Header Summary */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-semibold text-white text-lg">
              Contract #{contract.id} - {details?.item_name || contract.item_name}
            </h4>
            <p className="text-sm text-gray-400">
              Customer: {details?.customer_name || contract.customer_name} • 
              Phone: {details?.customer_phone || contract.customer_phone}
            </p>
          </div>
          <div className="text-right">
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-gray-400">Total Payments</p>
                <p className="text-lg font-bold text-white">{allPayments.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Overdue</p>
                <p className="text-lg font-bold text-red-400">{overduePayments.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contract Details Summary */}
        {details && (
          <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Contract Value</p>
                <p className="font-medium text-white">{formatCurrency(details.total_price || 0)}</p>
              </div>
              <div>
                <p className="text-gray-400">Down Payment</p>
                <p className="font-medium text-white">{formatCurrency(details.down_payment || 0)}</p>
              </div>
              <div>
                <p className="text-gray-400">Months</p>
                <p className="font-medium text-white">{details.months || 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Monthly</p>
                <p className="font-medium text-white">{formatCurrency(details.monthly_payment || 0)}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* All Payments List */}
        <div className="space-y-4">
          {/* Overdue Payments Section */}
          {overduePayments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl text-red-400">⚠️</span>
                <h5 className="font-semibold text-red-400 text-lg">
                  Overdue Payments ({overduePayments.length})
                </h5>
              </div>
              <div className="bg-gray-800/30 rounded-lg overflow-hidden">
                {overduePayments.map(payment => renderPaymentRow(payment, contract.id))}
              </div>
            </div>
          )}
          
          {/* Regular Payments Section */}
          {regularPayments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl text-green-400">✅</span>
                <h5 className="font-semibold text-green-400 text-lg">
                  Regular Payments ({regularPayments.length})
                </h5>
              </div>
              <div className="bg-gray-800/30 rounded-lg overflow-hidden">
                {regularPayments.map(payment => renderPaymentRow(payment, contract.id))}
              </div>
            </div>
          )}
          
          {/* No Payments */}
          {allPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-lg">No payments found for this contract</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header with Search */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Contracts with Overdue Payments</h2>
            <p className="text-gray-400 text-sm mt-1">
              {contracts.length} contract{contracts.length !== 1 ? 's' : ''} found
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1 min-w-[250px]">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by customer name..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors duration-200"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading contracts...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && contracts.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4 text-gray-600">📄</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            {searchTerm ? 'No Contracts Found' : 'No Contracts with Overdue Payments'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? `No contracts found for "${searchTerm}"`
              : 'Great! All contracts are up to date.'
            }
          </p>
          {searchTerm && (
            <button
              onClick={handleClear}
              className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Contracts List */}
      {!loading && contracts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contract Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Overdue Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {contracts.map((contract) => (
                <React.Fragment key={contract.id}>
                  <tr className={`hover:bg-gray-700/30 transition-colors duration-200 ${
                    expandedContract === contract.id ? 'bg-blue-900/20' : ''
                  }`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">
                          Contract #{contract.id}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {contract.item_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {formatDate(contract.created_at)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{contract.customer_name}</p>
                        <p className="text-sm text-gray-400">{contract.customer_phone}</p>
                        <p className="text-xs text-gray-500">
                          Processed by: {contract.worker_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white">
                          Total: {formatCurrency(contract.total_price || 0)}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-1 bg-red-600 rounded text-xs">
                            ⚠️ {contract.overdue_count || 0} overdue
                          </span>
                          <span className="px-2 py-1 bg-yellow-600 rounded text-xs">
                            📞 {contract.active_overdue_count || 0} active
                          </span>
                        </div>
                        {(contract.total_overdue_amount || 0) > 0 && (
                          <p className="text-sm text-red-400 mt-1">
                            Total overdue: {formatCurrency(contract.total_overdue_amount || 0)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onExpandContract(contract.id)}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                          expandedContract === contract.id 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {expandedContract === contract.id ? '▼ Hide Details' : '▶ Show Details'}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {expandedContract === contract.id && (
                    <tr className="bg-gray-900/50">
                      <td colSpan="4" className="px-6 py-4">
                        {contractAllPayments[contract.id] 
                          ? renderExpandedContract(contract)
                          : (
                            <div className="flex items-center justify-center gap-3 py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              <p className="text-gray-400">Loading payment details...</p>
                            </div>
                          )
                        }
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContractsWithOverdueTable;