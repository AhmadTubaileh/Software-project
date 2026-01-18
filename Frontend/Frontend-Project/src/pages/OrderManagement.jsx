import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import OrdersTable from '../components/OrderManagement/OrdersTable';
import OrderDetailsModal from '../components/OrderManagement/OrderDetailsModal';
import ApproveModal from '../components/OrderManagement/ApproveModal';
import RejectModal from '../components/OrderManagement/RejectModal';
import StatsCards from '../components/OrderManagement/StatsCards';

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const { currentUser } = useLocalSession();

  // ========== ACCESS CONTROL START ==========
  // Get user_type from currentUser
  const userType = currentUser?.user_type ?? 5; // Default to trainee if not set
  
  // Only Admin (0), Senior Manager (1), Manager (2), and Supervisor (3) can access
  const allowedRoles = [0, 1, 2, 3];
  
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white flex items-center justify-center">
        <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400 mb-4">
              Please log in to access the Order Management system.
            </p>
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }
  
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
                This page is only accessible to Administrators, Senior Managers, Managers, and Supervisors.
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

  // Check if user can approve/reject orders (Admin, Senior Manager, Manager, Supervisor)
  const canApproveReject = userType === 0 || userType === 1 || userType === 2 || userType === 3;

  // Fetch orders based on filter
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/orders';
      
      const params = new URLSearchParams();
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log(`Fetching orders from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      console.log(`Received ${data.orders?.length || 0} orders`);
      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      const data = await response.json();
      
      setOrderDetails(data.order);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    }
  };

  // Load orders when component mounts or filter changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle approve order
  const handleApprove = async () => {
    if (!selectedOrder) return;

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${selectedOrder.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: currentUser.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve order');
      }

      toast.success('Order approved successfully!');
      setShowApproveModal(false);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve order');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject order
  const handleReject = async () => {
    if (!selectedOrder || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${selectedOrder.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: currentUser.id,
          reason: rejectionReason
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject order');
      }

      toast.success('Order rejected successfully!');
      setShowRejectModal(false);
      setSelectedOrder(null);
      setRejectionReason('');
      await fetchOrders();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error.message || 'Failed to reject order');
    } finally {
      setProcessing(false);
    }
  };

  // Handle view details
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.id);
  };

  // Handle close details modal
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setOrderDetails(null);
    setSelectedOrder(null);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
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
              Order Management
            </h1>
            <p className="text-gray-400 mt-2">
              Review and manage store orders
            </p>
            {!canApproveReject && (
              <div className="mt-4 bg-blue-900/20 border border-blue-500 p-3 rounded-lg inline-block">
                <p className="text-blue-300 text-sm">
                  <span className="font-bold">Note:</span> You can view orders. Only authorized users can approve/reject orders.
                </p>
              </div>
            )}
          </div>

          {/* Filters Section */}
          <div className="mb-6 space-y-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status Filter</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-600 hover:bg-yellow-700' },
                  { value: 'approved', label: 'Approved', color: 'bg-green-600 hover:bg-green-700' },
                  { value: 'rejected', label: 'Rejected', color: 'bg-red-600 hover:bg-red-700' },
                  { value: 'shipped', label: 'Shipped', color: 'bg-blue-600 hover:bg-blue-700' },
                  { value: 'all', label: 'All Orders', color: 'bg-purple-600 hover:bg-purple-700' }
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
          </div>

          {/* Stats Cards */}
          <StatsCards orders={orders} />

          {/* Orders Table */}
          <OrdersTable
            orders={filteredOrders}
            loading={loading}
            onViewDetails={handleViewDetails}
            onApprove={(order) => {
              setSelectedOrder(order);
              setShowApproveModal(true);
            }}
            onReject={(order) => {
              setSelectedOrder(order);
              setShowRejectModal(true);
            }}
            showActions={statusFilter === 'pending'}
            canApproveReject={canApproveReject}
          />
        </div>
      </main>

      {/* Order Details Modal */}
      {showDetailsModal && orderDetails && (
        <OrderDetailsModal
          orderDetails={orderDetails}
          onClose={handleCloseDetailsModal}
        />
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && selectedOrder && canApproveReject && (
        <ApproveModal
          order={selectedOrder}
          processing={processing}
          onClose={() => setShowApproveModal(false)}
          onApprove={handleApprove}
        />
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedOrder && canApproveReject && (
        <RejectModal
          order={selectedOrder}
          processing={processing}
          rejectionReason={rejectionReason}
          onRejectionReasonChange={setRejectionReason}
          onClose={() => {
            setShowRejectModal(false);
            setRejectionReason('');
          }}
          onReject={handleReject}
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

export default OrderManagement;
