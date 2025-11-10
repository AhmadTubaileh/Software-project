import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';

function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { currentUser } = useLocalSession();

  // Access control
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Fetch pending contracts
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/contracts/pending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load contracts on component mount
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Handle approve contract
  const handleApprove = async () => {
    if (!selectedContract) return;

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/contracts/${selectedContract.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver_id: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve contract');
      }

      toast.success('Contract approved successfully!');
      setShowApproveModal(false);
      setSelectedContract(null);
      await fetchContracts(); // Refresh the list
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve contract');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject contract
  const handleReject = async () => {
    if (!selectedContract || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/contracts/${selectedContract.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver_id: currentUser.id,
          reason: rejectionReason
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject contract');
      }

      toast.success('Contract rejected successfully!');
      setShowRejectModal(false);
      setSelectedContract(null);
      setRejectionReason('');
      await fetchContracts(); // Refresh the list
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error.message || 'Failed to reject contract');
    } finally {
      setProcessing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-600', text: 'Pending Review' },
      'approved': { color: 'bg-green-600', text: 'Approved' },
      'rejected': { color: 'bg-red-600', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Contract Management
            </h1>
            <p className="text-gray-400 mt-2">
              Review and manage installment contract applications
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Pending</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {contracts.length}
                  </p>
                </div>
                <div className="text-3xl text-yellow-400">📋</div>
              </div>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Ready for Review</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {contracts.filter(c => c.approval_status === 'pending_review').length}
                  </p>
                </div>
                <div className="text-3xl text-blue-400">👁️</div>
              </div>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Admin Actions</p>
                  <p className="text-lg font-bold text-white mt-1">
                    Approve / Reject
                  </p>
                </div>
                <div className="text-3xl text-green-400">⚡</div>
              </div>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            {/* Table Header */}
            <div className="p-4 border-b border-gray-700/50">
              <h2 className="text-xl font-semibold text-white">Pending Contracts</h2>
              <p className="text-gray-400 text-sm mt-1">
                Review contract applications and make decisions
              </p>
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
                <div className="text-6xl mb-4 text-gray-600">📝</div>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Pending Contracts</h3>
                <p className="text-gray-500">All contract applications have been processed.</p>
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
                        Financials
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {contracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-white">{contract.item_name}</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Contract #{contract.id}
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
                              Total: {formatCurrency(contract.total_price)}
                            </p>
                            <p className="text-sm text-gray-400">
                              Down: {formatCurrency(contract.down_payment)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {contract.months} months × {formatCurrency(contract.monthly_payment)}/mo
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(contract.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowApproveModal(true);
                              }}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors duration-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowRejectModal(true);
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors duration-200"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => setSelectedContract(contract)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors duration-200"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Approve Confirmation Modal */}
      {showApproveModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Approve Contract</h3>
            <p className="text-gray-300 mb-2">
              Are you sure you want to approve this contract?
            </p>
            <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
              <p><strong>Customer:</strong> {selectedContract.customer_name}</p>
              <p><strong>Item:</strong> {selectedContract.item_name}</p>
              <p><strong>Total:</strong> {formatCurrency(selectedContract.total_price)}</p>
              <p><strong>Months:</strong> {selectedContract.months}</p>
            </div>
            <p className="text-yellow-400 text-sm mb-4">
              ✅ This will create payment schedule and activate the contract.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={processing}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Approve Contract'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Reject Contract</h3>
            <p className="text-gray-300 mb-4">
              Please provide a reason for rejecting this contract:
            </p>
            <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
              <p><strong>Customer:</strong> {selectedContract.customer_name}</p>
              <p><strong>Item:</strong> {selectedContract.item_name}</p>
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={processing}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Reject Contract'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractManagement;