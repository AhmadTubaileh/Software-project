import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';

function TimeTracking() {
  const [currentSession, setCurrentSession] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionType, setSessionType] = useState('work');
  const [clockOutNotes, setClockOutNotes] = useState('');
  const { currentUser } = useLocalSession();

  const statusStyles = {
    work: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
    break: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' }
  };

  const fetchCurrentStatus = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `http://localhost:5000/api/duty-hours/user/${currentUser.id}?start_date=${today}&end_date=${today}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch sessions');
      }

      const data = await response.json();
      const active = data.find(session => !session.out_time);
      setCurrentSession(active || null);
      setTodaySessions(data);
    } catch (error) {
      console.error('Error fetching current status:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCurrentStatus();
    const interval = setInterval(fetchCurrentStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchCurrentStatus]);

  const handleClockIn = async () => {
    if (!currentUser?.id) {
      toast.error('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/duty-hours/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, session_type: sessionType }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(data.message);
      setSessionType('work');
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
      const response = await fetch('http://localhost:5000/api/duty-hours/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, notes: clockOutNotes }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(data.message);
      setClockOutNotes('');
      fetchCurrentStatus();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCurrentDuration = () => {
    if (!currentSession) return '0:00';
    const now = new Date();
    const start = new Date(currentSession.in_time);
    const diffMs = now - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateTodayTotals = () => {
    let totalWork = 0, totalBreak = 0;
    todaySessions.forEach(session => {
      if (session.out_time && session.duration) {
        if (session.session_type === 'work') totalWork += parseFloat(session.duration);
        else totalBreak += parseFloat(session.duration);
      }
    });
    return { work: totalWork.toFixed(2), break: totalBreak.toFixed(2), total: (totalWork + totalBreak).toFixed(2) };
  };

  const todayTotals = calculateTodayTotals();

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}

      <main className={`flex-1 min-h-screen transition-all duration-300 ${
        currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
      }`}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
              Time Tracking
            </h1>
            <p className="text-gray-400 text-lg">Track your work and break sessions</p>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Current Status</h2>
                <p className="text-gray-400">
                  {currentSession ? `Active ${currentSession.session_type} session` : 'No active session'}
                </p>
              </div>
              {currentSession && (
                <div className={`px-4 py-2 rounded-full border ${statusStyles[currentSession.session_type].bg} ${statusStyles[currentSession.session_type].border} ${statusStyles[currentSession.session_type].text}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusStyles[currentSession.session_type].dot} animate-pulse`} />
                    <span className="font-medium capitalize">{currentSession.session_type}</span>
                  </div>
                </div>
              )}
            </div>

            {currentSession ? (
              <div className="text-center">
                <div className="text-5xl font-mono font-bold text-white mb-4">{calculateCurrentDuration()}</div>
                <p className="text-gray-400 mb-6">Started at {new Date(currentSession.in_time).toLocaleTimeString()}</p>
                <div className="space-y-4 max-w-md mx-auto">
                  <textarea
                    value={clockOutNotes}
                    onChange={(e) => setClockOutNotes(e.target.value)}
                    placeholder="Add notes for this session (optional)"
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows="3"
                  />
                  <button
                    onClick={handleClockOut}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                  >
                    {isLoading ? 'Clocking Out...' : 'Clock Out'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Session Type</label>
                  <div className="flex gap-4 justify-center">
                    {['work', 'break'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSessionType(type)}
                        className={`px-6 py-3 rounded-xl border transition-all duration-200 capitalize ${
                          sessionType === type
                            ? `${statusStyles[type].bg} ${statusStyles[type].border} ${statusStyles[type].text} scale-105`
                            : 'bg-gray-700/50 border-gray-600/50 text-gray-400 hover:bg-gray-600/50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleClockIn}
                  disabled={isLoading}
                  className={`w-full max-w-md mx-auto bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 ${
                    statusStyles[sessionType].border
                  }`}
                >
                  {isLoading ? 'Clocking In...' : `Clock In (${sessionType})`}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
              <div className="text-2xl font-bold text-blue-300">{todayTotals.work}h</div>
              <div className="text-blue-400/80 text-sm">Work Hours</div>
            </div>
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
              <div className="text-2xl font-bold text-purple-300">{todayTotals.break}h</div>
              <div className="text-purple-400/80 text-sm">Break Hours</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50 text-center">
              <div className="text-2xl font-bold text-white">{todayTotals.total}h</div>
              <div className="text-gray-400 text-sm">Total Today</div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-semibold text-white mb-4">Today's Sessions</h3>
            {todaySessions.length > 0 ? (
              <div className="space-y-3">
                {todaySessions.map((session) => (
                  <div key={session.id} className={`p-4 rounded-xl border ${statusStyles[session.session_type].bg} ${statusStyles[session.session_type].border}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusStyles[session.session_type].dot}`} />
                        <span className="font-medium capitalize">{session.session_type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">
                          {new Date(session.in_time).toLocaleTimeString()} - {session.out_time ? new Date(session.out_time).toLocaleTimeString() : 'Active'}
                        </div>
                        {session.duration && <div className="text-sm text-gray-300">Duration: {session.duration}h</div>}
                      </div>
                    </div>
                    {session.notes && <div className="mt-2 text-sm text-gray-300">📝 {session.notes}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">⏰</div>
                <p>No sessions recorded today</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TimeTracking;