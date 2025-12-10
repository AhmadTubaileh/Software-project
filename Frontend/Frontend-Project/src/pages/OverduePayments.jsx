import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import OverdueStatsCards from '../components/OverduePayments/OverdueStatsCards';
import OverduePaymentsTable from '../components/OverduePayments/OverduePaymentsTable';
import ContractsWithOverdueTable from '../components/OverduePayments/ContractsWithOverdueTable';
import FollowupModal from '../components/OverduePayments/FollowupModal';
import FollowupHistoryModal from '../components/OverduePayments/FollowupHistoryModal';

function OverduePayments() {
  const { currentUser } = useLocalSession();
  
  // ========== ACCESS CONTROL START ==========
  // Get user_type from currentUser
  const userType = currentUser?.user_type ?? 5; // Default to trainee if not set
  
  // Only Admin (0), Senior Manager (1), Manager (2), and Supervisor (3) can access this page
  // Employee (4) and Trainee (5) cannot access
  const allowedRoles = [0, 1, 2, 3];
  
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
                This page is only accessible to Administrators, Managers, and Supervisors.
                Employees and Trainees cannot access overdue payments management.
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

  const [overduePayments, setOverduePayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [followupHistory, setFollowupHistory] = useState([]);
  const [contractAllPayments, setContractAllPayments] = useState({});
  const [expandedPaymentDetails, setExpandedPaymentDetails] = useState({});
  
  const [stats, setStats] = useState({
    total_overdue: 0,
    pending_count: 0,
    waiting_count: 0,
    not_responding_count: 0,
    resolved_count: 0,
    total_overdue_amount: 0,
    active_contracts_count: 0
  });
  
  // New state for view toggling
  const [activeView, setActiveView] = useState('payments'); // 'payments' or 'contracts'
  const [expandedContract, setExpandedContract] = useState(null);
  const [contractDetails, setContractDetails] = useState({});
  const [contractOverdueData, setContractOverdueData] = useState({});
  
  // Debug logging
  useEffect(() => {
    console.log('contractAllPayments state:', contractAllPayments);
    console.log('expandedContract:', expandedContract);
  }, [contractAllPayments, expandedContract]);

  // Remove the old access control that was checking user_type range
  // We already checked user_type at the beginning

  // Auto-sync on page load
  useEffect(() => {
    syncOverduePayments();
    fetchStats();
    fetchContracts();
  }, []);

  // Fetch data when filter changes (for payments view)
  useEffect(() => {
    if (!syncLoading && activeView === 'payments') {
      fetchOverduePayments();
    }
  }, [statusFilter, syncLoading, activeView]);

  // Auto-sync overdue payments
  const syncOverduePayments = async () => {
    try {
      setSyncLoading(true);
      const response = await fetch('http://localhost:5000/api/overdue/sync');
      
      if (!response.ok) {
        throw new Error('Failed to sync overdue payments');
      }
      
      const data = await response.json();
      console.log('Sync result:', data);
      
      if (data.stats.added > 0 || data.stats.resolved > 0 || data.stats.status_changed > 0) {
        toast.success(`Synced: ${data.stats.added} new, ${data.stats.resolved} resolved, ${data.stats.status_changed} status changed`);
      }
      
      // Refresh data based on current view
      if (activeView === 'payments') {
        fetchOverduePayments();
      } else {
        fetchContracts();
      }
      
      fetchStats();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync overdue payments');
    } finally {
      setSyncLoading(false);
    }
  };

  // Fetch overdue payments with filter (for payments view)
  const fetchOverduePayments = async () => {
    try {
      setLoading(true);
      let url = `http://localhost:5000/api/overdue/summary?status=${statusFilter}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch overdue payments');
      }
      
      const data = await response.json();
      setOverduePayments(data.overdue_payments || []);
    } catch (error) {
      console.error('Fetch overdue payments error:', error);
      toast.error('Failed to load overdue payments');
      setOverduePayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contracts with overdue payments (for contracts view)
  const fetchContracts = async (search = '') => {
    try {
      setContractsLoading(true);
      let url = 'http://localhost:5000/api/overdue/contracts';
      
      if (search && search.trim().length >= 2) {
        url = `http://localhost:5000/api/overdue/contracts/search?customer_name=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      const data = await response.json();
      setContracts(data.contracts || []);
      
      // Clear expanded contract if it's not in the results
      if (expandedContract && !data.contracts.some(c => c.id === expandedContract)) {
        setExpandedContract(null);
      }
    } catch (error) {
      console.error('Fetch contracts error:', error);
      toast.error('Failed to load contracts');
      setContracts([]);
    } finally {
      setContractsLoading(false);
    }
  };

  // Fetch detailed contract payments with follow-ups
  const fetchContractDetails = async (contractId) => {
    try {
      console.log(`Fetching details for contract ${contractId}`);
      
      const response = await fetch(`http://localhost:5000/api/overdue/contract/${contractId}/detailed-payments`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contract details');
      }
      
      const data = await response.json();
      console.log('Contract details response:', data);
      
      setContractDetails(prev => ({
        ...prev,
        [contractId]: data.contract
      }));
      
      setContractAllPayments(prev => ({
        ...prev,
        [contractId]: data.all_payments || []
      }));
      
      setContractOverdueData(prev => ({
        ...prev,
        [contractId]: data.overdue_payments || []
      }));
      
      return data;
    } catch (error) {
      console.error('Fetch contract details error:', error);
      toast.error('Failed to load contract details');
      return null;
    }
  };

  // Handle contract expansion
  const handleExpandContract = async (contractId) => {
    console.log('handleExpandContract called with:', contractId);
    console.log('Current expandedContract:', expandedContract);
    
    if (expandedContract === contractId) {
      // Collapse
      console.log('Collapsing contract');
      setExpandedContract(null);
    } else {
      // Expand
      console.log('Expanding contract:', contractId);
      setExpandedContract(contractId);
      
      // Check if we already have the details
      if (!contractAllPayments[contractId] || contractAllPayments[contractId].length === 0) {
        console.log(`Fetching details for contract ${contractId}...`);
        await fetchContractDetails(contractId);
      } else {
        console.log(`Using cached data for contract ${contractId}`);
      }
    }
  };

  // Fetch follow-up history (for both views)
  const fetchFollowupHistory = async (paymentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/overdue/${paymentId}/followups`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch follow-up history');
      }
      
      const data = await response.json();
      setFollowupHistory(data.followups || []);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Fetch follow-up history error:', error);
      toast.error('Failed to load follow-up history');
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/overdue/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      setStats(data.stats || {});
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  // Handle add follow-up
  const handleAddFollowup = (payment) => {
    console.log('Adding follow-up for payment:', payment);
    setSelectedPayment(payment);
    setShowFollowupModal(true);
  };

  // Handle view history
  const handleViewHistory = (payment) => {
    console.log('Viewing history for payment:', payment);
    setSelectedPayment(payment);
    fetchFollowupHistory(payment.payment_id || payment.id);
  };

  // Submit follow-up
  const handleSubmitFollowup = async (followupData) => {
    try {
      if (!selectedPayment) {
        toast.error('No payment selected');
        return;
      }
      
      const paymentId = selectedPayment.payment_id || selectedPayment.id;
      const response = await fetch(`http://localhost:5000/api/overdue/${paymentId}/followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: currentUser.id,
          ...followupData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit follow-up');
      }

      toast.success('Follow-up recorded successfully!');
      setShowFollowupModal(false);
      setSelectedPayment(null);
      
      // Refresh data based on current view
      if (activeView === 'payments') {
        fetchOverduePayments();
      } else if (expandedContract) {
        await fetchContractDetails(expandedContract);
      }
      
      fetchStats();
    } catch (error) {
      console.error('Submit followup error:', error);
      toast.error(error.message || 'Failed to record follow-up');
    }
  };

  // Handle manual status update
  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/overdue/${paymentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          last_worker_id: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      toast.success(`Status updated to ${newStatus}`);
      
      // Refresh data based on current view
      if (activeView === 'payments') {
        fetchOverduePayments();
      } else if (expandedContract) {
        await fetchContractDetails(expandedContract);
      }
      
      fetchStats();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  // Handle search in contracts view
  const handleSearchContracts = (searchValue) => {
    setSearchTerm(searchValue);
    fetchContracts(searchValue);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    fetchContracts();
  };

  // Handle filter change (only for payments view)
  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
  };

  // Toggle between views
  const handleViewToggle = (view) => {
    setActiveView(view);
    if (view === 'contracts' && contracts.length === 0) {
      fetchContracts();
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Overdue Payments Management
                </h1>
                <p className="text-gray-400 mt-2">
                  Track and follow up on overdue installment payments
                </p>
              </div>
              <button
                onClick={syncOverduePayments}
                disabled={syncLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                {syncLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    🔄 Sync Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* View Toggle Buttons */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
              <button
                onClick={() => handleViewToggle('payments')}
                className={`px-6 py-3 font-medium transition-colors duration-200 ${
                  activeView === 'payments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📋 View by Payments
              </button>
              <button
                onClick={() => handleViewToggle('contracts')}
                className={`px-6 py-3 font-medium transition-colors duration-200 ${
                  activeView === 'contracts'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📄 View by Contracts
              </button>
            </div>
          </div>

          {/* Payments View */}
          {activeView === 'payments' && (
            <>
              {/* Status Filter */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'pending', label: 'Pending (Need Call)', color: 'bg-yellow-600 hover:bg-yellow-700' },
                    { value: 'waiting', label: 'Waiting', color: 'bg-blue-600 hover:bg-blue-700' },
                    { value: 'not_responding', label: 'Not Responding', color: 'bg-red-600 hover:bg-red-700' },
                    { value: 'resolved', label: 'Resolved', color: 'bg-green-600 hover:bg-green-700' },
                    { value: 'all', label: 'All Overdue', color: 'bg-purple-600 hover:bg-purple-700' }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => handleFilterChange(filter.value)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        statusFilter === filter.value 
                          ? filter.color.replace('hover:', '') + ' ring-2 ring-white ring-opacity-50' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats Cards */}
              <OverdueStatsCards stats={stats} />

              {/* Overdue Payments Table */}
              <div className="mb-8">
                <OverduePaymentsTable
                  payments={overduePayments}
                  loading={loading}
                  statusFilter={statusFilter}
                  onAddFollowup={handleAddFollowup}
                  onViewHistory={handleViewHistory}
                  onUpdateStatus={handleUpdateStatus}
                  formatCurrency={formatCurrency}
                />
              </div>
            </>
          )}

          {/* Contracts View */}
          {activeView === 'contracts' && (
            <div className="mb-8">
              <ContractsWithOverdueTable
                contracts={contracts}
                loading={contractsLoading}
                searchTerm={searchTerm}
                onSearch={handleSearchContracts}
                onClearSearch={handleClearSearch}
                expandedContract={expandedContract}
                contractDetails={contractDetails}
                contractAllPayments={contractAllPayments}
                contractOverdueData={contractOverdueData}
                onExpandContract={handleExpandContract}
                onAddFollowup={handleAddFollowup}
                onViewHistory={handleViewHistory}
                onUpdateStatus={handleUpdateStatus}
                formatCurrency={formatCurrency}
              />
            </div>
          )}
        </div>
      </main>

      {/* Follow-up Modal */}
      {showFollowupModal && selectedPayment && (
        <FollowupModal
          payment={selectedPayment}
          onClose={() => {
            setShowFollowupModal(false);
            setSelectedPayment(null);
          }}
          onSubmit={handleSubmitFollowup}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Follow-up History Modal */}
      {showHistoryModal && selectedPayment && (
        <FollowupHistoryModal
          payment={selectedPayment}
          followups={followupHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedPayment(null);
            setFollowupHistory([]);
          }}
          formatCurrency={formatCurrency}
        />
      )}
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

export default OverduePayments;