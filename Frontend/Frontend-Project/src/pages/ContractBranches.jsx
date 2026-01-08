import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';

function ContractBranches() {
  const { currentUser } = useLocalSession();
  
  // ========== ACCESS CONTROL START ==========
  const userType = currentUser?.user_type ?? 5;
  const allowedRoles = [0, 1, 2]; // Admin, Senior Manager, Manager
  
  if (!allowedRoles.includes(userType)) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        <AdminSidebar />
        <div className="ml-64 min-h-screen flex items-center justify-center">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-4">
                Your account ({getRoleName(userType)}) does not have permission to access this page.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This page is only accessible to Administrators, Senior Managers, and Managers.
              </p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ========== ACCESS CONTROL END ==========

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('all');
  const [accessibleBranches, setAccessibleBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [expandedContracts, setExpandedContracts] = useState(new Set());
  const [summary, setSummary] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [transferring, setTransferring] = useState(false);

  // Fetch accessible branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        let url = 'http://localhost:5000/api/branches';
        
        // If not admin, get only accessible branches
        if (userType !== 0 && currentUser?.id) {
          url = `http://localhost:5000/api/employees/branches/accessible?userId=${currentUser.id}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const branches = await response.json();
          setAccessibleBranches(branches || []);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast.error('Failed to load branches');
        setAccessibleBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [currentUser, userType]);

  // Fetch contracts with branch analysis
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/contracts/branch-analysis';
      
      const params = new URLSearchParams();
      if (currentUser?.id) {
        params.append('userId', currentUser.id);
        params.append('userType', currentUser.user_type || 0);
      }
      
      if (branchFilter !== 'all') {
        params.append('branchId', branchFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      const data = await response.json();
      let filteredContracts = data.contracts || [];
      
      // Apply branch filter if specific branch selected
      if (branchFilter !== 'all') {
        filteredContracts = filteredContracts.filter(
          c => c.contract_branch_id === parseInt(branchFilter)
        );
      }
      
      setContracts(filteredContracts);
      calculateSummary(filteredContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
      setContracts([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [branchFilter, currentUser]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Calculate summary of money needed per branch
  const calculateSummary = (contractsData) => {
    const summaryMap = {};
    
    contractsData.forEach(contract => {
      const contractBranchId = contract.contract_branch_id;
      const contractBranchName = contract.contract_branch_name;
      
      if (!summaryMap[contractBranchId]) {
        summaryMap[contractBranchId] = {
          branch_id: contractBranchId,
          branch_name: contractBranchName,
          total_needed: 0,
          payments_by_branch: {}
        };
      }
      
      // Calculate money needed from each payment branch
      contract.payments.forEach(payment => {
        if (payment.status === 'paid' && payment.transactions && payment.transactions.length > 0) {
          payment.transactions.forEach(transaction => {
            const paymentBranchId = transaction.branch_id;
            const paymentBranchName = transaction.branch_name;
            const amount = parseFloat(transaction.amount_paid || 0);
            
            if (paymentBranchId !== contractBranchId) {
              // Money was paid in a different branch
              if (!summaryMap[contractBranchId].payments_by_branch[paymentBranchId]) {
                summaryMap[contractBranchId].payments_by_branch[paymentBranchId] = {
                  branch_id: paymentBranchId,
                  branch_name: paymentBranchName,
                  amount: 0
                };
              }
              
              summaryMap[contractBranchId].payments_by_branch[paymentBranchId].amount += amount;
              summaryMap[contractBranchId].total_needed += amount;
            }
          });
        }
      });
    });
    
    setSummary(Object.values(summaryMap).filter(s => s.total_needed > 0));
  };

  const toggleContract = (contractId) => {
    const newExpanded = new Set(expandedContracts);
    if (newExpanded.has(contractId)) {
      newExpanded.delete(contractId);
    } else {
      newExpanded.add(contractId);
    }
    setExpandedContracts(newExpanded);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if transaction needs transfer (payment branch != contract branch)
  const needsTransfer = (transaction, contractBranchId) => {
    return transaction.branch_id !== contractBranchId;
  };

  // Handle single transaction transfer
  const handleTransferTransaction = async (transactionId) => {
    try {
      setTransferring(true);
      const response = await fetch('http://localhost:5000/api/contracts/transfer-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_ids: [transactionId],
          userId: currentUser?.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transfer transaction');
      }

      toast.success(data.message || 'Transaction transferred successfully!');
      
      // Refresh contracts data
      await fetchContracts();
    } catch (error) {
      console.error('Transfer transaction error:', error);
      toast.error(error.message || 'Failed to transfer transaction');
    } finally {
      setTransferring(false);
    }
  };

  // Handle bulk transfer
  const handleBulkTransfer = async () => {
    if (selectedTransactions.size === 0) {
      toast.error('Please select at least one transaction to transfer');
      return;
    }

    try {
      setTransferring(true);
      const transactionIds = Array.from(selectedTransactions);
      
      const response = await fetch('http://localhost:5000/api/contracts/transfer-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_ids: transactionIds,
          userId: currentUser?.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transfer transactions');
      }

      toast.success(data.message || `Successfully transferred ${data.updated_count} transaction(s)!`);
      
      // Clear selection and refresh
      setSelectedTransactions(new Set());
      await fetchContracts();
    } catch (error) {
      console.error('Bulk transfer error:', error);
      toast.error(error.message || 'Failed to transfer transactions');
    } finally {
      setTransferring(false);
    }
  };

  // Handle transfer all for a contract
  const handleTransferAllContract = async (contract) => {
    // Collect all transaction IDs that need transfer
    const transactionIds = [];
    contract.payments.forEach(payment => {
      if (payment.transactions && payment.transactions.length > 0) {
        payment.transactions.forEach(transaction => {
          if (needsTransfer(transaction, contract.contract_branch_id)) {
            transactionIds.push(transaction.id);
          }
        });
      }
    });

    if (transactionIds.length === 0) {
      toast.info('No transactions need transfer for this contract');
      return;
    }

    try {
      setTransferring(true);
      const response = await fetch('http://localhost:5000/api/contracts/transfer-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_ids: transactionIds,
          userId: currentUser?.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transfer transactions');
      }

      toast.success(data.message || `Successfully transferred ${data.updated_count} transaction(s)!`);
      
      // Clear selection and refresh
      setSelectedTransactions(new Set());
      await fetchContracts();
    } catch (error) {
      console.error('Transfer all error:', error);
      toast.error(error.message || 'Failed to transfer transactions');
    } finally {
      setTransferring(false);
    }
  };

  // Toggle transaction selection
  const toggleTransactionSelection = (transactionId) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  // Select all transactions that need transfer for a contract
  const selectAllContractTransactions = (contract) => {
    const newSelected = new Set(selectedTransactions);
    contract.payments.forEach(payment => {
      if (payment.transactions && payment.transactions.length > 0) {
        payment.transactions.forEach(transaction => {
          if (needsTransfer(transaction, contract.contract_branch_id)) {
            newSelected.add(transaction.id);
          }
        });
      }
    });
    setSelectedTransactions(newSelected);
  };

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />
      <AdminSidebar />
      
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Contract Branches
            </h1>
            <p className="text-gray-400 mt-2">
              View contracts and track money transfers between branches
            </p>
          </div>

          {/* Branch Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Branch</label>
            {loadingBranches ? (
              <div className="text-gray-400 text-sm">Loading branches...</div>
            ) : (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
              >
                <option value="all">All Branches</option>
                {accessibleBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Bulk Transfer Actions */}
          {selectedTransactions.size > 0 && (
            <div className="bg-blue-900/20 border border-blue-500 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-blue-300 font-semibold">
                  {selectedTransactions.size} transaction(s) selected
                </p>
                <p className="text-blue-400 text-sm mt-1">
                  Click "Transfer Selected" to move them to their contract's branch
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTransactions(new Set())}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors duration-200"
                  disabled={transferring}
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleBulkTransfer}
                  disabled={transferring}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  {transferring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Transferring...
                    </>
                  ) : (
                    <>
                      <span>💸</span>
                      Transfer Selected ({selectedTransactions.size})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Summary Section */}
          {summary && summary.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 mb-6">
              <h2 className="text-xl font-semibold mb-4">Money Transfer Summary</h2>
              <div className="space-y-4">
                {summary.map((item) => (
                  <div key={item.branch_id} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{item.branch_name}</h3>
                        <p className="text-sm text-gray-400">Needs money from other branches</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-400">
                          {formatCurrency(item.total_needed)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {Object.values(item.payments_by_branch).map((paymentBranch) => (
                        <div key={paymentBranch.branch_id} className="flex justify-between items-center bg-gray-600/30 rounded p-2">
                          <span className="text-sm">
                            From <span className="font-semibold">{paymentBranch.branch_name}</span>
                          </span>
                          <span className="font-semibold text-yellow-400">
                            {formatCurrency(paymentBranch.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contracts List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-12 border border-gray-700/50 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Contracts Found</h3>
              <p className="text-gray-500">No contracts match the current filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <div
                  key={contract.contract_id}
                  className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden"
                >
                  {/* Contract Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                    onClick={() => toggleContract(contract.contract_id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {expandedContracts.has(contract.contract_id) ? '▼' : '▶'}
                          </span>
                          <div>
                            <h3 className="font-semibold text-lg">{contract.item_name}</h3>
                            <p className="text-sm text-gray-400">
                              Contract #{contract.contract_id} • {contract.customer_name}
                            </p>
                            <p className="text-xs text-blue-400 mt-1">
                              📍 Origin Branch: {contract.contract_branch_name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <p className="font-semibold text-green-400">
                            {formatCurrency(contract.total_price)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {contract.months} months × {formatCurrency(contract.monthly_payment)}/mo
                          </p>
                        </div>
                        {/* Transfer All Button */}
                        {contract.payments && contract.payments.some(payment => 
                          payment.transactions && payment.transactions.some(t => 
                            needsTransfer(t, contract.contract_branch_id)
                          )
                        ) && (
                          <button
                            onClick={() => handleTransferAllContract(contract)}
                            disabled={transferring}
                            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                            title="Transfer all transactions for this contract"
                          >
                            {transferring ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Transferring...
                              </>
                            ) : (
                              <>
                                <span>💸</span>
                                Transfer All
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contract Details (Expanded) */}
                  {expandedContracts.has(contract.contract_id) && (
                    <div className="border-t border-gray-700/50 p-4 bg-gray-900/30">
                      <div className="space-y-4">
                        {contract.payments && contract.payments.length > 0 ? (
                          contract.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold">
                                    Payment #{payment.month_number === 0 ? 'Down Payment' : `Month ${payment.month_number}`}
                                  </h4>
                                  <p className="text-sm text-gray-400">
                                    Due: {formatCurrency(payment.amount_due)} • 
                                    Paid: {formatCurrency(payment.amount_paid || 0)} • 
                                    Status: <span className={`font-semibold ${
                                      payment.status === 'paid' ? 'text-green-400' : 
                                      payment.status === 'partial' ? 'text-yellow-400' : 
                                      'text-red-400'
                                    }`}>{payment.status.toUpperCase()}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Transactions */}
                              {payment.transactions && payment.transactions.length > 0 ? (
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-gray-400">Transactions:</p>
                                    {payment.transactions.some(t => needsTransfer(t, contract.contract_branch_id)) && (
                                      <button
                                        onClick={() => selectAllContractTransactions(contract)}
                                        className="text-xs text-blue-400 hover:text-blue-300"
                                        title="Select all transactions that need transfer"
                                      >
                                        Select All for Transfer
                                      </button>
                                    )}
                                  </div>
                                  {payment.transactions.map((transaction) => {
                                    const needsTransferFlag = needsTransfer(transaction, contract.contract_branch_id);
                                    return (
                                      <div
                                        key={transaction.id}
                                        className={`bg-gray-600/30 rounded p-2 flex justify-between items-center ${
                                          needsTransferFlag ? 'border border-yellow-500/50' : ''
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 flex-1">
                                          {/* Checkbox for bulk selection */}
                                          {needsTransferFlag && (
                                            <input
                                              type="checkbox"
                                              checked={selectedTransactions.has(transaction.id)}
                                              onChange={() => toggleTransactionSelection(transaction.id)}
                                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                            />
                                          )}
                                          <div className="flex-1">
                                            <p className="text-sm">
                                              {formatCurrency(transaction.amount_paid)} • 
                                              <span className={`ml-1 ${
                                                needsTransferFlag ? 'text-yellow-400' : 'text-blue-400'
                                              }`}>
                                                Branch: {transaction.branch_name}
                                                {needsTransferFlag && ' ⚠️ Needs Transfer'}
                                              </span>
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {formatDate(transaction.payment_date)} • 
                                              Worker: {transaction.worker_name}
                                            </p>
                                          </div>
                                        </div>
                                        {/* Transfer Button */}
                                        {needsTransferFlag && (
                                          <button
                                            onClick={() => handleTransferTransaction(transaction.id)}
                                            disabled={transferring}
                                            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1 ml-2"
                                            title="Transfer this transaction to contract's branch"
                                          >
                                            {transferring ? (
                                              <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                ...
                                              </>
                                            ) : (
                                              <>
                                                <span>💸</span>
                                                Transfer
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : payment.status === 'paid' ? (
                                <p className="text-xs text-gray-500 mt-2">No transaction records found</p>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No payments found for this contract</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper function to get role name
function getRoleName(userType) {
  switch(userType) {
    case 0: return 'Administrator';
    case 1: return 'Senior Manager';
    case 2: return 'Manager';
    case 3: return 'Supervisor';
    case 4: return 'Employee';
    case 5: return 'Trainee';
    default: return 'User';
  }
}

export default ContractBranches;

