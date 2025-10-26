import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';
import toast, { Toaster } from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar.jsx';

// Employee Form Component (keep the same as before)
function EmployeeForm({ employee, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    username: employee?.username || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    password: '',
    userType: employee?.userType || 5,
    cardImage: employee?.cardImage || null
  });

  const [previewImage, setPreviewImage] = useState(employee?.cardImage || null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, cardImage: reader.result }));
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            User Type (0-10) *
          </label>
          <select
            name="userType"
            value={formData.userType}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
          >
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Password {!employee && '*'}
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required={!employee}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Card Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
        />
        {previewImage && (
          <div className="mt-2">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="w-32 h-32 object-cover rounded-md border border-gray-600"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200"
        >
          {employee ? 'Update Employee' : 'Add Employee'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Employees() {
  const { currentUser } = useLocalSession();
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee =>
      employee.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  // Add new employee
  const handleAddEmployee = (employeeData) => {
    const newEmployee = {
      id: Date.now().toString(),
      ...employeeData,
      dateJoined: new Date().toISOString().split('T')[0]
    };
    setEmployees(prev => [...prev, newEmployee]);
    setShowForm(false);
    toast.success('Employee added successfully!');
  };

  // Update existing employee
  const handleUpdateEmployee = (employeeData) => {
    setEmployees(prev => prev.map(emp =>
      emp.id === editingEmployee.id ? { ...emp, ...employeeData } : emp
    ));
    setEditingEmployee(null);
    toast.success('Employee updated successfully!');
  };

  // Delete employee
  const handleDeleteEmployee = (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      toast.success('Employee deleted successfully!');
    }
  };

  // Start editing employee
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
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
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Employee Management</h1>
              <p className="text-gray-400 mt-2">Manage your team members and their access levels</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              <span>+</span> Add Employee
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search employees by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Employee Form Modal */}
          {(showForm || editingEmployee) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
                <h2 className="text-xl font-bold mb-4">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h2>
                <EmployeeForm
                  employee={editingEmployee}
                  onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingEmployee(null);
                  }}
                />
              </div>
            </div>
          )}

          {/* Employees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(employee => (
              <div
                key={employee.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors duration-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  {employee.cardImage ? (
                    <img
                      src={employee.cardImage}
                      alt={employee.username}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                      👨‍💼
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{employee.username}</h3>
                    <p className="text-gray-400 text-sm">{employee.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone:</span>
                    <span>{employee.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">User Type:</span>
                    <span className="bg-blue-600 px-2 py-1 rounded text-xs">
                      Level {employee.userType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Joined:</span>
                    <span>{employee.dateJoined}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleEditEmployee(employee)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm transition-colors duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(employee.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded text-sm transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">👨‍💼</div>
              <p className="text-lg">No employees found</p>
              <p className="text-sm">Add your first employee to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Employees;