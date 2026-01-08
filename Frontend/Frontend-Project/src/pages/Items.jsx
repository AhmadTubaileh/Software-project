import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import ItemHeader from '../components/items/ItemHeader.jsx';
import ItemCard from '../components/items/ItemCard.jsx';
import ItemForm from '../components/items/ItemForm.jsx';
import ImageModal from '../components/items/ImageModal.jsx';
import PriceHistoryModal from '../components/items/PriceHistoryModal.jsx';
import ItemDuplicateModal from '../components/items/ItemDuplicateModal.jsx';
import EmptyState from '../components/items/EmptyState.jsx';
import toast, { Toaster } from 'react-hot-toast';

function Items() {
  const { currentUser } = useLocalSession();
  
  // ========== ACCESS CONTROL START ==========
  // Get user_type from currentUser
  const userType = currentUser?.user_type ?? 5; // Default to trainee if not set
  
  // Only Admin (0), Senior Manager (1), and Manager (2) can access this page
  // Supervisor (3), Employee (4), and Trainee (5) cannot access
  const allowedRoles = [0, 1, 2];
  
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
                This page is only accessible to Administrators and Managers.
                Supervisors, Employees, and Trainees cannot access item management.
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

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableFilter, setAvailableFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [allBranches, setAllBranches] = useState([]);
  const [userBranches, setUserBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [viewingPriceHistory, setViewingPriceHistory] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [itemToDuplicate, setItemToDuplicate] = useState(null);

  // Load branches on mount
  useEffect(() => {
    loadBranches();
  }, []);

  // Load all branches for admin, accessible branches for others
  const loadBranches = async () => {
    try {
      if (userType === 0) {
        // Admin loads all branches
        const response = await fetch('http://localhost:5000/api/employees/branches/all');
        if (!response.ok) {
          throw new Error('Failed to load branches');
        }
        const branchesData = await response.json();
        console.log('Admin loaded all branches:', branchesData.length);
        setAllBranches(branchesData);
        setUserBranches(branchesData);
      } else {
        // Non-admin loads only accessible branches
        await loadUserBranches();
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      setAllBranches([]);
    }
  };

  // Load accessible branches for current user
  const loadUserBranches = async () => {
    if (!currentUser?.id) {
      console.log('No current user ID, skipping branch load');
      setUserBranches([]);
      return;
    }
    
    try {
      console.log('Loading accessible branches for user:', currentUser.id);
      const response = await fetch(`http://localhost:5000/api/employees/branches/accessible?userId=${currentUser.id}`);
      
      if (!response.ok) {
        console.error('Failed to load accessible branches:', response.status);
        throw new Error('Failed to load accessible branches');
      }
      
      const branchesData = await response.json();
      console.log('User accessible branches:', branchesData);
      
      setUserBranches(branchesData);
      
      // If user is not admin, also set allBranches to accessible branches for filter dropdown
      if (userType !== 0) {
        setAllBranches(branchesData);
      }
      
    } catch (error) {
      console.error('Error loading user branches:', error);
      setUserBranches([]);
      if (userType !== 0) {
        setAllBranches([]);
      }
    }
  };

  // Fetch items from backend
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/items');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch price history
  const fetchPriceHistory = async (itemId) => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`http://localhost:5000/api/items/${itemId}/prices`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPriceHistory(data);
      setViewingPriceHistory(itemId);
    } catch (error) {
      console.error('Error fetching price history:', error);
      toast.error('Failed to load price history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load items on component mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter items based on search, availability, and branch access
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAvailability = availableFilter === 'all' || 
                               String(item.available) === availableFilter;
    
    // Branch filter
    let matchesBranch = false;
    if (branchFilter === 'all') {
      // For non-admin users, filter by accessible branches even when "all" is selected
      if (userType !== 0 && userBranches.length > 0) {
        matchesBranch = userBranches.some(ub => ub.id === item.branch_id);
      } else {
        // Admin can see all items
        matchesBranch = true;
      }
    } else {
      const branchId = parseInt(branchFilter);
      matchesBranch = item.branch_id === branchId;
    }
    
    return matchesSearch && matchesAvailability && matchesBranch;
  });

  // Handle add new item
  const handleAddItem = () => {
    setEditingItem(null);
    setIsUpdateMode(false);
    setShowForm(true);
  };

  // Handle edit item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsUpdateMode(false);
    setShowForm(true);
  };

  // Handle update price (create new price row)
  const handleUpdateItem = (item) => {
    setEditingItem(item);
    setIsUpdateMode(true);
    setShowForm(true);
  };

  // Handle delete item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Item deleted successfully');
        setItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  // Handle duplicate item
  const handleDuplicateItem = (item) => {
    setItemToDuplicate(item);
    setShowDuplicateModal(true);
  };

  // Handle duplicate completion
  const handleDuplicateComplete = () => {
    setShowDuplicateModal(false);
    setItemToDuplicate(null);
    fetchItems();
  };

  // Handle viewing item image
  const handleViewImage = (item) => {
    setViewingImage(item);
  };

  // Handle viewing price history
  const handleViewPriceHistory = (item) => {
    fetchPriceHistory(item.id);
  };

  // Handle closing image modal
  const handleCloseImageModal = () => {
    setViewingImage(null);
  };

  // Handle closing price history modal
  const handleClosePriceHistoryModal = () => {
    setViewingPriceHistory(null);
    setPriceHistory([]);
  };

  // Handle form submission
  const handleFormSubmit = async (formData, isUpdate) => {
    try {
      // Add currentUserId for backend access control
      formData.append('currentUserId', currentUser?.id || 1);
      
      let url, method;
      
      if (isUpdate) {
        // Update mode - create new price row
        url = `http://localhost:5000/api/items/${editingItem.id}/update-price`;
        method = 'POST';
      } else if (editingItem) {
        // Edit mode - update existing
        url = `http://localhost:5000/api/items/${editingItem.id}`;
        method = 'PUT';
      } else {
        // Add new item
        url = 'http://localhost:5000/api/items';
        method = 'POST';
      }

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        if (isUpdate) {
          toast.success('Price updated successfully (new entry created)');
        } else if (editingItem) {
          toast.success('Item edited successfully');
        } else {
          toast.success('Item added successfully');
        }
        
        setShowForm(false);
        setEditingItem(null);
        setIsUpdateMode(false);
        await fetchItems();
      } else {
        throw new Error(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Failed to save item');
      throw error;
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setIsUpdateMode(false);
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle availability filter change
  const handleAvailableFilterChange = (e) => {
    setAvailableFilter(e.target.value);
  };

  // Handle branch filter change
  const handleBranchFilterChange = (e) => {
    setBranchFilter(e.target.value);
  };

  // Get branches for filter dropdown
  const getFilterBranches = () => {
    return userType === 0 ? allBranches : userBranches;
  };

  // Get full image source for modal
  const getFullImageSrc = (item) => {
    if (item.item_image) {
      return `data:image/jpeg;base64,${item.item_image}`;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header and Search/Filters */}
          <ItemHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onAddItem={handleAddItem}
            availableFilter={availableFilter}
            onAvailableFilterChange={handleAvailableFilterChange}
            branchFilter={branchFilter}
            onBranchFilterChange={handleBranchFilterChange}
            allBranches={getFilterBranches()}
            currentUser={currentUser}
          />

          {/* Access Information Banner for Non-Admin */}
          {userType !== 0 && (
            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-yellow-300">📋 Branch Access Information</h3>
                  <p className="text-sm text-yellow-200 mt-1">
                    You can only view and manage items in your accessible branches.
                  </p>
                  <p className="text-xs text-yellow-300 mt-1">
                    Accessible Branches: {userBranches.map(b => b.name).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading items...</p>
            </div>
          )}

          {/* Item Form Modal */}
          <ItemForm
            isOpen={showForm}
            item={editingItem}
            isUpdateMode={isUpdateMode}
            currentUser={currentUser}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            userBranches={userBranches}
            allBranches={allBranches}
            userType={userType}
          />

          {/* Image View Modal */}
          {viewingImage && (
            <ImageModal
              isOpen={!!viewingImage}
              imageSrc={getFullImageSrc(viewingImage)}
              item={viewingImage}
              onClose={handleCloseImageModal}
            />
          )}

          {/* Price History Modal */}
          {viewingPriceHistory && (
            <PriceHistoryModal
              isOpen={!!viewingPriceHistory}
              itemId={viewingPriceHistory}
              priceHistory={priceHistory}
              loading={loadingHistory}
              onClose={handleClosePriceHistoryModal}
            />
          )}

          {/* Duplicate Item Modal */}
          {itemToDuplicate && (
            <ItemDuplicateModal
              isOpen={showDuplicateModal}
              item={itemToDuplicate}
              allBranches={allBranches}
              currentUser={currentUser}
              onDuplicate={handleDuplicateComplete}
              onCancel={() => {
                setShowDuplicateModal(false);
                setItemToDuplicate(null);
              }}
            />
          )}

          {/* Items Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onViewImage={handleViewImage}
                  onViewPriceHistory={handleViewPriceHistory}
                  onDuplicate={handleDuplicateItem}
                  isAdmin={userType === 0}
                />
              ))}
            </div>
          )}

          {/* Empty State - No results after filtering */}
          {!loading && filteredItems.length === 0 && items.length > 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg">No items match your filters</p>
              <button
                onClick={() => {
                  setAvailableFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Show all items
              </button>
            </div>
          )}

          {/* Empty State - No items at all */}
          {!loading && items.length === 0 && (
            <EmptyState />
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

export default Items;