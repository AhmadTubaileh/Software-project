import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';

// Import components with proper default exports
import SearchBySaleId from '../components/Returns/SearchBySaleId.jsx';
import SearchByWorkerTime from '../components/Returns/SearchByWorkerTime.jsx';
import SaleDetails from '../components/Returns/SaleDetails.jsx';
import ReturnForm from '../components/Returns/ReturnForm.jsx';

function Returns() {
  const navigate = useNavigate();
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
                Employees and Trainees cannot process returns.
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

  const [activeTab, setActiveTab] = useState('saleId'); // 'saleId' or 'workerTime'
  const [searchResults, setSearchResults] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedCashRecord, setSelectedCashRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null); // null = all accessible branches
  const [accessibleBranches, setAccessibleBranches] = useState([]);

  // Fetch workers and accessible branches on component mount
  useEffect(() => {
    fetchWorkers();
    if (currentUser?.id) {
      fetchAccessibleBranches();
    }
  }, [currentUser?.id]);

  const fetchAccessibleBranches = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/branches/accessible?userId=${currentUser.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accessible branches');
      }
      const branches = await response.json();
      setAccessibleBranches(branches);
      // If user has only one branch, auto-select it
      if (branches.length === 1) {
        setSelectedBranch(branches[0].id);
      }
    } catch (error) {
      console.error('Error fetching accessible branches:', error);
      setAccessibleBranches([]);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/pos/workers');
      const data = await response.json();
      if (data.success) {
        setWorkers(data.workers);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to load workers');
    }
  };

  const handleSearchBySaleId = async (saleId) => {
    setLoading(true);
    try {
      // Add branchId to query if selected
      const branchParam = selectedBranch ? `&branchId=${selectedBranch}` : '';
      const response = await fetch(`http://localhost:5000/api/pos/search-sales?searchType=saleId&saleId=${saleId}${branchParam}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data);
        setSelectedSale(null); // Clear any previously selected sale
        setSelectedCashRecord(null); // Clear selected cash record
        toast.success(`Found ${data.totalItems} items for Sale #${saleId}`);
      } else {
        toast.error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching sales');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByWorkerTime = async (workerId, startDate, endDate) => {
    setLoading(true);
    try {
      // Add branchId to query if selected
      const branchParam = selectedBranch ? `&branchId=${selectedBranch}` : '';
      const response = await fetch(
        `http://localhost:5000/api/pos/search-sales?searchType=workerTime&userId=${workerId}&startDate=${startDate}&endDate=${endDate}${branchParam}`
      );
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data);
        setSelectedSale(null); // Clear any previously selected sale
        setSelectedCashRecord(null); // Clear selected cash record
        toast.success(`Found ${data.totalSales} sales`);
      } else {
        toast.error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching sales');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSale = async (saleId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/pos/sale-details/${saleId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedSale(data);
        setSelectedCashRecord(null); // Clear any previously selected cash record
        toast.success(`Loaded details for Sale #${saleId}`);
      } else {
        toast.error(data.message || 'Failed to load sale details');
      }
    } catch (error) {
      console.error('Error loading sale details:', error);
      toast.error('Error loading sale details');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCashRecord = (cashRecord, itemDetails) => {
    setSelectedCashRecord({
      ...cashRecord,
      item_id: itemDetails.item_id,
      item_name: itemDetails.item_name,
      available_for_return: itemDetails.available_for_return
    });
  };

  const handleProcessReturn = async (returnData) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/pos/process-return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        // Refresh the current sale details
        if (selectedSale) {
          await handleSelectSale(selectedSale.saleId);
        }
        // Clear selection
        setSelectedCashRecord(null);
      } else {
        toast.error(data.message || 'Return processing failed');
      }
    } catch (error) {
      console.error('Return processing error:', error);
      toast.error('Error processing return');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchResults(null);
    setSelectedSale(null);
    setSelectedCashRecord(null);
  };

  // Check if user should see sidebar (based on original logic)
  const showSidebar = currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee');

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      {showSidebar && <AdminSidebar />}
      
      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen ${showSidebar ? 'ml-64' : ''}`}>
        <div className="p-6 flex-1">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Returns & Retrievals
            </h1>
            <p className="text-gray-400 mt-2">Process returns for cash sales only</p>
            <p className="text-gray-500 text-sm mt-1">
              Logged in as: {currentUser?.username} ({getRoleName(userType)})
            </p>
            
            {/* Branch Filter - Only show if user has multiple branches */}
            {accessibleBranches && accessibleBranches.length > 1 && (
              <div className="mt-4 mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by Branch:
                </label>
                <select
                  value={selectedBranch || ''}
                  onChange={e => {
                    setSelectedBranch(e.target.value ? parseInt(e.target.value) : null);
                    resetSearch(); // Clear search when branch changes
                  }}
                  className="px-4 py-2 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 cursor-pointer min-w-[200px]"
                >
                  <option value="" className="bg-gray-800">All Accessible Branches</option>
                  {accessibleBranches.map(branch => (
                    <option key={branch.id} value={branch.id} className="bg-gray-800">
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-700 mt-6">
              <button
                onClick={() => {
                  setActiveTab('saleId');
                  resetSearch();
                }}
                className={`px-6 py-3 font-medium transition-colors duration-200 ${
                  activeTab === 'saleId'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                🔍 Search by Sale ID
              </button>
              <button
                onClick={() => {
                  setActiveTab('workerTime');
                  resetSearch();
                }}
                className={`px-6 py-3 font-medium transition-colors duration-200 ${
                  activeTab === 'workerTime'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                👨‍💼 Search by Worker & Time
              </button>
            </div>
          </div>
          
          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                <p className="mt-4 text-gray-300">Processing...</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Search Forms */}
            <div className="lg:col-span-1">
              {activeTab === 'saleId' ? (
                <SearchBySaleId 
                  onSearch={handleSearchBySaleId}
                  loading={loading}
                />
              ) : (
                <SearchByWorkerTime 
                  workers={workers}
                  onSearch={handleSearchByWorkerTime}
                  loading={loading}
                />
              )}
              
              {/* Search Results (for worker/time search) */}
              {searchResults && searchResults.searchType === 'workerTime' && (
                <div className="mt-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4">Found {searchResults.totalSales} Sales</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {searchResults.results.map((sale) => (
                      <div 
                        key={sale.sale_id}
                        onClick={() => handleSelectSale(sale.sale_id)}
                        className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-blue-300">Sale #{sale.sale_id}</p>
                            <p className="text-sm text-gray-400">{sale.items_list}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{sale.total_items} items</p>
                            <p className="text-xs text-gray-500">{new Date(sale.sale_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-gray-400">Worker: {sale.worker_name}</span>
                          <span className="text-green-400">{sale.total_units} units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Middle Column: Sale Details */}
            <div className="lg:col-span-2">
              {/* Search Results (for saleId search) */}
              {searchResults && searchResults.searchType === 'saleId' && (
                <SaleDetails 
                  saleData={searchResults}
                  onSelectCashRecord={handleSelectCashRecord}
                />
              )}
              
              {/* Selected Sale Details */}
              {selectedSale && (
                <div className="mt-6">
                  <SaleDetails 
                    saleData={selectedSale}
                    onSelectCashRecord={handleSelectCashRecord}
                  />
                </div>
              )}
              
              {/* Return Form */}
              {selectedCashRecord && (
                <div className="mt-6">
                  <ReturnForm 
                    cashRecord={selectedCashRecord}
                    currentUser={currentUser}
                    selectedBranch={selectedBranch}
                    onProcessReturn={handleProcessReturn}
                    onCancel={() => setSelectedCashRecord(null)}
                  />
                </div>
              )}
              
              {/* Empty State */}
              {!searchResults && !selectedSale && !selectedCashRecord && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4 text-gray-600">🔄</div>
                  <h3 className="text-xl font-bold text-gray-300 mb-2">Ready to Process Returns</h3>
                  <p className="text-gray-500">Use the search forms to find sales for return</p>
                </div>
              )}
            </div>
          </div>
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

export default Returns;