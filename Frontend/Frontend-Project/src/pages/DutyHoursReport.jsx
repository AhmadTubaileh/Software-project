import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';
import DateFilters from '../components/DutyHoursReport/DateFilters.jsx';
import SummaryCards from '../components/DutyHoursReport/SummaryCards.jsx';
import DutyHoursTable from '../components/DutyHoursReport/DutyHoursTable.jsx';

function DutyHoursReport() {
  const { currentUser } = useLocalSession();
  
  // ========== ACCESS CONTROL START ==========
  // Get user_type from currentUser
  const userType = currentUser?.user_type ?? 5; // Default to trainee if not set
  
  // This page is accessible to ALL user types (0-5) - Everyone can see their own duty hours
  const allowedRoles = [0, 1, 2, 3, 4, 5];
  
  if (!allowedRoles.includes(userType)) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        <AdminSidebar />
        <div className="ml-64 min-h-screen flex items-center justify-center">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-4">
                Please log in to view your duty hours.
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
  // ========== ACCESS CONTROL END ==========

  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);

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

  // Check if user should see sidebar (based on original logic)
  const showSidebar = currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee');

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />
      {showSidebar && <AdminSidebar />}

      <main className={`flex-1 min-h-screen transition-all duration-300 ${
        showSidebar ? 'ml-64' : ''
      }`}>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              My Duty Hours
            </h1>
            <p className="text-gray-400">View your work sessions in table format</p>
            <p className="text-gray-500 text-sm mt-1">
              Logged in as: {currentUser?.username} ({getRoleName(userType)})
            </p>
          </div>

          <DateFilters
            filter={filter}
            setFilter={setFilter}
            isLoading={isLoading}
          />

          <SummaryCards totals={totals} />

          <DutyHoursTable 
            sessions={sessions} 
            currentUser={currentUser}
            isLoading={isLoading}
          />
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

export default DutyHoursReport;