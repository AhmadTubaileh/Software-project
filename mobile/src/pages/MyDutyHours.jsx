import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { apiClient } from '../shared/api/apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import './MobilePage.css';

function MobileMyDutyHours() {
  const { currentUser } = useLocalSession();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (currentUser?.id) {
      fetchSessions();
    }
  }, [currentUser, filter]);

  const fetchSessions = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const data = await apiClient.get(
        `/api/duty-hours/user/${currentUser.id}?start_date=${filter.startDate}&end_date=${filter.endDate}`
      );
      setSessions(data);
    } catch (error) {
      console.error('Error fetching duty hours:', error);
      toast.error('Failed to load duty hours');
    } finally {
      setLoading(false);
    }
  };

  // Process sessions into table data - ONLY WORK SESSIONS
  const tableData = useMemo(() => {
    const workSessions = sessions.filter(session => session.session_type === 'work');
    
    // Group by date
    const groupedByDate = workSessions.reduce((groups, session) => {
      const workDate = session.date;
      if (!groups[workDate]) {
        groups[workDate] = {
          date: workDate,
          sessions: []
        };
      }
      groups[workDate].sessions.push(session);
      return groups;
    }, {});

    return Object.values(groupedByDate).map(group => {
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
        userName: currentUser?.username || 'User',
        date: formattedDate,
        dayName: dayName,
        pairs,
        totalHours: totalHours.toFixed(2),
        rawDate: group.date,
        sessions: sortedSessions
      };
    });
  }, [sessions, currentUser]);

  // Sort by date (oldest first)
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
    return { work: totalWork.toFixed(2), break: totalBreak.toFixed(2), total: (totalWork + totalBreak).toFixed(2) };
  };

  const totals = calculateTotals();

  // Format time display (convert 24h to 12h format)
  const formatTimeDisplay = (timeString) => {
    if (!timeString || timeString === 'NULL') return 'NULL';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to get role name
  const getRoleName = (userType) => {
    switch(userType) {
      case 0: return 'Administrator';
      case 1: return 'Senior Manager';
      case 2: return 'Manager';
      case 3: return 'Supervisor';
      case 4: return 'Employee';
      case 5: return 'Trainee';
      default: return 'User';
    }
  };

  if (!currentUser) {
    return (
      <div className="mobile-page">
        <div className="mobile-page-content">
          <div className="text-center py-8 text-gray-400">
            Please log in to view your duty hours
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page">
      <Toaster position="top-center" />
      <div className="mobile-page-header">
        <h1 className="mobile-page-title">My Duty Hours</h1>
        <p className="text-sm text-gray-400 mt-1">
          {currentUser?.username} ({getRoleName(currentUser?.user_type ?? 5)})
        </p>
      </div>
      
      <div className="mobile-page-content">
        {/* Date Filters */}
        <div className="mobile-card" style={{ marginBottom: '16px' }}>
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
                    <div className="text-lg font-bold text-blue-300">{row.totalHours}h</div>
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
    </div>
  );
}

export default MobileMyDutyHours;

