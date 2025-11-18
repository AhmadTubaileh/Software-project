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
            <p className="text-gray-400 text-lg">Simple clock in/out with automatic break detection</p>
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

export default TimeTracking;