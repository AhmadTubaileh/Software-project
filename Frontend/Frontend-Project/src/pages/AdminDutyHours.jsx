import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';

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

  const statusStyles = {
    work: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300' },
    break: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300' }
  };

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

      // Check if response is JSON
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

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`http://localhost:5000/api/duty-hours/${editingSession.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingSession),
      });
      toast.success('Session updated successfully!');
      setEditingSession(null);
      fetchDutyHours();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await apiCall('http://localhost:5000/api/duty-hours/admin/create', {
        method: 'POST',
        body: JSON.stringify(newSession),
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
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              + Add Session
            </button>
          </div>

          {/* Connection Status */}
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-blue-300 text-sm font-medium">Backend Connected</p>
                <p className="text-blue-400/80 text-xs">All admin features are available</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Employee</label>
                <select
                  value={filter.userId}
                  onChange={(e) => setFilter(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Employees</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>{worker.username} (Level {worker.user_type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <button
                  onClick={fetchDutyHours}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Apply Filters'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20 text-center">
              <div className="text-3xl font-bold text-blue-300 mb-2">{totals.work}h</div>
              <div className="text-blue-400/80 font-medium">Total Work Hours</div>
            </div>
            <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/20 text-center">
              <div className="text-3xl font-bold text-purple-300 mb-2">{totals.break}h</div>
              <div className="text-purple-400/80 font-medium">Total Break Hours</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50 text-center">
              <div className="text-3xl font-bold text-white mb-2">{totals.total}h</div>
              <div className="text-gray-400 font-medium">Total Hours</div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Employee</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Session Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">In Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Out Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Notes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{session.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{session.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[session.session_type].bg} ${statusStyles[session.session_type].text}`}>
                          {session.session_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{new Date(session.in_time).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{session.out_time ? new Date(session.out_time).toLocaleString() : 'Active'}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{session.duration ? `${session.duration}h` : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">{session.notes || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingSession(session)} className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-blue-500/10 rounded-lg" title="Edit Session">✏️</button>
                          <button onClick={() => handleDeleteSession(session.id)} className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title="Delete Session">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sessions.length === 0 && !isLoading && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📊</div>
                <p>No sessions found for the selected filters</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading sessions...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700/50">
            <h2 className="text-xl font-bold mb-4">Edit Session</h2>
            <form onSubmit={handleUpdateSession}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Session Type</label>
                  <select
                    value={editingSession.session_type}
                    onChange={(e) => setEditingSession(prev => ({ ...prev, session_type: e.target.value }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="work">Work</option>
                    <option value="break">Break</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={editingSession.date}
                    onChange={(e) => setEditingSession(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">In Time</label>
                  <input
                    type="datetime-local"
                    value={editingSession.in_time ? editingSession.in_time.slice(0, 16) : ''}
                    onChange={(e) => setEditingSession(prev => ({ ...prev, in_time: e.target.value }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Out Time</label>
                  <input
                    type="datetime-local"
                    value={editingSession.out_time ? editingSession.out_time.slice(0, 16) : ''}
                    onChange={(e) => setEditingSession(prev => ({ ...prev, out_time: e.target.value || null }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={editingSession.notes || ''}
                  onChange={(e) => setEditingSession(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingSession(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200">Cancel</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105">Update Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700/50">
            <h2 className="text-xl font-bold mb-4">Create New Session</h2>
            <form onSubmit={handleCreateSession}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Employee *</label>
                  <select
                    value={newSession.user_id}
                    onChange={(e) => setNewSession(prev => ({ ...prev, user_id: e.target.value }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>{worker.username} (Level {worker.user_type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Session Type</label>
                  <select
                    value={newSession.session_type}
                    onChange={(e) => setNewSession(prev => ({ ...prev, session_type: e.target.value }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="work">Work</option>
                    <option value="break">Break</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">In Time *</label>
                  <input
                    type="datetime-local"
                    value={newSession.in_time}
                    onChange={(e) => setNewSession(prev => ({ ...prev, in_time: e.target.value }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Out Time</label>
                  <input
                    type="datetime-local"
                    value={newSession.out_time}
                    onChange={(e) => setNewSession(prev => ({ ...prev, out_time: e.target.value || null }))}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={newSession.notes}
                  onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200">Cancel</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105">Create Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDutyHours;