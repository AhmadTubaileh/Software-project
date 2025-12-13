import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import EmployeeDropdown from '../components/AdminDutyHours/EmployeeDropdown.jsx';
import DateInput from '../components/AdminDutyHours/DateInput.jsx';
import SummaryCards from '../components/AdminDutyHours/SummaryCards.jsx';
import AdminDutyHoursTable from '../components/AdminDutyHours/AdminDutyHoursTable.jsx';
import EditSessionModal from '../components/AdminDutyHours/EditSessionModal.jsx';
import CreateSessionModal from '../components/AdminDutyHours/CreateSessionModal.jsx';
import CreateSessionFromRowModal from '../components/AdminDutyHours/CreateSessionFromRowModal.jsx';
import FiltersSection from '../components/AdminDutyHours/FiltersSection.jsx';
import DayActionsModal from '../components/AdminDutyHours/DayActionsModal.jsx';

function AdminDutyHours() {
  const { currentUser } = useLocalSession();
  
  // Check user permissions
  const userType = currentUser?.user_type ?? 5; // Default to trainee
  
  // Only Admin (0), Senior Manager (1), and Manager (2) can access this page
  const allowedRoles = [0, 1, 2];
  
  if (!allowedRoles.includes(userType)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e1830]">
        <AdminSidebar />
        <div className="ml-64 flex-1 p-6">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-4">
                Your account ({getRoleName(userType)}) does not have permission to access this page.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This page is only accessible to Administrators, Senior Managers, and Managers.
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

  // Original component code continues here...
  const [sessions, setSessions] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filter, setFilter] = useState({
    userId: '',
    branchId: '',
    startDate: '2025-11-01',  // FIXED: Set to include your data
    endDate: '2025-11-30'     // FIXED: Set to include your data
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateFromRowModal, setShowCreateFromRowModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [dayActions, setDayActions] = useState(null);
  const [newSession, setNewSession] = useState({
    user_id: '', session_type: 'work', in_time: '', out_time: '', date: new Date().toISOString().split('T')[0], notes: ''
  });

  const apiCall = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const fetchAccessibleBranches = useCallback(async () => {
    try {
      if (!currentUser?.id) {
        setBranches([]);
        return;
      }
      
      const url = `http://localhost:5000/api/employees/branches/accessible?userId=${currentUser.id}`;
      const data = await apiCall(url);
      console.log('Accessible branches fetched:', data);
      setBranches(data);
    } catch (error) {
      console.error('Error fetching accessible branches:', error);
      toast.error('Failed to load branches');
      setBranches([]);
    }
  }, [currentUser]);

  const fetchWorkers = useCallback(async () => {
    try {
      // Pass current user ID and branch ID to filter by accessible branches
      let url = currentUser?.id 
        ? `http://localhost:5000/api/duty-hours/admin/workers?current_user_id=${currentUser.id}`
        : 'http://localhost:5000/api/duty-hours/admin/workers';
      
      // Add branch filter if selected
      if (filter.branchId) {
        url += `&branch_id=${filter.branchId}`;
      }
      
      const data = await apiCall(url);
      console.log('Workers fetched:', data);
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error(error.message);
    }
  }, [currentUser, filter.branchId]);

  const fetchDutyHours = useCallback(async () => {
    setIsLoading(true);
    try {
      const { userId, branchId, startDate, endDate } = filter;
      let url = 'http://localhost:5000/api/duty-hours/admin/all?';
      if (userId) url += `user_id=${userId}&`;
      if (branchId) url += `branch_id=${branchId}&`;
      if (startDate && endDate) url += `start_date=${startDate}&end_date=${endDate}&`;
      // Pass current user ID to filter by accessible branches
      if (currentUser?.id) url += `current_user_id=${currentUser.id}`;

      console.log('Fetching from URL:', url);
      
      const data = await apiCall(url);
      console.log('Sessions fetched:', data);
      console.log('Number of sessions:', data.length);
      
      setSessions(data);
    } catch (error) {
      console.error('Error fetching duty hours:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [filter, currentUser]);

  useEffect(() => {
    fetchAccessibleBranches();
  }, [fetchAccessibleBranches]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  useEffect(() => {
    fetchDutyHours();
  }, [fetchDutyHours]);

  // Reset employee filter when branch changes
  useEffect(() => {
    if (filter.branchId) {
      setFilter(prev => ({ ...prev, userId: '' }));
    }
  }, [filter.branchId]);

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await apiCall(`http://localhost:5000/api/duty-hours/${sessionId}`, { method: 'DELETE' });
      toast.success('Session deleted successfully!');
      fetchDutyHours();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateSession = async (sessionData) => {
    try {
      const updateData = {
        ...sessionData,
        update_by: currentUser.id
      };

      await apiCall(`http://localhost:5000/api/duty-hours/${sessionData.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      toast.success('Session updated successfully!');
      setEditingSession(null);
      setDayActions(null);
      fetchDutyHours();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error(error.message);
    }
  };

  const handleCreateSession = async (sessionData) => {
    try {
      const createData = {
        ...sessionData,
        update_by: currentUser.id
      };

      await apiCall('http://localhost:5000/api/duty-hours/admin/create', {
        method: 'POST',
        body: JSON.stringify(createData),
      });
      toast.success('Session created successfully!');
      setShowCreateModal(false);
      setShowCreateFromRowModal(false);
      setDayActions(null);
      setNewSession({ user_id: '', session_type: 'work', in_time: '', out_time: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchDutyHours();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.message);
    }
  };

  const handleDayAction = (dayData) => {
    setDayActions(dayData);
  };

  const handleEditSession = (sessionData) => {
    setEditingSession(sessionData);
    setDayActions(null);
  };

  const handleAddSession = (dayData) => {
    setNewSession(prev => ({
      ...prev,
      user_id: dayData.userId,
      date: dayData.rawDate
    }));
    setShowCreateModal(true);
    setDayActions(null);
  };

  const handleAddSessionFromRow = (rowData) => {
    setSelectedRowData(rowData);
    setShowCreateFromRowModal(true);
    setDayActions(null);
  };

  const calculateTotals = () => {
    let totalWork = 0, totalBreak = 0;
    sessions.forEach(session => {
      if (session.out_time && session.duration) {
        if (session.session_type === 'work') totalWork += parseFloat(session.duration);
        else totalBreak += parseFloat(session.duration);
      }
    });
    return { work: totalWork.toFixed(2), break: totalBreak.toFixed(2), total: (totalWork + totalBreak).toFixed(2) };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}

      <main className={`flex-1 min-h-screen transition-all duration-300 ${
        currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
      }`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                Duty Hours Management
              </h1>
              <p className="text-gray-400">Manage and monitor employee duty hours</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/20"
            >
              + Add Session
            </button>
          </div>

          <FiltersSection
            filter={filter}
            setFilter={setFilter}
            workers={workers}
            branches={branches}
            isLoading={isLoading}
          />

          <SummaryCards totals={totals} />

          <AdminDutyHoursTable
            sessions={sessions}
            isLoading={isLoading}
            onDayAction={handleDayAction}
            onDeleteSession={handleDeleteSession}
          />
        </div>
      </main>

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onUpdate={handleUpdateSession}
          onClose={() => setEditingSession(null)}
          currentUser={currentUser}
        />
      )}

      {showCreateModal && (
        <CreateSessionModal
          newSession={newSession}
          setNewSession={setNewSession}
          workers={workers}
          onCreate={handleCreateSession}
          onClose={() => setShowCreateModal(false)}
          currentUser={currentUser}
        />
      )}

      {showCreateFromRowModal && (
        <CreateSessionFromRowModal
          rowData={selectedRowData}
          workers={workers}
          onCreate={handleCreateSession}
          onClose={() => setShowCreateFromRowModal(false)}
          currentUser={currentUser}
        />
      )}

      {dayActions && (
        <DayActionsModal
          dayData={dayActions}
          onEditSession={handleEditSession}
          onAddSession={handleAddSessionFromRow}
          onDeleteSession={handleDeleteSession}
          onClose={() => setDayActions(null)}
        />
      )}
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

export default AdminDutyHours;