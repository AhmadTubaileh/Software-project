import React, { useState, useMemo, useEffect } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import toast, { Toaster } from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar.jsx';
import EmployeeHeader from '../components/employees/EmployeeHeader.jsx';
import EmployeeModal from '../components/employees/EmployeeModal.jsx';
import EmployeeCard from '../components/employees/EmployeeCard.jsx';
import ImageModal from '../components/employees/ImageModal.jsx';
import EmptyState from '../components/employees/EmptyState.jsx';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

function Employees() {
  const { currentUser } = useLocalSession();
  
  // ========== ACCESS CONTROL START ==========
  const userType = currentUser?.user_type ?? 5;
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
                Supervisors, Employees, and Trainees cannot access employee management.
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

  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [allBranches, setAllBranches] = useState([]);
  const [userBranches, setUserBranches] = useState([]);
  const [retryCount, setRetryCount] = useState(0);

  // Load employees and branches on component mount
  useEffect(() => {
    console.log('Employees component mounted, current user:', currentUser);
    loadEmployees();
    loadBranches();
    loadUserBranches();
  }, [retryCount]);

  // Load all employees with access control
  const loadEmployees = async () => {
    try {
      setLoading(true);
      console.log('Loading employees for user:', currentUser);
      
      // Add user ID to the request for backend filtering
      const url = `${API_BASE_URL}/employees`;
      const params = new URLSearchParams();
      
      // If user is not admin, send their ID for filtering
      if (userType !== 0 && currentUser?.id) {
        params.append('userId', currentUser.id);
      }
      
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      
      console.log('Fetching from:', fullUrl);
      
      const response = await fetch(fullUrl, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to load employees: ${response.status}`;
        
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      const employeesData = await response.json();
      
      console.log(`Loaded ${employeesData.length} employees`);
      console.log('First employee sample:', employeesData[0]);
      
      setEmployees(employeesData);
      
    } catch (error) {
      console.error('Error loading employees:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        toast.error(
          <div>
            <p className="font-semibold">Connection Error</p>
            <p className="text-sm">Cannot connect to the server.</p>
            <button 
              onClick={() => setRetryCount(prev => prev + 1)}
              className="mt-2 text-blue-400 hover:text-blue-300"
            >
              Click to retry
            </button>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(error.message || 'Failed to load employees');
      }
      
    } finally {
      setLoading(false);
    }
  };

  // Load all branches for admin, accessible branches for others
  const loadBranches = async () => {
    try {
      // If user is admin, load all branches
      if (userType === 0) {
        const response = await fetch(`${API_BASE_URL}/employees/branches/all`);
        if (!response.ok) {
          throw new Error('Failed to load branches');
        }
        const branchesData = await response.json();
        console.log('Admin loaded all branches:', branchesData.length);
        setAllBranches(branchesData);
        setUserBranches(branchesData); // Admin sees all branches
      } else {
        // For non-admin, load only accessible branches
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
      const response = await fetch(`${API_BASE_URL}/employees/branches/accessible?userId=${currentUser.id}`);
      
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

  // Load accessible branches for modal (used in EmployeeModal)
  const loadAccessibleBranches = async (userId) => {
    try {
      console.log(`Loading accessible branches for user ${userId} (for modal)`);
      const response = await fetch(`${API_BASE_URL}/employees/branches/accessible?userId=${userId}`);
      if (!response.ok) {
        console.log('Failed to load accessible branches for modal');
        return userType === 0 ? allBranches : userBranches;
      }
      const branches = await response.json();
      console.log(`Found ${branches.length} accessible branches for modal`);
      return branches;
    } catch (error) {
      console.error('Error loading accessible branches for modal:', error);
      return userType === 0 ? allBranches : userBranches;
    }
  };

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    console.log('Filtering employees:', {
      total: employees.length,
      searchQuery,
      levelFilter,
      branchFilter,
      userType: userType,
      userBranchesCount: userBranches.length
    });
    
    return employees.filter(employee => {
      // Search filter
      const matchesSearch = 
        (employee.username?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (employee.phone?.includes(searchQuery) || false) ||
        (employee.id_card?.includes(searchQuery) || false);
      
      // Level filter
      const matchesLevel = 
        levelFilter === 'all' || 
        employee.user_type?.toString() === levelFilter;
      
      // Branch filter
      let matchesBranch = false;
      if (branchFilter === 'all') {
        // For non-admin users, filter by accessible branches even when "all" is selected
        if (userType !== 0 && userBranches.length > 0) {
          const employeeBranches = [
            employee.primary_branch_id,
            ...(employee.accessible_branches || [])
          ];
          // Only show employees in user's accessible branches
          matchesBranch = employeeBranches.some(bid => 
            userBranches.some(ub => ub.id === bid)
          );
        } else {
          // Admin can see all employees
          matchesBranch = true;
        }
      } else {
        const branchId = parseInt(branchFilter);
        // Check if employee belongs to this branch (primary or accessible)
        const employeeBranches = [
          employee.primary_branch_id,
          ...(employee.accessible_branches || [])
        ];
        matchesBranch = employeeBranches.includes(branchId);
      }
      
      const isMatch = matchesSearch && matchesLevel && matchesBranch;
      
      return isMatch;
    });
  }, [employees, searchQuery, levelFilter, branchFilter, userType, userBranches]);

  // Handle level filter change
  const handleLevelFilterChange = (e) => {
    const value = e.target.value;
    console.log('Level filter changed to:', value);
    setLevelFilter(value);
  };

  // Handle branch filter change
  const handleBranchFilterChange = (e) => {
    const value = e.target.value;
    console.log('Branch filter changed to:', value);
    setBranchFilter(value);
  };

  // Add new employee
  const handleAddEmployee = async (employeeData, currentUserId) => {
    try {
      console.log('Adding employee, current user ID:', currentUserId);
      
      // Add currentUserId to formData for backend validation
      employeeData.append('currentUserId', currentUserId);
      
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        body: employeeData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add employee');
      }

      toast.success('Employee added successfully!');
      setShowForm(false);
      await loadEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(error.message || 'Failed to add employee');
      throw error;
    }
  };

  // Update existing employee
  const handleUpdateEmployee = async (employeeData, currentUserId) => {
    try {
      console.log('Updating employee, current user ID:', currentUserId);
      
      // Add currentUserId to formData for backend validation
      employeeData.append('currentUserId', currentUserId);
      
      const response = await fetch(`${API_BASE_URL}/employees/${editingEmployee.id}`, {
        method: 'PUT',
        body: employeeData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update employee');
      }

      toast.success('Employee updated successfully!');
      setEditingEmployee(null);
      await loadEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error(error.message || 'Failed to update employee');
      throw error;
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    
    try {
      console.log('Deleting employee:', employeeId);
      
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete employee');
      }

      toast.success('Employee deleted successfully!');
      await loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error(error.message || 'Failed to delete employee');
    }
  };

  // Handle viewing ID card image
  const handleViewImage = (employee) => {
    console.log('Viewing image for employee:', employee.username);
    setViewingImage(employee);
  };

  // Handle closing image modal
  const handleCloseImageModal = () => {
    console.log('Closing image modal');
    setViewingImage(null);
  };

  // Start editing employee
  const handleEditEmployee = (employee) => {
    console.log('Editing employee:', employee.username);
    setEditingEmployee(employee);
  };

  // Handle search change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    console.log('Search query changed:', value);
    setSearchQuery(value);
  };

  // Handle add employee button
  const handleAddButtonClick = () => {
    console.log('Add employee button clicked');
    setShowForm(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    console.log('Modal closed');
    setShowForm(false);
    setEditingEmployee(null);
  };

  // Handle form submission
  const handleFormSubmit = async (formData, currentUserId) => {
    console.log('Form submitted, current user ID:', currentUserId);
    try {
      if (editingEmployee) {
        await handleUpdateEmployee(formData, currentUserId);
      } else {
        await handleAddEmployee(formData, currentUserId);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Helper function to get full image URL for modal
  const getFullImageSrc = (employee) => {
    if (employee.card_image) {
      return `data:image/jpeg;base64,${employee.card_image}`;
    }
    return null;
  };

  // Get branches for filter dropdown
  const getFilterBranches = () => {
    // Admin sees all branches, others see only their accessible branches
    return userType === 0 ? allBranches : userBranches;
  };

  // Get accessible branch IDs for current user
  const getUserBranchIds = () => {
    return userBranches.map(branch => branch.id);
  };

  // Check if employee is in user's accessible branches
  const isEmployeeAccessible = (employee) => {
    if (userType === 0) return true; // Admin can see all
    
    const userBranchIds = getUserBranchIds();
    const employeeBranches = [
      employee.primary_branch_id,
      ...(employee.accessible_branches || [])
    ];
    
    // Check if employee has any branch in common with user's accessible branches
    return employeeBranches.some(branchId => 
      userBranchIds.includes(branchId)
    );
  };

  // Filter employees to only show accessible ones (extra safety)
  const accessibleEmployees = useMemo(() => {
    if (userType === 0) return employees; // Admin sees all
    
    return employees.filter(employee => isEmployeeAccessible(employee));
  }, [employees, userType, userBranches]);

  // Retry loading data
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    toast.loading('Retrying connection...');
  };

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#dc2626',
            },
          },
        }}
      />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Connection Error Banner */}
          {employees.length === 0 && !loading && retryCount > 0 && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-red-300">⚠️ Connection Issue</h3>
                  <p className="text-sm text-red-200">
                    Cannot connect to the server. Please check if the backend is running.
                  </p>
                </div>
                <button
                  onClick={handleRetry}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* Header and Search/Filters */}
          <EmployeeHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onAddEmployee={handleAddButtonClick}
            levelFilter={levelFilter}
            onLevelFilterChange={handleLevelFilterChange}
            branchFilter={branchFilter}
            onBranchFilterChange={handleBranchFilterChange}
            allBranches={getFilterBranches()}
            currentUser={currentUser}
          />

          {/* Access Information Banner */}
          {userType !== 0 && (
            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-yellow-300">📋 Access Information</h3>
                  <p className="text-sm text-yellow-200">
                    You can only view and manage employees in your accessible branches.
                  </p>
                  <p className="text-xs text-yellow-300 mt-1">
                    Accessible Branches: {userBranches.map(b => b.name).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-yellow-300">
                    User Type: {getRoleName(userType)}
                  </p>
                  <p className="text-xs text-yellow-300">
                    Can assign levels: {userType === 1 ? '2-10' : userType === 2 ? '3-10' : 'All'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Summary */}
          {!loading && employees.length > 0 && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-gray-400">Showing:</span>
                <span className="text-white font-medium">
                  {filteredEmployees.length} of {employees.length} employees
                  {userType !== 0 && ` (Only from your ${userBranches.length} accessible branches)`}
                </span>
                
                {levelFilter !== 'all' && (
                  <span className="bg-blue-600 px-3 py-1 rounded-full text-xs">
                    Level {levelFilter} only
                  </span>
                )}
                
                {branchFilter !== 'all' && (
                  <span className="bg-green-600 px-3 py-1 rounded-full text-xs">
                    Branch: {getFilterBranches().find(b => b.id == branchFilter)?.name || branchFilter}
                  </span>
                )}
                
                {searchQuery && (
                  <span className="bg-purple-600 px-3 py-1 rounded-full text-xs">
                    Search: "{searchQuery}"
                  </span>
                )}

                {/* Clear Filters Button */}
                {(levelFilter !== 'all' || branchFilter !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      console.log('Clearing all filters');
                      setLevelFilter('all');
                      setBranchFilter('all');
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
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading employees...</p>
              <p className="text-xs text-gray-500 mt-2">User type: {getRoleName(userType)}</p>
              {userType !== 0 && (
                <p className="text-xs text-gray-400 mt-1">Filtering by your accessible branches</p>
              )}
            </div>
          )}

          {/* Employee Form Modal */}
          {(showForm || editingEmployee) && (
            <EmployeeModal
              isOpen={showForm || editingEmployee}
              employee={editingEmployee}
              onSubmit={handleFormSubmit}
              onCancel={handleModalClose}
              currentUser={currentUser}
              allBranches={userType === 0 ? allBranches : userBranches}
              loadAccessibleBranches={loadAccessibleBranches}
            />
          )}

          {/* Image View Modal */}
          {viewingImage && (
            <ImageModal
              isOpen={!!viewingImage}
              imageSrc={getFullImageSrc(viewingImage)}
              employee={viewingImage}
              onClose={handleCloseImageModal}
            />
          )}

          {/* Employees Grid */}
          {!loading && filteredEmployees.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(employee => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                  onViewImage={handleViewImage}
                  currentUserType={userType}
                  currentUserId={currentUser?.id}
                  canEditDelete={userType === 0 || employee.user_type > userType}
                />
              ))}
            </div>
          )}

          {/* Empty State - No results after filtering */}
          {!loading && filteredEmployees.length === 0 && employees.length > 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg">No employees match your filters</p>
              <p className="text-sm">
                {levelFilter !== 'all' && branchFilter !== 'all' && searchQuery 
                  ? `No Level ${levelFilter} employees found in selected branch for "${searchQuery}"`
                  : levelFilter !== 'all' && branchFilter !== 'all'
                  ? `No employees found at Level ${levelFilter} in selected branch`
                  : levelFilter !== 'all'
                  ? `No employees found at Level ${levelFilter}`
                  : branchFilter !== 'all'
                  ? `No employees found in selected branch`
                  : `No employees found for "${searchQuery}"`
                }
              </p>
              <button
                onClick={() => {
                  setLevelFilter('all');
                  setBranchFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Show all employees
              </button>
            </div>
          )}

          {/* Empty State - No employees at all */}
          {!loading && employees.length === 0 && (
            <EmptyState 
              onAddEmployee={handleAddButtonClick}
              userType={userType}
              userBranches={userBranches}
            />
          )}

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-800 rounded text-xs">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <p>User Type: {userType} ({getRoleName(userType)})</p>
              <p>User ID: {currentUser?.id}</p>
              <p>Total Employees from API: {employees.length}</p>
              <p>Filtered Employees: {filteredEmployees.length}</p>
              <p>Accessible Branches: {userBranches.map(b => b.name).join(', ')}</p>
              <p>Branch IDs: {userBranches.map(b => b.id).join(', ')}</p>
              <div className="mt-2">
                <button
                  onClick={() => {
                    console.log('Current employees:', employees);
                    console.log('Current user:', currentUser);
                    console.log('User branches:', userBranches);
                    console.log('All branches:', allBranches);
                  }}
                  className="bg-gray-700 px-2 py-1 rounded text-xs mr-2"
                >
                  Log Data
                </button>
                <button
                  onClick={handleRetry}
                  className="bg-blue-700 px-2 py-1 rounded text-xs"
                >
                  Force Retry
                </button>
              </div>
            </div>
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
    case 4: return 'Team Lead';
    case 5: return 'Employee';
    case 6: return 'Junior Employee';
    case 7: return 'Trainee';
    case 8: return 'Intern';
    case 9: return 'Contractor';
    case 10: return 'Customer';
    default: return 'User';
  }
}

export default Employees;