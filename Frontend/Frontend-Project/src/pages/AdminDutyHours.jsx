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

  // Enhanced Dropdown Component
  const EmployeeDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedWorker = workers.find(worker => worker.id.toString() === filter.userId);

    const handleSelect = (workerId) => {
      setFilter(prev => ({ ...prev, userId: workerId }));
      setIsOpen(false);
    };

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Employee
        </label>
        
        {/* Dropdown Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-left text-white focus:outline-none focus:border-blue-500 transition-all duration-200 hover:bg-gray-600/50 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            {selectedWorker ? (
              <>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {selectedWorker.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">{selectedWorker.username}</div>
                  <div className="text-xs text-gray-400">Level {selectedWorker.user_type}</div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-gray-400">
                  👥
                </div>
                <span className="text-gray-400">All Employees</span>
              </div>
            )}
          </div>
          
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="p-3 border-b border-gray-700/50 bg-gray-900/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 text-sm">👥</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Select Employee</h4>
                  <p className="text-gray-400 text-xs">{workers.length} employees</p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="max-h-60 overflow-y-auto py-1">
              {/* All Employees Option */}
              <button
                onClick={() => handleSelect('')}
                className={`w-full text-left p-3 transition-all duration-200 group ${
                  !filter.userId 
                    ? 'bg-blue-500/20 border-r-2 border-blue-500' 
                    : 'hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-sm">
                    🌟
                  </div>
                  <div>
                    <div className={`font-medium ${
                      !filter.userId ? 'text-blue-300' : 'text-white group-hover:text-white'
                    }`}>
                      All Employees
                    </div>
                    <div className="text-xs text-gray-400">View all team members</div>
                  </div>
                </div>
              </button>

              {/* Employee Options */}
              {workers.map((worker) => (
                <button
                  key={worker.id}
                  onClick={() => handleSelect(worker.id.toString())}
                  className={`w-full text-left p-3 transition-all duration-200 group border-l-2 ${
                    filter.userId === worker.id.toString()
                      ? 'bg-blue-500/20 border-blue-500' 
                      : 'border-transparent hover:bg-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {worker.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${
                        filter.userId === worker.id.toString() 
                          ? 'text-blue-300' 
                          : 'text-white group-hover:text-white'
                      }`}>
                        {worker.username}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Level {worker.user_type}</span>
                        <span className="text-gray-500">•</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                          worker.user_type === 0 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {worker.user_type === 0 ? 'Admin' : 'Employee'}
                        </span>
                      </div>
                    </div>
                    {filter.userId === worker.id.toString() && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700/50 bg-gray-900/50">
              <div className="text-center text-xs text-gray-400">
                {selectedWorker ? `Viewing ${selectedWorker.username}'s sessions` : 'Viewing all team sessions'}
              </div>
            </div>
          </div>
        )}

        {/* Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  };

  // Date Input Component with Clickable Icon
  const DateInput = ({ label, value, onChange, type = 'start' }) => {
    const dateInputRef = React.useRef(null);

    const handleIconClick = () => {
      if (dateInputRef.current) {
        dateInputRef.current.showPicker();
      }
    };

    const formatDisplayDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
        <div className="relative group">
          <input
            ref={dateInputRef}
            type="date"
            value={value}
            onChange={onChange}
            className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors duration-200 appearance-none cursor-pointer"
          />
          
          {/* Custom Date Display */}
          <div className="absolute inset-0 pointer-events-none flex items-center px-4 text-gray-300">
            {formatDisplayDate(value)}
          </div>
          
          {/* Clickable Calendar Icon */}
          <button
            type="button"
            onClick={handleIconClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-500/10 cursor-pointer z-10"
            title={`Select ${type === 'start' ? 'start' : 'end'} date`}
          >
            <div className="flex items-center gap-1">
              <span className="text-lg">📅</span>
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    );
  };

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

          

          {/* Filters Section */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              
              {/* Enhanced Employee Dropdown */}
              <div>
                <EmployeeDropdown />
              </div>

              {/* Enhanced Date Inputs with Clickable Icons */}
              <DateInput
                label="Start Date"
                value={filter.startDate}
                onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                type="start"
              />

              <DateInput
                label="End Date"
                value={filter.endDate}
                onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                type="end"
              />

              {/* Apply Button */}
              <div>
                <button
                  onClick={fetchDutyHours}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Apply Filters
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="text-3xl font-bold text-blue-300 mb-2">{totals.work}h</div>
              <div className="text-blue-400/80 font-medium">Total Work Hours</div>
              <div className="text-xs text-blue-500/60 mt-2">Active work time</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl p-6 border border-purple-500/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="text-3xl font-bold text-purple-300 mb-2">{totals.break}h</div>
              <div className="text-purple-400/80 font-medium">Total Break Hours</div>
              <div className="text-xs text-purple-500/60 mt-2">Break time</div>
            </div>
            <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl p-6 border border-gray-600/50 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="text-3xl font-bold text-white mb-2">{totals.total}h</div>
              <div className="text-gray-400 font-medium">Total Hours</div>
              <div className="text-xs text-gray-500 mt-2">Combined time</div>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-700/80 to-gray-800/80">
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
                    <tr key={session.id} className="hover:bg-gray-700/30 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {session.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-white">{session.username}</div>
                            <div className="text-xs text-gray-400">Level {session.user_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{session.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${statusStyles[session.session_type].bg} ${statusStyles[session.session_type].text} border ${statusStyles[session.session_type].border}`}>
                          {session.session_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{new Date(session.in_time).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{session.out_time ? new Date(session.out_time).toLocaleString() : 'Active'}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{session.duration ? `${session.duration}h` : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">{session.notes || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={() => setEditingSession(session)} 
                            className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-blue-500/10 rounded-lg transform hover:scale-110 duration-200"
                            title="Edit Session"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteSession(session.id)} 
                            className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg transform hover:scale-110 duration-200"
                            title="Delete Session"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sessions.length === 0 && !isLoading && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
                <p className="text-gray-500">No duty hours recorded for the selected filters</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading sessions...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal - Keep existing */}
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

      {/* Create Modal - Keep existing */}
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