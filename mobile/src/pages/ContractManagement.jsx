import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { apiClient } from '../shared/api/apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Check, X, Calendar, User, Phone, DollarSign, FileText, Clock, CheckCircle, ClipboardList } from 'lucide-react';

// Shadcn Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';

// Your components
import StatsCards from '../components/ContractManagement/StatsCards';
import ContractDetailsModal from '../components/ContractManagement/ContractDetailsModal';
import ApproveModal from '../components/ContractManagement/ApproveModal';
import RejectModal from '../components/ContractManagement/RejectModal';
import ImageModal from '../components/ContractManagement/ImageModal';

// Your existing CSS
import './MobilePage.css';

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

  // ========== ACCESS CONTROL ==========
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

  const canApproveReject = userType === 0 || userType === 1 || userType === 2;
  const [accessibleBranchIds, setAccessibleBranchIds] = useState([]);

  // Fetch accessible branches
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

  // Check if user can approve/reject specific contract
  const canApproveRejectContract = (contract) => {
    if (!canApproveReject) return false;
    if (userType === 0) return true;
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
          setBranchFilter(primaryBranchExists ? currentUser.primary_branch_id.toString() : 'all');
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

  // Fetch contracts
  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/contracts/all';
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (branchFilter !== 'all') params.append('branch_id', branchFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const data = await apiClient.get(url);
      setContracts(data.contracts || []);
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

  // Apply filters
  const applyFilters = useCallback((contractsList, search = '') => {
    let filtered = contractsList;
    
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

  // Update filtered contracts
  useEffect(() => {
    applyFilters(contracts, searchQuery);
  }, [searchQuery, contracts, applyFilters]);

  // Fetch contract details
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

  // Convert image data to base64 - matches frontend working version exactly
  const convertImageToBase64 = (imageData) => {
    if (!imageData) {
      return null;
    }
    
    if (typeof imageData === 'string') {
      // If it's already a data URL, return as is
      if (imageData.startsWith('data:')) {
        return imageData;
      }
      // Otherwise assume it's base64 from database and prepend data URL prefix
      return `data:image/jpeg;base64,${imageData}`;
    }
    
    return null;
  };

  // ALTERNATIVE SOLUTION: If images still don't work, uncomment this and use it instead
  // This version handles edge cases like whitespace and validates base64 format
  /*
  const convertImageToBase64 = (imageData) => {
    if (!imageData) return null;
    
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:')) {
        return imageData;
      }
      
      // Clean the base64 string: remove whitespace, newlines, and existing prefixes
      let cleaned = imageData.trim().replace(/\s/g, '').replace(/^data:image\/[^;]+;base64,/, '');
      
      // Basic validation - check if it looks like base64
      if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
        console.error('Invalid base64 format');
        return null;
      }
      
      return `data:image/jpeg;base64,${cleaned}`;
    }
    
    return null;
  };
  */

  // Load contracts
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Handle approve
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

  // Handle reject
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

  // View details
  const handleViewDetails = (contract) => {
    setSelectedContract(contract);
    fetchContractDetails(contract.id);
  };

  // Close details modal
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setContractDetails(null);
    setSponsors([]);
    setSelectedContract(null);
  };

  // View image
  const handleViewImage = (person, type = 'customer') => {
    if (person.id_card_image) {
      const imageSrc = convertImageToBase64(person.id_card_image);
      if (imageSrc) {
        setViewingImage({ 
          customer: person, 
          type,
          imageSrc 
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
    <div className="mobile-page">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="mobile-page-header">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex-1 min-w-0 pr-2">
              <h1 className="mobile-page-title text-lg sm:text-xl md:text-2xl leading-tight">Contract Management</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-snug">Review and manage contracts</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5 sm:gap-2 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white text-xs sm:text-sm shrink-0 px-2 sm:px-3"
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search contracts, customers, items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 text-white placeholder:text-gray-400 focus:border-gray-600"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 rounded-lg">
              <div>
                <label className="text-xs font-medium mb-2 block text-white">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📋 All Contracts</SelectItem>
                    <SelectItem value="pending">⏳ Pending Review</SelectItem>
                    <SelectItem value="active">✅ Active</SelectItem>
                    <SelectItem value="rejected">❌ Rejected</SelectItem>
                    <SelectItem value="completed">✓ Completed</SelectItem>
                    <SelectItem value="deleted">🗑️ Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block text-white">Branch</label>
                {loadingBranches ? (
                  <p className="text-xs text-muted-foreground">Loading branches...</p>
                ) : (
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="w-full bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {allBranches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Access Notes */}
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            {!canApproveReject && (
              <div className="p-2.5 sm:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300 leading-relaxed">
                  <span className="font-bold">Note:</span> View-only access. Only Admins, Senior Managers, and Managers can approve/reject.
                </p>
              </div>
            )}
            {canApproveReject && userType !== 0 && (
              <div className="p-2.5 sm:p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-300 leading-relaxed">
                  <span className="font-bold">Note:</span> You can approve/reject contracts from your accessible branches only.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mobile-page-content px-3 sm:px-4 py-3 sm:py-4">
        {/* Stats Cards */}
        <StatsCards contracts={contracts} />

        {/* Contracts List */}
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <Card className="p-8 text-center bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              <p className="mt-3 text-sm text-muted-foreground">Loading contracts...</p>
            </Card>
          ) : filteredContracts.length === 0 ? (
            <Card className="p-8 text-center bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No contracts found</p>
            </Card>
          ) : (
            filteredContracts.map((contract) => (
              <Card key={contract.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                <CardHeader className="pb-2.5 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                  <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4">
                    <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                      <CardTitle className="text-sm sm:text-base font-semibold truncate mb-1 sm:mb-1.5 md:mb-2 leading-tight">{contract.item_name || 'Unknown Item'}</CardTitle>
                      <CardDescription className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mt-0.5 sm:mt-1 md:mt-1.5 text-[10px] sm:text-xs">
                        <span>#{contract.id}</span>
                        {contract.branch_name && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[100px] sm:max-w-[120px]">{contract.branch_name}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 ${
                        contract.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        contract.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        contract.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        contract.status === 'completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}
                    >
                      {contract.status === 'pending' ? '⏳' :
                       contract.status === 'active' ? '✅' :
                       contract.status === 'rejected' ? '❌' :
                       contract.status === 'completed' ? '✓' : '🗑️'} 
                      <span className="hidden sm:inline ml-1">{contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4 md:space-y-5 py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6">
                  {/* Relationship Info */}
                  {(contract.original_contract_info || contract.replacement_contract_info) && (
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 pb-1.5 sm:pb-2">
                      {contract.original_contract_info && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs bg-blue-500/20 text-blue-300 px-1.5 sm:px-2 py-0.5">
                          🔄 Reapplication
                        </Badge>
                      )}
                      {contract.replacement_contract_info && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs bg-gray-500/20 text-gray-300 px-1.5 sm:px-2 py-0.5">
                          🔁 Replacement
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Customer Section */}
                  <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5">
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5 md:mb-2">
                      <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 shrink-0" />
                      <span>Customer</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold mb-1 sm:mb-1.5 md:mb-2 leading-tight">{contract.customer_name || 'Unknown Customer'}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                        <span className="truncate">{contract.customer_phone || 'N/A'}</span>
                      </div>
                      <span className="shrink-0">•</span>
                      <span className="truncate">Worker: {contract.worker_name || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Financial Section */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs pt-1.5 sm:pt-2">
                    <div className="space-y-0.5 sm:space-y-1 md:space-y-1.5">
                      <p className="text-muted-foreground mb-1 sm:mb-1.5 md:mb-2 leading-tight">Total Price</p>
                      <p className="font-semibold text-[10px] sm:text-xs md:text-sm leading-tight">{formatCurrency(contract.total_price || 0)}</p>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1 md:space-y-1.5">
                      <p className="text-muted-foreground mb-1 sm:mb-1.5 md:mb-2 leading-tight">Down Payment</p>
                      <p className="font-semibold text-[10px] sm:text-xs md:text-sm leading-tight">{formatCurrency(contract.down_payment || 0)}</p>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1 md:space-y-1.5">
                      <p className="text-muted-foreground mb-1 sm:mb-1.5 md:mb-2 leading-tight">Monthly</p>
                      <p className="font-semibold text-[10px] sm:text-xs md:text-sm leading-tight">{formatCurrency(contract.monthly_payment || 0)}</p>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1 md:space-y-1.5">
                      <p className="text-muted-foreground mb-1 sm:mb-1.5 md:mb-2 leading-tight">Duration</p>
                      <p className="font-semibold text-[10px] sm:text-xs md:text-sm leading-tight">{contract.months || 0} months</p>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  {contract.total_payments > 0 && (
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 pt-1.5 sm:pt-2">
                      <div className="flex justify-between text-[10px] sm:text-xs mb-1 sm:mb-1.5 md:mb-2">
                        <span className="text-muted-foreground">Payment Progress</span>
                        <span className="font-medium">
                          {contract.paid_payments || 0}/{contract.total_payments}
                        </span>
                      </div>
                      <Progress 
                        value={((contract.paid_payments || 0) / contract.total_payments) * 100}
                        className="h-1.5 sm:h-2 md:h-2.5"
                      />
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-2 sm:gap-2.5 md:gap-3 pt-3 sm:pt-4 md:pt-5 pb-3 sm:pb-4 md:pb-5 px-3 sm:px-4 md:px-6 border-t border-gray-700/30">
                  <Button
                    onClick={() => handleViewDetails(contract)}
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 sm:gap-2 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white text-[11px] sm:text-xs md:text-sm h-8 sm:h-9"
                  >
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    View Details
                  </Button>
                  
                  {contract.status === 'pending' && canApproveReject && canApproveRejectContract(contract) && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 w-full mt-0.5 sm:mt-1">
                      <Button
                        onClick={() => {
                          if (!canApproveRejectContract(contract)) {
                            toast.error('You do not have permission to approve contracts from this branch');
                            return;
                          }
                          setSelectedContract(contract);
                          setShowApproveModal(true);
                        }}
                        size="sm"
                        className="gap-2 bg-green-500 hover:bg-green-600"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          if (!canApproveRejectContract(contract)) {
                            toast.error('You do not have permission to reject contracts from this branch');
                            return;
                          }
                          setSelectedContract(contract);
                          setShowRejectModal(true);
                        }}
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Contract Details Modal */}
      <ContractDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        contractDetails={contractDetails}
        sponsors={sponsors}
        onViewImage={handleViewImage}
        getImageSrc={getImageSrc}
      />

      {/* Approve Modal */}
      <ApproveModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        contract={selectedContract}
        processing={processing}
        onApprove={handleApprove}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
        contract={selectedContract}
        processing={processing}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onReject={handleReject}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={!!viewingImage}
        onClose={handleCloseImageModal}
        imageSrc={viewingImage?.imageSrc}
        customer={viewingImage?.customer}
        type={viewingImage?.type}
      />
    </div>
  );
}

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