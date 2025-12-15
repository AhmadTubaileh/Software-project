import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { apiClient } from '../shared/api/apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import MobileModal from '../components/MobileModal.jsx';
import './MobilePage.css';

function MobileAdminDutyHours() {
  const { currentUser } = useLocalSession();
  const [sessions, setSessions] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    userId: '',
    branchId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDayActions, setShowDayActions] = useState(null);
  
  // Form data
  const [newSession, setNewSession] = useState({
    user_id: '',
    session_type: 'work',
    in_time: '',
    out_time: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [editingSession, setEditingSession] = useState(null);

  // Access control
  const userType = currentUser?.user_type ?? 5;
  const allowedRoles = [0, 1, 2];

  // Fetch accessible branches
  const fetchAccessibleBranches = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const data = await apiClient.get(`/api/employees/branches/accessible?userId=${currentUser.id}`);
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  }, [currentUser]);

  // Fetch workers
  const fetchWorkers = useCallback(async () => {
    try {
      let url = `/api/duty-hours/admin/workers?current_user_id=${currentUser.id}`;
      if (filter.branchId) {
        url += `&branch_id=${filter.branchId}`;
      }
      const data = await apiClient.get(url);
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setWorkers([]);
    }
  }, [currentUser, filter.branchId]);

  // Fetch duty hours
  const fetchDutyHours = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        current_user_id: currentUser.id,
        ...(filter.userId && { user_id: filter.userId }),
        ...(filter.branchId && { branch_id: filter.branchId }),
        start_date: filter.startDate,
        end_date: filter.endDate
      });
      
      const data = await apiClient.get(`/api/duty-hours/admin/all?${params.toString()}`);
      setSessions(data);
    } catch (error) {
      console.error('Error fetching duty hours:', error);
      toast.error('Failed to load duty hours');
    } finally {
      setLoading(false);
    }
  }, [filter, currentUser]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchAccessibleBranches();
    }
  }, [currentUser, fetchAccessibleBranches]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchWorkers();
    }
  }, [currentUser, filter.branchId, fetchWorkers]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchDutyHours();
    }
  }, [currentUser, filter, fetchDutyHours]);

  // Reset employee filter when branch changes
  useEffect(() => {
    if (filter.branchId) {
      setFilter(prev => ({ ...prev, userId: '' }));
    }
  }, [filter.branchId]);

  // Process sessions into table data
  const tableData = useMemo(() => {
    const workSessions = sessions.filter(session => session.session_type === 'work');
    
    const groupedByUserAndDate = workSessions.reduce((groups, session) => {
      const dateKey = `${session.user_id}-${session.date}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          userName: session.username || `User ${session.user_id}`,
          userId: session.user_id,
          date: session.date,
          sessions: []
        };
      }
      groups[dateKey].sessions.push(session);
      return groups;
    }, {});

    return Object.values(groupedByUserAndDate).map(group => {
      const sortedSessions = group.sessions.sort((a, b) => a.in_time.localeCompare(b.in_time));

      let pairs = [];
      let totalHours = 0;

      for (let i = 0; i < sortedSessions.length; i++) {
        const session = sortedSessions[i];
        
        const pair = {
          inTime: session.in_time,
          outTime: session.out_time,
          sessionId: session.id,
          session: session
        };

        pairs.push(pair);

        if (pair.inTime && pair.outTime) {
          const inTimeParts = pair.inTime.split(':').map(Number);
          const outTimeParts = pair.outTime.split(':').map(Number);
          const inMinutes = inTimeParts[0] * 60 + inTimeParts[1];
          const outMinutes = outTimeParts[0] * 60 + outTimeParts[1];
          const hours = (outMinutes - inMinutes) / 60;
          totalHours += hours;
        }
      }

      const dateObj = new Date(group.date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        userName: group.userName,
        userId: group.userId,
        date: formattedDate,
        dayName: dayName,
        pairs,
        totalHours: totalHours.toFixed(2),
        rawDate: group.date,
        sessions: sortedSessions
      };
    });
  }, [sessions]);

  // Sort by date
  const sortedTableData = useMemo(() => {
    return tableData.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
  }, [tableData]);

  // Calculate totals
  const calculateTotals = () => {
    let totalWork = 0, totalBreak = 0;
    sessions.forEach(session => {
      if (session.out_time && session.duration) {
        if (session.session_type === 'work') totalWork += parseFloat(session.duration);
        else totalBreak += parseFloat(session.duration);
      }
    });
    return { 
      work: totalWork.toFixed(2), 
      break: totalBreak.toFixed(2), 
      total: (totalWork + totalBreak).toFixed(2) 
    };
  };

  const totals = calculateTotals();

  // Format time display
  const formatTimeDisplay = (timeString) => {
    if (!timeString || timeString === 'NULL') return 'NULL';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Delete session
  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      await apiClient.delete(`/api/duty-hours/${sessionId}`);
      toast.success('Session deleted successfully!');
      fetchDutyHours();
      setShowDayActions(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error.message || 'Failed to delete session');
    }
  };

  // Update session
  const handleUpdateSession = async (sessionData) => {
    try {
      // Ensure time format is HH:MM:SS
      const formatTime = (time) => {
        if (!time) return null;
        // If already in HH:MM:SS format, return as is
        if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
          return time;
        }
        // If in HH:MM format, add :00
        if (time.match(/^\d{2}:\d{2}$/)) {
          return `${time}:00`;
        }
        // Otherwise, try to parse and format
        const parts = time.split(':');
        if (parts.length >= 2) {
          const hours = parts[0].padStart(2, '0');
          const minutes = parts[1].padStart(2, '0');
          const seconds = parts[2] ? parts[2].padStart(2, '0') : '00';
          return `${hours}:${minutes}:${seconds}`;
        }
        return time;
      };

      const updateData = {
        ...sessionData,
        in_time: formatTime(sessionData.in_time),
        out_time: sessionData.out_time ? formatTime(sessionData.out_time) : null,
        update_by: currentUser.id
      };

      await apiClient.put(`/api/duty-hours/${sessionData.id}`, updateData);
      toast.success('Session updated successfully!');
      setShowEditModal(false);
      setEditingSession(null);
      setShowDayActions(null);
      fetchDutyHours();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error(error.message || 'Failed to update session');
    }
  };

  // Create session
  const handleCreateSession = async () => {
    if (!newSession.user_id || !newSession.in_time || !newSession.date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // Ensure time format is HH:MM:SS
      const formatTime = (time) => {
        if (!time) return null;
        // If already in HH:MM:SS format, return as is
        if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
          return time;
        }
        // If in HH:MM format, add :00
        if (time.match(/^\d{2}:\d{2}$/)) {
          return `${time}:00`;
        }
        // Otherwise, try to parse and format
        const parts = time.split(':');
        if (parts.length >= 2) {
          const hours = parts[0].padStart(2, '0');
          const minutes = parts[1].padStart(2, '0');
          const seconds = parts[2] ? parts[2].padStart(2, '0') : '00';
          return `${hours}:${minutes}:${seconds}`;
        }
        return time;
      };

      const createData = {
        ...newSession,
        in_time: formatTime(newSession.in_time),
        out_time: newSession.out_time ? formatTime(newSession.out_time) : null,
        update_by: currentUser.id
      };

      await apiClient.post('/api/duty-hours/admin/create', createData);
      toast.success('Session created successfully!');
      setShowCreateModal(false);
      setNewSession({
        user_id: '',
        session_type: 'work',
        in_time: '',
        out_time: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchDutyHours();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.message || 'Failed to create session');
    }
  };

  // Handle day actions
  const handleDayAction = (dayData) => {
    setShowDayActions(dayData);
  };

  // Handle edit from day actions
  const handleEditFromDay = (sessionData) => {
    setEditingSession(sessionData);
    setShowDayActions(null);
    setShowEditModal(true);
  };

  // Handle add from day actions
  const handleAddFromDay = (dayData) => {
    setNewSession(prev => ({
      ...prev,
      user_id: dayData.userId,
      date: (() => {
        const dateParts = dayData.date.split('/');
        return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      })()
    }));
    setShowDayActions(null);
    setShowCreateModal(true);
  };

  if (!allowedRoles.includes(userType)) {
    return (
      <div className="mobile-page">
        <div className="mobile-page-content">
          <div className="mobile-empty-state">
            <div className="text-6xl mb-4">🚫</div>
            <div className="text-gray-400">Access denied. Admin/Manager access required.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page">
      <Toaster position="top-center" />
      <div className="mobile-page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mobile-page-title">Admin Duty Hours</h1>
            <p className="text-sm text-gray-400 mt-1">
              {currentUser?.username} ({getRoleName(userType)})
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mobile-button mobile-button-primary"
            style={{ padding: '10px 16px', fontSize: '14px' }}
          >
            + Add
          </button>
        </div>
      </div>
      
      <div className="mobile-page-content">
        {/* Filters */}
        <div className="mobile-card" style={{ marginBottom: '16px' }}>
          <div className="space-y-3">
            {branches.length > 0 && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Branch</label>
                <select
                  value={filter.branchId}
                  onChange={(e) => setFilter({ ...filter, branchId: e.target.value, userId: '' })}
                  className="mobile-input mobile-select"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Employee</label>
              <select
                value={filter.userId}
                onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                className="mobile-input mobile-select"
              >
                <option value="">All Employees</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.username}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                  className="mobile-input"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                  className="mobile-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="mobile-card text-center" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%)' }}>
            <div className="text-xl font-bold text-blue-300 mb-1">{totals.work}h</div>
            <div className="text-xs text-blue-400/80">Work Hours</div>
          </div>
          <div className="mobile-card text-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%)' }}>
            <div className="text-xl font-bold text-purple-300 mb-1">{totals.break}h</div>
            <div className="text-xs text-purple-400/80">Break Hours</div>
          </div>
          <div className="mobile-card text-center">
            <div className="text-xl font-bold text-white mb-1">{totals.total}h</div>
            <div className="text-xs text-gray-400">Total Hours</div>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2 text-sm">Loading sessions...</p>
          </div>
        ) : sortedTableData.length === 0 ? (
          <div className="mobile-empty-state">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-gray-400">No sessions found</div>
          </div>
        ) : (
          <div className="mobile-task-list">
            {sortedTableData.map((row, rowIndex) => (
              <div key={rowIndex} className="mobile-card">
                <div className="mobile-task-header">
                  <div>
                    <h3 className="mobile-task-title">{row.userName}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {row.date} ({row.dayName})
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-300 mb-2">{row.totalHours}h</div>
                    <button
                      onClick={() => handleDayAction(row)}
                      className="mobile-button mobile-button-primary"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      Manage
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {row.pairs.map((pair, pairIndex) => (
                    <div key={pairIndex} className="bg-gray-700/30 rounded p-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-300">
                          {formatTimeDisplay(pair.inTime)} - {pair.outTime ? formatTimeDisplay(pair.outTime) : 'Active'}
                        </span>
                        {pair.inTime && pair.outTime && (
                          <span className="text-gray-400">
                            {(() => {
                              const inTimeParts = pair.inTime.split(':').map(Number);
                              const outTimeParts = pair.outTime.split(':').map(Number);
                              const inMinutes = inTimeParts[0] * 60 + inTimeParts[1];
                              const outMinutes = outTimeParts[0] * 60 + outTimeParts[1];
                              const hours = ((outMinutes - inMinutes) / 60).toFixed(1);
                              return `${hours}h`;
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      <MobileModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewSession({
            user_id: '',
            session_type: 'work',
            in_time: '',
            out_time: '',
            date: new Date().toISOString().split('T')[0],
            notes: ''
          });
        }}
        title="Create Session"
        size="large"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Employee *</label>
            <select
              value={newSession.user_id}
              onChange={(e) => setNewSession({ ...newSession, user_id: e.target.value })}
              className="mobile-input mobile-select"
              required
            >
              <option value="">Choose an employee...</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Date *</label>
            <input
              type="date"
              value={newSession.date}
              onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
              className="mobile-input"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Session Type</label>
            <select
              value={newSession.session_type}
              onChange={(e) => setNewSession({ ...newSession, session_type: e.target.value })}
              className="mobile-input mobile-select"
            >
              <option value="work">Work</option>
              <option value="break">Break</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">In Time (HH:MM:SS) *</label>
            <input
              type="time"
              step="1"
              value={newSession.in_time ? (newSession.in_time.length >= 5 ? newSession.in_time.substring(0, 5) : newSession.in_time) : ''}
              onChange={(e) => {
                const time = e.target.value;
                // Ensure we format as HH:MM:SS
                if (time) {
                  const parts = time.split(':');
                  if (parts.length === 2) {
                    setNewSession({ ...newSession, in_time: `${parts[0]}:${parts[1]}:00` });
                  } else {
                    setNewSession({ ...newSession, in_time: time });
                  }
                } else {
                  setNewSession({ ...newSession, in_time: '' });
                }
              }}
              className="mobile-input"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Out Time (HH:MM:SS)</label>
            <input
              type="time"
              step="1"
              value={newSession.out_time ? (newSession.out_time.length >= 5 ? newSession.out_time.substring(0, 5) : newSession.out_time) : ''}
              onChange={(e) => {
                const time = e.target.value;
                // Ensure we format as HH:MM:SS
                if (time) {
                  const parts = time.split(':');
                  if (parts.length === 2) {
                    setNewSession({ ...newSession, out_time: `${parts[0]}:${parts[1]}:00` });
                  } else {
                    setNewSession({ ...newSession, out_time: time });
                  }
                } else {
                  setNewSession({ ...newSession, out_time: '' });
                }
              }}
              className="mobile-input"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Notes</label>
            <textarea
              value={newSession.notes}
              onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
              className="mobile-input"
              rows="3"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setNewSession({
                  user_id: '',
                  session_type: 'work',
                  in_time: '',
                  out_time: '',
                  date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
              }}
              className="mobile-button mobile-button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSession}
              className="mobile-button mobile-button-primary flex-1"
            >
              Create Session
            </button>
          </div>
        </div>
      </MobileModal>

      {/* Edit Session Modal */}
      <MobileModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSession(null);
        }}
        title="Edit Session"
        size="large"
      >
        {editingSession && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Date *</label>
              <input
                type="date"
                value={editingSession.date ? editingSession.date.split('T')[0] : ''}
                onChange={(e) => setEditingSession({ ...editingSession, date: e.target.value })}
                className="mobile-input"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Session Type</label>
              <select
                value={editingSession.session_type}
                onChange={(e) => setEditingSession({ ...editingSession, session_type: e.target.value })}
                className="mobile-input mobile-select"
              >
                <option value="work">Work</option>
                <option value="break">Break</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">In Time (HH:MM:SS) *</label>
              <input
                type="time"
                step="1"
                value={editingSession.in_time ? editingSession.in_time.substring(0, 5) : ''}
                onChange={(e) => {
                  const time = e.target.value;
                  setEditingSession({ ...editingSession, in_time: time ? `${time}:00` : '' });
                }}
                className="mobile-input"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Out Time (HH:MM:SS)</label>
              <input
                type="time"
                step="1"
                value={editingSession.out_time ? editingSession.out_time.substring(0, 5) : ''}
                onChange={(e) => {
                  const time = e.target.value;
                  setEditingSession({ ...editingSession, out_time: time ? `${time}:00` : '' });
                }}
                className="mobile-input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Notes</label>
              <textarea
                value={editingSession.notes || ''}
                onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                className="mobile-input"
                rows="3"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSession(null);
                }}
                className="mobile-button mobile-button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateSession(editingSession)}
                className="mobile-button mobile-button-primary flex-1"
              >
                Update Session
              </button>
            </div>
          </div>
        )}
      </MobileModal>

      {/* Day Actions Modal */}
      <MobileModal
        isOpen={!!showDayActions}
        onClose={() => setShowDayActions(null)}
        title={`Manage Sessions - ${showDayActions?.userName || ''}`}
        size="large"
      >
        {showDayActions && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              Date: {showDayActions.date} ({showDayActions.dayName})
            </div>

            <div className="space-y-2">
              {showDayActions.pairs.map((pair, index) => {
                const sessionData = showDayActions.sessions?.find(s => s.id === pair.sessionId);
                
                return (
                  <div key={index} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/50">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="text-sm text-white">
                          {formatTimeDisplay(pair.inTime)} - {pair.outTime ? formatTimeDisplay(pair.outTime) : 'Active'}
                        </div>
                        {sessionData && sessionData.auto_generated === 0 && (
                          <span className="text-xs text-orange-400">Manual Entry</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {sessionData && (
                          <>
                            <button
                              onClick={() => handleEditFromDay({
                                id: sessionData.id,
                                session_type: sessionData.session_type || 'work',
                                date: showDayActions.rawDate,
                                in_time: sessionData.in_time,
                                out_time: sessionData.out_time,
                                notes: sessionData.notes || ''
                              })}
                              className="mobile-button mobile-button-primary"
                              style={{ padding: '8px 16px', fontSize: '12px' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSession(pair.sessionId)}
                              className="mobile-button mobile-button-primary"
                              style={{ padding: '8px 16px', fontSize: '12px' }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => handleAddFromDay(showDayActions)}
              className="mobile-button mobile-button-primary"
              style={{ width: '100%' }}
            >
              + Add New Session
            </button>

            <button
              onClick={() => setShowDayActions(null)}
              className="mobile-button mobile-button-secondary"
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        )}
      </MobileModal>
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

export default MobileAdminDutyHours;

