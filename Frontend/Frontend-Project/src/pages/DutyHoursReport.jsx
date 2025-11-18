import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import DateFilters from '../components/DutyHoursReport/DateFilters.jsx';
import SummaryCards from '../components/DutyHoursReport/SummaryCards.jsx';
import SessionGroup from '../components/DutyHoursReport/SessionGroup.jsx';

function DutyHoursReport() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useLocalSession();

  const fetchDutyHours = useCallback(async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    try {
      const { startDate, endDate } = filter;
      const response = await fetch(
        `http://localhost:5000/api/duty-hours/user/${currentUser.id}?start_date=${startDate}&end_date=${endDate}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch duty hours');
      }

      const data = await response.json();
      setSessions(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, filter]);

  useEffect(() => {
    fetchDutyHours();
  }, [fetchDutyHours]);

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
  
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = session.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(session);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}

      <main className={`flex-1 min-h-screen transition-all duration-300 ${
        currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
      }`}>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              My Duty Hours
            </h1>
            <p className="text-gray-400">View your work and break sessions</p>
          </div>

          <DateFilters
            filter={filter}
            setFilter={setFilter}
            onGenerateReport={fetchDutyHours}
            isLoading={isLoading}
          />

          <SummaryCards totals={totals} />

          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([date, dateSessions]) => (
              <SessionGroup
                key={date}
                date={date}
                sessions={dateSessions}
              />
            ))}

            {sessions.length === 0 && !isLoading && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
                <p>No duty hours recorded for the selected date range</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading duty hours...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DutyHoursReport;