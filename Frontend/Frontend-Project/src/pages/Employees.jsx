import React, { useState, useMemo, useEffect } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import toast, { Toaster } from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar.jsx';
import EmployeeHeader from '../components/employees/EmployeeHeader.jsx';
import EmployeeModal from '../components/employees/EmployeeModal.jsx';
import EmployeeCard from '../components/employees/EmployeeCard.jsx';
import EmptyState from '../components/employees/EmptyState.jsx';
import EmployeeApi from '../services/employeeApi.js';

function Employees() {
  const { currentUser } = useLocalSession();
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee =>
      employee.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  // Add new employee
  const handleAddEmployee = async (employeeData) => {
    try {
      await EmployeeApi.createEmployee(employeeData);
      toast.success('Employee added successfully!');
      setShowForm(false);
      await loadEmployees(); // Reload employees from backend
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(error.message || 'Failed to add employee');
      throw error; // Re-throw to let form handle it
    }
  };

  // Update existing employee
  const handleUpdateEmployee = async (employeeData) => {
    try {
      await EmployeeApi.updateEmployee(editingEmployee.id, employeeData);
      toast.success('Employee updated successfully!');
      setEditingEmployee(null);
      await loadEmployees(); // Reload employees from backend
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error(error.message || 'Failed to update employee');
      throw error; // Re-throw to let form handle it
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await EmployeeApi.deleteEmployee(employeeId);
        toast.success('Employee deleted successfully!');
        await loadEmployees(); // Reload employees from backend
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error(error.message || 'Failed to delete employee');
      }
    }
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

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header and Search */}
          <EmployeeHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onAddEmployee={handleAddButtonClick}
          />

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

          {/* Employees Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(employee => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredEmployees.length === 0 && employees.length > 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg">No employees match your search</p>
              <p className="text-sm">Try different search terms</p>
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

export default Employees;