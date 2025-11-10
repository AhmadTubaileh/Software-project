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

function ContractManagement() {
  const [contracts, setContracts] = useState([]);
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

  // Fetch contract details and sponsors
  const fetchContractDetails = async (contractId) => {
    try {
      // Fetch contract details
      const contractResponse = await fetch(`http://localhost:5000/api/contracts/${contractId}`);
      if (!contractResponse.ok) {
        throw new Error('Failed to fetch contract details');
      }
      const contractData = await contractResponse.json();
      
      console.log('Contract details:', contractData.contract);
      console.log('Customer image exists:', !!contractData.contract.customer_id_card_image);
      console.log('Customer image type:', typeof contractData.contract.customer_id_card_image);
      
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

  // Convert image data to base64 - FIXED VERSION
  const convertImageToBase64 = (imageData) => {
    if (!imageData) {
      console.log('No image data provided');
      return null;
    }
    
    console.log('Image data type:', typeof imageData);
    console.log('Image data sample:', typeof imageData === 'string' ? imageData.substring(0, 30) : 'Not a string');
    
    // If it's already a base64 string (from backend conversion)
    if (typeof imageData === 'string') {
      // Check if it already has data URL prefix
      if (imageData.startsWith('data:')) {
        console.log('✓ Image already has data URL prefix');
        return imageData;
      }
      // Add data URL prefix if it's just base64
      console.log('✓ Adding data URL prefix to base64 string');
      return `data:image/jpeg;base64,${imageData}`;
    }
    
    console.log('✗ Unsupported image data type:', typeof imageData);
    return null;
  };

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

      toast.success('Contract approved successfully! Payment schedule created.');
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

      toast.success('Contract rejected successfully! Item quantity increased.');
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

  // Handle view image - FIXED VERSION
  const handleViewImage = (person, type = 'customer') => {
    console.log('=== HANDLE VIEW IMAGE DEBUG ===');
    console.log('Person:', person.full_name, 'Type:', type);
    console.log('Raw image data:', person.id_card_image);
    console.log('Image data type:', typeof person.id_card_image);
    console.log('Image data sample:', typeof person.id_card_image === 'string' ? person.id_card_image.substring(0, 50) : 'Not a string');
    
    if (person.id_card_image) {
      const imageSrc = getImageSrc(person.id_card_image);
      console.log('Generated image source:', imageSrc ? `Length: ${imageSrc.length}` : 'NULL');
      
      if (imageSrc) {
        setViewingImage({ 
          customer: person, 
          type,
          imageSrc: imageSrc 
        });
        console.log('✓ Image modal should open');
      } else {
        console.log('✗ Failed to generate image source');
        toast.error('Image format not supported');
      }
    } else {
      console.log('✗ No ID card image available');
      toast.error('No ID card image available');
    }
    console.log('=== END DEBUG ===');
  };

  const handleCloseImageModal = () => {
    setViewingImage(null);
  };

  const getImageSrc = (idCardImage) => {
    return convertImageToBase64(idCardImage);
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
          <StatsCards contracts={contracts} />

          {/* Contracts Table */}
          <ContractsTable
            contracts={contracts}
            loading={loading}
            onViewDetails={handleViewDetails}
            onApprove={(contract) => {
              setSelectedContract(contract);
              setShowApproveModal(true);
            }}
            onReject={(contract) => {
              setSelectedContract(contract);
              setShowRejectModal(true);
            }}
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

      {/* Image Modal - FIXED: Pass imageSrc directly */}
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
      {showApproveModal && selectedContract && (
        <ApproveModal
          contract={selectedContract}
          processing={processing}
          onClose={() => setShowApproveModal(false)}
          onApprove={handleApprove}
        />
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedContract && (
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