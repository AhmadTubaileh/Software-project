import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import CurrentStatusCard from '../components/TimeTracking/CurrentStatusCard.jsx';
import SummaryCards from '../components/TimeTracking/SummaryCards.jsx';
import Timeline from '../components/TimeTracking/Timeline.jsx';
import InfoPanel from '../components/TimeTracking/InfoPanel.jsx';

function TimeTracking() {
  const [currentSession, setCurrentSession] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clockOutNotes, setClockOutNotes] = useState('');
  const { currentUser } = useLocalSession();

  // ========== ACCESS CONTROL ==========
  // Get user_type from currentUser
  const userType = currentUser?.user_type ?? 5;
  
  // Define allowed roles for Time Tracking
  // Currently: ALL roles (0-5) can access, but this is explicit for future changes
  const allowedRoles = [0, 1, 2, 3, 4, 5];
  
  // Check if user is authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white flex items-center justify-center">
        <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400 mb-4">
              Please log in to access Time Tracking.
            </p>
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if user has permission (even though all roles currently allowed)
  if (!allowedRoles.includes(userType)) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        {/* Show sidebar if user has access to other parts */}
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}
        <div className={`min-h-screen flex items-center justify-center ${
          currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
        }`}>
          <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-4">
                Your account ({getRoleName(userType)}) does not have permission to access Time Tracking.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Contact your administrator if you believe this is an error.
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
  // ========== END ACCESS CONTROL ==========

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
      toast.error(error.message);
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
        body: JSON.stringify({ 
          user_id: currentUser.id, 
          session_type: 'work' // Always work for clock-in
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

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
      const response = await fetch('http://localhost:5000/api/duty-hours/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: currentUser.id, 
          notes: clockOutNotes 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

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
    const start = new Date(currentSession.in_time);
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
    const sortedSessions = [...todaySessions].sort((a, b) => 
      new Date(a.in_time) - new Date(b.in_time)
    );

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
          const breakStart = new Date(prevSession.out_time);
          const breakEnd = new Date(session.in_time);
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

  // Check if user should see sidebar (based on original logic)
  const showSidebar = currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee');

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />
      {showSidebar && <AdminSidebar />}

      <main className={`flex-1 min-h-screen transition-all duration-300 ${
        showSidebar ? 'ml-64' : ''
      }`}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
              Time Tracking
            </h1>
            <p className="text-gray-400 text-lg">Simple clock in/out with automatic break detection</p>
            <p className="text-gray-500 text-sm mt-1">
              Logged in as: {currentUser?.username} ({getRoleName(userType)})
            </p>
          </div>

          <CurrentStatusCard
            currentSession={currentSession}
            clockOutNotes={clockOutNotes}
            setClockOutNotes={setClockOutNotes}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            isLoading={isLoading}
            calculateCurrentDuration={calculateCurrentDuration}
          />

          <SummaryCards todayStats={todayStats} />

          <Timeline
            todaySessions={todaySessions}
            todayStats={todayStats}
          />

          <InfoPanel />
        </div>
      </main>
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

export default TimeTracking;