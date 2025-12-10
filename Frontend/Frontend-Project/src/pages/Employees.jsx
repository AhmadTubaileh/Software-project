import React, { useState, useMemo, useEffect } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import toast, { Toaster } from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar.jsx';
import EmployeeHeader from '../components/employees/EmployeeHeader.jsx';
import EmployeeModal from '../components/employees/EmployeeModal.jsx';
import EmployeeCard from '../components/employees/EmployeeCard.jsx';
import ImageModal from '../components/employees/ImageModal.jsx';
import EmptyState from '../components/employees/EmptyState.jsx';
import EmployeeApi from '../services/employeeApi.js';

function Employees() {
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
  const [levelFilter, setLevelFilter] = useState('all'); // NEW: Level filter state
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);

  // Load employees from backend on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeesData = await EmployeeApi.getAllEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search AND level
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Search filter
      const matchesSearch = 
        employee.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Level filter
      const matchesLevel = 
        levelFilter === 'all' || 
        employee.user_type.toString() === levelFilter;
      
      return matchesSearch && matchesLevel;
    });
  }, [employees, searchQuery, levelFilter]);

  // NEW: Handle level filter change
  const handleLevelFilterChange = (e) => {
    setLevelFilter(e.target.value);
  };

  // Add new employee
  const handleAddEmployee = async (employeeData) => {
    try {
      await EmployeeApi.createEmployee(employeeData);
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
  const handleUpdateEmployee = async (employeeData) => {
    try {
      await EmployeeApi.updateEmployee(editingEmployee.id, employeeData);
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
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await EmployeeApi.deleteEmployee(employeeId);
        toast.success('Employee deleted successfully!');
        await loadEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error(error.message || 'Failed to delete employee');
      }
    }
  };

  // Handle viewing ID card image
  const handleViewImage = (employee) => {
    setViewingImage(employee);
  };

  // Handle closing image modal
  const handleCloseImageModal = () => {
    setViewingImage(null);
  };

  // Start editing employee
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle add employee button
  const handleAddButtonClick = () => {
    setShowForm(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  // Helper function to get full image URL for modal
  const getFullImageSrc = (employee) => {
    if (employee.card_image) {
      return `data:image/jpeg;base64,${employee.card_image}`;
    }
    return null;
  };

  // NEW: Get level statistics
  const levelStats = useMemo(() => {
    const stats = {};
    employees.forEach(employee => {
      const level = employee.user_type;
      stats[level] = (stats[level] || 0) + 1;
    });
    return stats;
  }, [employees]);

  // Remove the old access control that was checking role field
  // We already checked user_type at the beginning

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header and Search/Filters */}
          <EmployeeHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onAddEmployee={handleAddButtonClick}
            levelFilter={levelFilter}
            onLevelFilterChange={handleLevelFilterChange}
          />

          {/* Filter Summary */}
          {!loading && employees.length > 0 && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-gray-400">Showing:</span>
                <span className="text-white font-medium">
                  {filteredEmployees.length} of {employees.length} employees
                </span>
                
                {levelFilter !== 'all' && (
                  <span className="bg-blue-600 px-3 py-1 rounded-full text-xs">
                    Level {levelFilter} only
                  </span>
                )}
                
                {searchQuery && (
                  <span className="bg-purple-600 px-3 py-1 rounded-full text-xs">
                    Search: "{searchQuery}"
                  </span>
                )}

                {/* Clear Filters Button */}
                {(levelFilter !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setLevelFilter('all');
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
              <p className="mt-4 text-gray-400">Loading employees...</p>
            </div>
          )}

          {/* Employee Form Modal */}
          <EmployeeModal
            isOpen={showForm || editingEmployee}
            employee={editingEmployee}
            onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
            onCancel={handleModalClose}
          />

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
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(employee => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                  onViewImage={handleViewImage}
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
                {levelFilter !== 'all' && searchQuery 
                  ? `No Level ${levelFilter} employees found for "${searchQuery}"`
                  : levelFilter !== 'all'
                  ? `No employees found at Level ${levelFilter}`
                  : `No employees found for "${searchQuery}"`
                }
              </p>
              <button
                onClick={() => {
                  setLevelFilter('all');
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

export default Employees;