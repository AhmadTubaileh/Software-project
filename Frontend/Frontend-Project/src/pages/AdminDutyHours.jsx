import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import EmployeeDropdown from '../components/AdminDutyHours/EmployeeDropdown.jsx';
import DateInput from '../components/AdminDutyHours/DateInput.jsx';
import SummaryCards from '../components/AdminDutyHours/SummaryCards.jsx';
import SessionsTable from '../components/AdminDutyHours/SessionsTable.jsx';
import EditSessionModal from '../components/AdminDutyHours/EditSessionModal.jsx';
import CreateSessionModal from '../components/AdminDutyHours/CreateSessionModal.jsx';
import FiltersSection from '../components/AdminDutyHours/FiltersSection.jsx';

function AdminDutyHours() {
  const [sessions, setSessions] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filter, setFilter] = useState({
    userId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSession, setNewSession] = useState({
    user_id: '', session_type: 'work', in_time: '', out_time: '', date: new Date().toISOString().split('T')[0], notes: ''
  });
  const { currentUser } = useLocalSession();

  // Enhanced API call with error handling
  const apiCall = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error('SERVER_NOT_RUNNING');
        }
        throw new Error('INVALID_RESPONSE');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.message === 'SERVER_NOT_RUNNING') {
        throw new Error('Backend server not responding. Please check if server is running.');
      } else if (error.message === 'INVALID_RESPONSE') {
        throw new Error('Server returned invalid response.');
      }
      throw error;
    }
  };

  const fetchWorkers = useCallback(async () => {
    try {
      const data = await apiCall('http://localhost:5000/api/duty-hours/admin/workers');
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error(error.message);
    }
  }, []);

  const fetchDutyHours = useCallback(async () => {
    setIsLoading(true);
    try {
      const { userId, startDate, endDate } = filter;
      let url = 'http://localhost:5000/api/duty-hours/admin/all?';
      if (userId) url += `user_id=${userId}&`;
      if (startDate && endDate) url += `start_date=${startDate}&end_date=${endDate}`;

      const data = await apiCall(url);
      setSessions(data);
    } catch (error) {
      console.error('Error fetching duty hours:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchWorkers();
    fetchDutyHours();
  }, [fetchWorkers, fetchDutyHours]);

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
      await apiCall(`http://localhost:5000/api/duty-hours/${sessionData.id}`, {
        method: 'PUT',
        body: JSON.stringify(sessionData),
      });
      toast.success('Session updated successfully!');
      setEditingSession(null);
      fetchDutyHours();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreateSession = async (sessionData) => {
    try {
      await apiCall('http://localhost:5000/api/duty-hours/admin/create', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
      toast.success('Session created successfully!');
      setShowCreateModal(false);
      setNewSession({ user_id: '', session_type: 'work', in_time: '', out_time: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchDutyHours();
    } catch (error) {
      toast.error(error.message);
    }
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
            fetchDutyHours={fetchDutyHours}
            isLoading={isLoading}
          />

          <SummaryCards totals={totals} />

          <SessionsTable
            sessions={sessions}
            isLoading={isLoading}
            onEditSession={setEditingSession}
            onDeleteSession={handleDeleteSession}
          />
        </div>
      </main>

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onUpdate={handleUpdateSession}
          onClose={() => setEditingSession(null)}
        />
      )}

      {showCreateModal && (
        <CreateSessionModal
          newSession={newSession}
          setNewSession={setNewSession}
          workers={workers}
          onCreate={handleCreateSession}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

export default AdminDutyHours;