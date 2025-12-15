import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import { apiClient } from '../shared/api/apiClient.js';
import toast, { Toaster } from 'react-hot-toast';
import './MobilePage.css';

function MobileTimeTracking() {
  const { currentUser } = useLocalSession();
  const [currentSession, setCurrentSession] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clockOutNotes, setClockOutNotes] = useState('');

  const fetchCurrentStatus = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await apiClient.get(
        `/api/duty-hours/user/${currentUser.id}?start_date=${today}&end_date=${today}`
      );
      const active = data.find(session => !session.out_time);
      setCurrentSession(active || null);
      setTodaySessions(data);
    } catch (error) {
      console.error('Error fetching current status:', error);
      toast.error(error.message);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCurrentStatus();
    const interval = setInterval(fetchCurrentStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchCurrentStatus]);

  const handleClockIn = async () => {
    if (!currentUser?.id) {
      toast.error('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/api/duty-hours/clock-in', {
        user_id: currentUser.id,
        session_type: 'work'
      });
      toast.success('Work session started!');
      fetchCurrentStatus();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentUser?.id) {
      toast.error('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/api/duty-hours/clock-out', {
        user_id: currentUser.id,
        notes: clockOutNotes
      });
      toast.success('Work session ended!');
      setClockOutNotes('');
      fetchCurrentStatus();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate current session duration
  const calculateCurrentDuration = () => {
    if (!currentSession) return '0:00';
    
    const now = new Date();
    // Parse time string (HH:MM:SS) to calculate duration
    const timeParts = currentSession.in_time.split(':').map(Number);
    const start = new Date();
    start.setHours(timeParts[0], timeParts[1], timeParts[2] || 0, 0);
    
    const diffMs = now - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Calculate today's totals and auto-detect breaks
  const calculateTodayStats = () => {
    let totalWork = 0;
    let totalBreak = 0;
    let autoBreaks = [];

    // Sort sessions by time
    const sortedSessions = [...todaySessions].sort((a, b) => {
      const aTime = a.in_time.split(':').map(Number);
      const bTime = b.in_time.split(':').map(Number);
      return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
    });

    // Calculate work hours and detect breaks
    sortedSessions.forEach((session, index) => {
      if (session.out_time && session.duration) {
        if (session.session_type === 'work') {
          totalWork += parseFloat(session.duration);
        } else {
          totalBreak += parseFloat(session.duration);
        }
      }

      // Auto-detect breaks between work sessions
      if (index > 0 && session.session_type === 'work') {
        const prevSession = sortedSessions[index - 1];
        if (prevSession.session_type === 'work' && prevSession.out_time) {
          const breakStart = new Date(`${prevSession.date} ${prevSession.out_time}`);
          const breakEnd = new Date(`${session.date} ${session.in_time}`);
          const breakDuration = (breakEnd - breakStart) / (1000 * 60 * 60); // hours
          
          if (breakDuration > 0.0167) { // More than 1 minute
            autoBreaks.push({
              start: breakStart,
              end: breakEnd,
              duration: breakDuration.toFixed(2)
            });
            totalBreak += breakDuration;
          }
        }
      }
    });

    return { 
      work: totalWork.toFixed(2), 
      break: totalBreak.toFixed(2), 
      total: (totalWork + totalBreak).toFixed(2),
      autoBreaks 
    };
  };

  const todayStats = calculateTodayStats();

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
            Please log in to access time tracking
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page">
      <Toaster position="top-center" />
      <div className="mobile-page-header">
        <h1 className="mobile-page-title">Time Tracking</h1>
        <p className="text-sm text-gray-400 mt-1">
          {currentUser?.username} ({getRoleName(currentUser?.user_type ?? 5)})
        </p>
      </div>
      
      <div className="mobile-page-content">
        {/* Current Status Card */}
        <div className="mobile-card" style={{ marginBottom: '24px' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Current Status</h2>
              <p className="text-gray-400 text-sm">
                {currentSession ? 'Active work session' : 'No active session'}
              </p>
            </div>
            {currentSession && (
              <div className="px-3 py-1 rounded-full border bg-blue-500/20 border-blue-500/30 text-blue-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" style={{ animation: 'pulse 2s infinite' }} />
                  <span className="font-medium text-xs">Working</span>
                </div>
              </div>
            )}
          </div>

          {currentSession ? (
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-white mb-3">
                {calculateCurrentDuration()}
              </div>
              <p className="text-gray-400 mb-4 text-sm">
                Started at {currentSession.in_time}
              </p>
              
              <div className="space-y-3">
                <textarea
                  value={clockOutNotes}
                  onChange={(e) => setClockOutNotes(e.target.value)}
                  placeholder="Add notes for this work session (optional)"
                  className="mobile-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  rows="3"
                />
                <button
                  onClick={handleClockOut}
                  disabled={isLoading}
                  className="mobile-button mobile-button-primary"
                  style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' }}
                >
                  {isLoading ? 'Ending Work...' : 'End Work Session'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <div className="text-5xl mb-3">⏰</div>
                <p className="text-gray-400">Ready to start your work day?</p>
              </div>
              <button
                onClick={handleClockIn}
                disabled={isLoading}
                className="mobile-button mobile-button-primary"
                style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' }}
              >
                {isLoading ? 'Starting Work...' : 'Start Work Session'}
              </button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="mobile-card text-center" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)' }}>
            <div className="text-2xl font-bold text-blue-300">{todayStats.work}h</div>
            <div className="text-xs text-blue-400/80 mt-1">Work Hours</div>
          </div>
          <div className="mobile-card text-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)' }}>
            <div className="text-2xl font-bold text-purple-300">{todayStats.break}h</div>
            <div className="text-xs text-purple-400/80 mt-1">Break Hours</div>
          </div>
          <div className="mobile-card text-center">
            <div className="text-2xl font-bold text-white">{todayStats.total}h</div>
            <div className="text-xs text-gray-400 mt-1">Total Hours</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mobile-card">
          <h3 className="text-lg font-semibold text-white mb-4">Today's Timeline</h3>
          
          {todaySessions.length > 0 ? (
            <div className="space-y-3">
              {todaySessions.map((session, index) => {
                const sortedSessions = [...todaySessions].sort((a, b) => {
                  const aTime = a.in_time.split(':').map(Number);
                  const bTime = b.in_time.split(':').map(Number);
                  return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
                });
                
                const autoBreak = index > 0 && todayStats.autoBreaks[index - 1];
                
                return (
                  <div key={session.id}>
                    {/* Auto-detected Break */}
                    {autoBreak && (
                      <div className="mb-2 p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span className="font-medium text-purple-300 text-sm">Auto Break</span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-mono text-sm">
                              {autoBreak.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} -{' '}
                              {autoBreak.end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-purple-300">
                              {autoBreak.duration}h
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Work Session */}
                    <div className={`p-3 rounded-lg border ${
                      session.session_type === 'work' 
                        ? 'bg-blue-500/20 border-blue-500/30' 
                        : 'bg-purple-500/20 border-purple-500/30'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            session.session_type === 'work' ? 'bg-blue-400' : 'bg-purple-400'
                          }`} />
                          <span className="font-medium capitalize text-sm">
                            {session.session_type}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-mono text-sm">
                            {session.in_time} - {session.out_time || 'Active'}
                          </div>
                          {session.duration && (
                            <div className="text-xs text-gray-300">
                              {parseFloat(session.duration).toFixed(1)}h
                            </div>
                          )}
                        </div>
                      </div>
                      {session.notes && (
                        <div className="mt-2 text-xs text-gray-300">
                          📝 {session.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📅</div>
              <p>No sessions recorded today</p>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="mobile-card mt-4" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
          <h4 className="text-sm font-semibold text-white mb-2">ℹ️ How It Works</h4>
          <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
            <li>Click "Start Work Session" to begin tracking</li>
            <li>Add notes when clocking out (optional)</li>
            <li>Breaks are automatically detected between sessions</li>
            <li>View your timeline and statistics below</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MobileTimeTracking;
