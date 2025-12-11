import React, { useState, useMemo, useEffect } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import toast, { Toaster } from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar.jsx';
import BranchHeader from '../components/branches/BranchHeader.jsx';
import BranchModal from '../components/branches/BranchModal.jsx';
import BranchCard from '../components/branches/BranchCard.jsx';
import EmptyState from '../components/branches/EmptyState.jsx';
import BranchApi from '../services/branchApi.js';

function Branches() {
  const { currentUser } = useLocalSession();
  
  // ========== ACCESS CONTROL START ==========
  // Only Admin (user_type = 0) can access this page
  const userType = currentUser?.user_type ?? 5;
  
  if (userType !== 0) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        <AdminSidebar />
        <div className="ml-64 min-h-screen flex items-center justify-center">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-white mb-2">Administrator Access Required</h2>
              <p className="text-gray-400 mb-4">
                Your account ({getRoleName(userType)}) does not have permission to manage branches.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This page is restricted to Administrators only for security purposes.
                Branch management includes creating, editing, and deleting store locations.
              </p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ========== ACCESS CONTROL END ==========

  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // Sorting option

  // Load branches from backend on component mount
  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const branchesData = await BranchApi.getAllBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort branches
  const filteredAndSortedBranches = useMemo(() => {
    let filtered = branches.filter(branch => {
      return (
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (branch.address && branch.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (branch.phone && branch.phone.includes(searchQuery))
      );
    });

    // Sorting logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        default:
          return 0;
      }
    });

    return filtered;
  }, [branches, searchQuery, sortBy]);

  // Add new branch
  const handleAddBranch = async (branchData) => {
    try {
      await BranchApi.createBranch(branchData);
      toast.success('Branch added successfully!');
      setShowForm(false);
      await loadBranches();
    } catch (error) {
      console.error('Error adding branch:', error);
      toast.error(error.message || 'Failed to add branch');
      throw error;
    }
  };

  // Update existing branch
  const handleUpdateBranch = async (branchData) => {
    try {
      await BranchApi.updateBranch(editingBranch.id, branchData);
      toast.success('Branch updated successfully!');
      setEditingBranch(null);
      await loadBranches();
    } catch (error) {
      console.error('Error updating branch:', error);
      toast.error(error.message || 'Failed to update branch');
      throw error;
    }
  };

  // Delete branch
  const handleDeleteBranch = async (branchId) => {
    if (window.confirm('Are you sure you want to delete this branch?\n\n⚠️ Warning: This action cannot be undone.')) {
      try {
        await BranchApi.deleteBranch(branchId);
        toast.success('Branch deleted successfully!');
        await loadBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
        toast.error(error.message || 'Failed to delete branch');
      }
    }
  };

  // Start editing branch
  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Handle add branch button
  const handleAddButtonClick = () => {
    setShowForm(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowForm(false);
    setEditingBranch(null);
  };

  // Get branch statistics
  const branchStats = useMemo(() => {
    return {
      total: branches.length,
      withPhone: branches.filter(b => b.phone).length,
      withAddress: branches.filter(b => b.address).length,
    };
  }, [branches]);

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header and Search/Filters */}
          <BranchHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onAddBranch={handleAddButtonClick}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            stats={branchStats}
          />

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🏢</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Branches</p>
                  <p className="text-2xl font-bold">{branchStats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📞</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">With Phone</p>
                  <p className="text-2xl font-bold">{branchStats.withPhone}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📍</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">With Address</p>
                  <p className="text-2xl font-bold">{branchStats.withAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {!loading && branches.length > 0 && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-gray-400">Showing:</span>
                <span className="text-white font-medium">
                  {filteredAndSortedBranches.length} of {branches.length} branches
                </span>
                
                {sortBy !== 'newest' && (
                  <span className="bg-blue-600 px-3 py-1 rounded-full text-xs">
                    Sorted: {getSortLabel(sortBy)}
                  </span>
                )}
                
                {searchQuery && (
                  <span className="bg-purple-600 px-3 py-1 rounded-full text-xs">
                    Search: "{searchQuery}"
                  </span>
                )}

                {/* Clear Filters Button */}
                {(sortBy !== 'newest' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSortBy('newest');
                      setSearchQuery('');
                    }}
                    className="ml-auto text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading branches...</p>
            </div>
          )}

          {/* Branch Form Modal */}
          <BranchModal
            isOpen={showForm || editingBranch}
            branch={editingBranch}
            onSubmit={editingBranch ? handleUpdateBranch : handleAddBranch}
            onCancel={handleModalClose}
          />

          {/* Branches Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedBranches.map(branch => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  onEdit={handleEditBranch}
                  onDelete={handleDeleteBranch}
                />
              ))}
            </div>
          )}

          {/* Empty State - No results after filtering */}
          {!loading && filteredAndSortedBranches.length === 0 && branches.length > 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg">No branches match your search</p>
              <p className="text-sm">
                {searchQuery 
                  ? `No branches found for "${searchQuery}"`
                  : `No branches found with current filters`
                }
              </p>
              <button
                onClick={() => {
                  setSortBy('newest');
                  setSearchQuery('');
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Show all branches
              </button>
            </div>
          )}

          {/* Empty State - No branches at all */}
          {!loading && branches.length === 0 && (
            <EmptyState onAddBranch={handleAddButtonClick} />
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

// Helper function to get sort label
function getSortLabel(sortBy) {
  switch(sortBy) {
    case 'name_asc': return 'Name (A-Z)';
    case 'name_desc': return 'Name (Z-A)';
    case 'newest': return 'Newest First';
    case 'oldest': return 'Oldest First';
    default: return 'Default';
  }
}

export default Branches;