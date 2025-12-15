import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { apiClient } from '../shared/api/apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import './MobilePage.css';
import '../styles/theme.css';
import ContractsTable from '../components/ContractManagement/ContractsTable';
import ContractDetailsModal from '../components/ContractManagement/ContractDetailsModal';
import ApproveModal from '../components/ContractManagement/ApproveModal';
import RejectModal from '../components/ContractManagement/RejectModal';
import StatsCards from '../components/ContractManagement/StatsCards';
import ImageModal from '../components/ContractManagement/ImageModal';
import { useNavigate } from 'react-router-dom';

function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [contractDetails, setContractDetails] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [viewingImage, setViewingImage] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [allBranches, setAllBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchFilterInitialized, setBranchFilterInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { currentUser } = useLocalSession();
  const navigate = useNavigate();

  // ========== ACCESS CONTROL START ==========
  const userType = currentUser?.user_type ?? 5;
  const allowedRoles = [0, 1, 2, 3, 4];
  
  if (!allowedRoles.includes(userType)) {
    return (
      <div className="mobile-page">
        <div className="mobile-page-content">
          <div className="mobile-empty-state">
            <div>🚫</div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#ef4444' }}>
                Access Denied
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '8px' }}>
                Your account ({getRoleName(userType)}) does not have permission to access this page.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                This page is only accessible to Administrators, Managers, Supervisors, and Employees.
                Trainees cannot manage contracts.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ========== ACCESS CONTROL END ==========

  const isAdmin = currentUser?.role === 'admin';
  const canApproveReject = userType === 0 || userType === 1 || userType === 2;
  const [accessibleBranchIds, setAccessibleBranchIds] = useState([]);

  // Fetch accessible branches for the current user
  useEffect(() => {
    const fetchAccessibleBranches = async () => {
      if (!currentUser?.id) {
        setAccessibleBranchIds([]);
        return;
      }
      
      try {
        const data = await apiClient.get(`/api/employees/branches/accessible?userId=${currentUser.id}`);
        const branchIds = data.map(b => b.id);
        setAccessibleBranchIds(branchIds);
      } catch (error) {
        console.error('Error fetching accessible branches:', error);
        setAccessibleBranchIds([]);
      }
    };
    
    fetchAccessibleBranches();
  }, [currentUser]);

  // Helper function to check if user can approve/reject a specific contract
  const canApproveRejectContract = (contract) => {
    if (!canApproveReject) {
      return false;
    }
    
    if (userType === 0) {
      return true;
    }
    
    return accessibleBranchIds.includes(contract.branch_id);
  };

  // Fetch all branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const branches = await apiClient.get('/api/branches');
        setAllBranches(branches || []);
        
        if (!branchFilterInitialized && currentUser?.primary_branch_id) {
          const primaryBranchExists = branches.some(b => b.id === currentUser.primary_branch_id);
          if (primaryBranchExists) {
            setBranchFilter(currentUser.primary_branch_id.toString());
          } else {
            setBranchFilter('all');
          }
          setBranchFilterInitialized(true);
        } else if (!branchFilterInitialized) {
          setBranchFilter('all');
          setBranchFilterInitialized(true);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast.error('Failed to load branches');
        setAllBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [currentUser, branchFilterInitialized]);

  // Fetch contracts based on filter
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/contracts/all';
      
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (branchFilter !== 'all') {
        params.append('branch_id', branchFilter);
      } else {
        if (currentUser?.id) {
          params.append('userId', currentUser.id);
          params.append('userType', currentUser.user_type || 0);
          params.append('showAllBranches', 'true');
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const data = await apiClient.get(url);
      setContracts(data.contracts || []);
      // Apply search filter
      applyFilters(data.contracts || [], searchQuery);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
      setContracts([]);
      setFilteredContracts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, branchFilter, currentUser]);

  // Apply search and other filters
  const applyFilters = useCallback((contractsList, search = '') => {
    let filtered = contractsList;
    
    // Apply search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(contract => 
        contract.customer_name?.toLowerCase().includes(query) ||
        contract.item_name?.toLowerCase().includes(query) ||
        contract.id?.toString().toLowerCase().includes(query) ||
        contract.sale_id?.toString().toLowerCase().includes(query)
      );
    }
    
    setFilteredContracts(filtered);
  }, []);

  // Update filtered contracts when search changes
  useEffect(() => {
    applyFilters(contracts, searchQuery);
  }, [searchQuery, contracts, applyFilters]);

  // Fetch contract details and sponsors
  const fetchContractDetails = async (contractId) => {
    try {
      const contractData = await apiClient.get(`/api/contracts/${contractId}`);
      setContractDetails(contractData.contract);

      try {
        const sponsorsData = await apiClient.get(`/api/contracts/${contractId}/sponsors`);
        setSponsors(sponsorsData.sponsors || []);
      } catch {
        setSponsors([]);
      }

      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching contract details:', error);
      toast.error('Failed to load contract details');
    }
  };

  // Convert image data to base64
  const convertImageToBase64 = (imageData) => {
    if (!imageData) {
      return null;
    }
    
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:')) {
        return imageData;
      }
      return `data:image/jpeg;base64,${imageData}`;
    }
    
    return null;
  };

  // Load contracts when component mounts or filter changes
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Handle approve contract
  const handleApprove = async () => {
    if (!selectedContract) return;
    
    if (!canApproveRejectContract(selectedContract)) {
      toast.error('You do not have permission to approve contracts from this branch');
      return;
    }

    setProcessing(true);
    try {
      await apiClient.put(`/api/contracts/${selectedContract.id}/approve`, {
        approver_id: currentUser.id,
        user_type: currentUser.user_type || 0
      });

      toast.success('Contract approved successfully! Payment schedule created.');
      setShowApproveModal(false);
      setSelectedContract(null);
      await fetchContracts();
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
    
    if (!canApproveRejectContract(selectedContract)) {
      toast.error('You do not have permission to reject contracts from this branch');
      return;
    }

    setProcessing(true);
    try {
      await apiClient.put(`/api/contracts/${selectedContract.id}/reject`, {
        approver_id: currentUser.id,
        user_type: currentUser.user_type || 0,
        reason: rejectionReason
      });

      toast.success('Contract rejected successfully! Item quantity increased.');
      setShowRejectModal(false);
      setSelectedContract(null);
      setRejectionReason('');
      await fetchContracts();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error.message || 'Failed to reject contract');
    } finally {
      setProcessing(false);
    }
  };

  // Handle view details
  const handleViewDetails = (contract) => {
    setSelectedContract(contract);
    fetchContractDetails(contract.id);
  };

  // Handle close details modal
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setContractDetails(null);
    setSponsors([]);
    setSelectedContract(null);
  };

  // Handle view image
  const handleViewImage = (person, type = 'customer') => {
    if (person.id_card_image) {
      const imageSrc = getImageSrc(person.id_card_image);
      
      if (imageSrc) {
        setViewingImage({ 
          customer: person, 
          type,
          imageSrc: imageSrc 
        });
      } else {
        toast.error('Image format not supported');
      }
    } else {
      toast.error('No ID card image available');
    }
  };

  const handleCloseImageModal = () => {
    setViewingImage(null);
  };

  const getImageSrc = (idCardImage) => {
    return convertImageToBase64(idCardImage);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
  };

  if (!currentUser) {
    return (
      <div className="mobile-page">
        <div className="mobile-page-content">
          <div className="text-center py-8 text-gray-400">
            Please log in to view contracts
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page" style={{
      background: 'linear-gradient(180deg, #0e1830 0%, #0f172a 50%, #0e1830 100%)',
      minHeight: '100vh',
      paddingBottom: '80px'
    }}>
      <Toaster position="top-center" />
      
      {/* Sticky Header */}
      <div className="mobile-page-header" style={{
        background: 'rgba(31, 41, 55, 0.95)',
        borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="mobile-page-title" style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              Contract Management
            </h1>
            <p className="text-gray-400" style={{ fontSize: '12px' }}>
              Review and manage contracts
            </p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline"
            style={{ 
              padding: '8px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔍</span>
            Filters
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '16px'
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search contracts, customers, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-input w-full"
            style={{
              paddingLeft: '40px',
              paddingRight: '16px',
              paddingTop: '10px',
              paddingBottom: '10px',
              fontSize: '14px',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(55, 65, 81, 0.5)',
            borderRadius: '8px',
            border: '1px solid rgba(75, 85, 99, 0.3)'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#9ca3af',
                marginBottom: '6px'
              }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mobile-input w-full"
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: '6px'
                }}
              >
                <option value="all">📋 All Contracts</option>
                <option value="pending">⏳ Pending Review</option>
                <option value="active">✅ Active</option>
                <option value="rejected">❌ Rejected</option>
                <option value="completed">✓ Completed</option>
                <option value="deleted">🗑️ Deleted</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#9ca3af',
                marginBottom: '6px'
              }}>Branch</label>
              {loadingBranches ? (
                <div className="text-gray-400 text-xs">Loading branches...</div>
              ) : (
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="mobile-input w-full"
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    borderRadius: '6px'
                  }}
                >
                  <option value="all">All Branches</option>
                  {allBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Access Control Notes */}
        {!canApproveReject && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px'
          }}>
            <p style={{ fontSize: '12px', color: '#93c5fd' }}>
              <span style={{ fontWeight: 'bold' }}>Note:</span> View-only access. Only Admins, Senior Managers, and Managers can approve/reject.
            </p>
          </div>
        )}
        {canApproveReject && userType !== 0 && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '6px'
          }}>
            <p style={{ fontSize: '12px', color: '#fde047' }}>
              <span style={{ fontWeight: 'bold' }}>Note:</span> You can approve/reject contracts from your accessible branches only.
            </p>
          </div>
        )}
      </div>

      <div className="mobile-page-content">

        {/* Stats Cards - 2x2 Grid */}
        <StatsCards contracts={contracts} />

        {/* Contracts Table */}
        <ContractsTable
          contracts={filteredContracts}
          loading={loading}
          onViewDetails={handleViewDetails}
          onApprove={(contract) => {
            if (!canApproveRejectContract(contract)) {
              toast.error('You do not have permission to approve contracts from this branch');
              return;
            }
            setSelectedContract(contract);
            setShowApproveModal(true);
          }}
          onReject={(contract) => {
            if (!canApproveRejectContract(contract)) {
              toast.error('You do not have permission to reject contracts from this branch');
              return;
            }
            setSelectedContract(contract);
            setShowRejectModal(true);
          }}
          showActions={statusFilter === 'pending'}
          canApproveReject={canApproveReject}
          canApproveRejectContract={canApproveRejectContract}
          getImageSrc={getImageSrc}
        />
      </div>

      {/* Contract Details Modal */}
      {showDetailsModal && contractDetails && (
        <ContractDetailsModal
          contractDetails={contractDetails}
          sponsors={sponsors}
          onClose={handleCloseDetailsModal}
          onViewImage={handleViewImage}
          getImageSrc={getImageSrc}
        />
      )}

      {/* Image Modal */}
      {viewingImage && (
        <ImageModal
          isOpen={!!viewingImage}
          imageSrc={viewingImage.imageSrc}
          customer={viewingImage.customer}
          onClose={handleCloseImageModal}
          type={viewingImage.type}
        />
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && selectedContract && canApproveRejectContract(selectedContract) && (
        <ApproveModal
          contract={selectedContract}
          processing={processing}
          onClose={() => setShowApproveModal(false)}
          onApprove={handleApprove}
        />
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedContract && canApproveRejectContract(selectedContract) && (
        <RejectModal
          contract={selectedContract}
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

export default ContractManagement;
