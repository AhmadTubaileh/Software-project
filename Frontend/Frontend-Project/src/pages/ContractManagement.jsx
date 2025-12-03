import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import ImageModal from '../components/ContractSteps/ImageModal';
import ContractsTable from '../components/ContractManagement/ContractsTable';
import ContractDetailsModal from '../components/ContractManagement/ContractDetailsModal';
import ApproveModal from '../components/ContractManagement/ApproveModal';
import RejectModal from '../components/ContractManagement/RejectModal';
import StatsCards from '../components/ContractManagement/StatsCards';
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
  const [statusFilter, setStatusFilter] = useState('pending');
  const { currentUser } = useLocalSession();
  const navigate = useNavigate();

  // Access control - ALLOW ALL WORKERS (0-9) to view the page
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role < 0 && currentUser.role > 9)) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need to be logged in as a worker to access this page.</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  // Fetch contracts based on filter
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/contracts/all';
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      const data = await response.json();
      setContracts(data.contracts || []);
      setFilteredContracts(data.contracts || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
      setContracts([]);
      setFilteredContracts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch contract details and sponsors
  const fetchContractDetails = async (contractId) => {
    try {
      // Fetch contract details
      const contractResponse = await fetch(`http://localhost:5000/api/contracts/${contractId}`);
      if (!contractResponse.ok) {
        throw new Error('Failed to fetch contract details');
      }
      const contractData = await contractResponse.json();
      
      setContractDetails(contractData.contract);

      // Fetch sponsors
      const sponsorsResponse = await fetch(`http://localhost:5000/api/contracts/${contractId}/sponsors`);
      if (sponsorsResponse.ok) {
        const sponsorsData = await sponsorsResponse.json();
        setSponsors(sponsorsData.sponsors || []);
      } else {
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

  // Handle approve contract (ADMIN ONLY)
  const handleApprove = async () => {
    if (!selectedContract) return;
    if (!isAdmin) {
      toast.error('Only admin can approve contracts');
      return;
    }

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

  // Handle reject contract (ADMIN ONLY)
  const handleReject = async () => {
    if (!selectedContract || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    if (!isAdmin) {
      toast.error('Only admin can reject contracts');
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

  // Handle view details (ALL WORKERS)
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

  // Handle view image (ALL WORKERS)
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

  // Handle edit & reapply (ALL WORKERS)
  const handleEditAndReapply = async (contract) => {
    try {
      toast.loading('Loading contract data for editing...', { id: 'loading-contract' });
      
      // Fetch complete contract data including sponsors
      const [contractRes, sponsorsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/contracts/${contract.id}`),
        fetch(`http://localhost:5000/api/contracts/${contract.id}/sponsors`)
      ]);
      
      if (!contractRes.ok) {
        throw new Error('Failed to fetch contract data');
      }
      
      const contractData = await contractRes.json();
      const sponsorsData = sponsorsRes.ok ? await sponsorsRes.json() : { sponsors: [] };
      
      toast.dismiss('loading-contract');
      
      // Prepare data for contract application
      const applicationData = {
        // Customer data
        customer: {
          full_name: contractData.contract.customer_name || '',
          phone: contractData.contract.customer_phone || '',
          id_card_number: contractData.contract.customer_id_card_number || '',
          address: contractData.contract.customer_address || '',
          email: contractData.contract.customer_email || '',
          id_card_image: contractData.contract.customer_id_card_image || null
        },
        
        // Sponsors data
        sponsors: sponsorsData.sponsors.map(sponsor => ({
          full_name: sponsor.full_name || '',
          phone: sponsor.phone || '',
          id_card_number: sponsor.id_card_number || '',
          relationship: sponsor.relationship || '',
          address: sponsor.address || '',
          id_card_image: sponsor.id_card_image || null
        })),
        
        // Contract items data
        contractItems: [{
          item_id: contractData.contract.item_id,
          item_name: contractData.contract.item_name,
          item_description: contractData.contract.item_description,
          price_id: contractData.contract.price_id,
          total_price: contractData.contract.total_price,
          down_payment: contractData.contract.down_payment,
          months: contractData.contract.months,
          monthly_payment: contractData.contract.monthly_payment,
          installment_last_payment: contractData.contract.installment_last_payment,
          start_date: contractData.contract.start_date,
          quantity: 1
        }],
        
        // Original contract ID for reference
        original_contract_id: contract.id
      };
      
      // Store data in sessionStorage for contract application page
      sessionStorage.setItem('reapplyContractData', JSON.stringify(applicationData));
      
      // Navigate to contract application page
      navigate('/contract-application', { 
        state: { 
          prefillData: applicationData,
          isReapplication: true 
        } 
      });
      
    } catch (error) {
      console.error('Error loading contract for reapplication:', error);
      toast.dismiss('loading-contract');
      toast.error('Failed to load contract data for editing');
    }
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
              {isAdmin ? 'Review and manage installment contract applications' : 'View installment contract applications'}
            </p>
            {!isAdmin && (
              <div className="mt-4 bg-blue-900/20 border border-blue-500 p-3 rounded-lg inline-block">
                <p className="text-blue-300 text-sm">
                  <span className="font-bold">Note:</span> You can view all contracts. Only admins can approve/reject contracts.
                </p>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'pending', label: 'Pending Review', color: 'bg-yellow-600 hover:bg-yellow-700' },
                { value: 'active', label: 'Active', color: 'bg-green-600 hover:bg-green-700' },
                { value: 'rejected', label: 'Rejected', color: 'bg-red-600 hover:bg-red-700' },
                { value: 'completed', label: 'Completed', color: 'bg-blue-600 hover:bg-blue-700' },
                { value: 'all', label: 'All Contracts', color: 'bg-purple-600 hover:bg-purple-700' }
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
          <StatsCards contracts={contracts} />

          {/* Contracts Table */}
          <ContractsTable
            contracts={filteredContracts}
            loading={loading}
            onViewDetails={handleViewDetails}
            onApprove={(contract) => {
              if (!isAdmin) {
                toast.error('Only admin can approve contracts');
                return;
              }
              setSelectedContract(contract);
              setShowApproveModal(true);
            }}
            onReject={(contract) => {
              if (!isAdmin) {
                toast.error('Only admin can reject contracts');
                return;
              }
              setSelectedContract(contract);
              setShowRejectModal(true);
            }}
            onEditReapply={handleEditAndReapply}
            showActions={statusFilter === 'pending'}
            isAdmin={isAdmin}
          />
        </div>
      </main>

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

      {/* Approve Confirmation Modal (ADMIN ONLY) */}
      {showApproveModal && selectedContract && isAdmin && (
        <ApproveModal
          contract={selectedContract}
          processing={processing}
          onClose={() => setShowApproveModal(false)}
          onApprove={handleApprove}
        />
      )}

      {/* Reject Confirmation Modal (ADMIN ONLY) */}
      {showRejectModal && selectedContract && isAdmin && (
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

export default ContractManagement;