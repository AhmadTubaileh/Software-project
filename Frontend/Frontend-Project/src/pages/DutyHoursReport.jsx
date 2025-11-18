import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';

function DutyHoursReport() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useLocalSession();

  const statusStyles = {
    work: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300' },
    break: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300' }
  };

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

          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                  {isLoading ? 'Loading...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20 text-center">
              <div className="text-3xl font-bold text-blue-300 mb-2">{totals.work}h</div>
              <div className="text-blue-400/80 font-medium">Work Hours</div>
            </div>
            <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/20 text-center">
              <div className="text-3xl font-bold text-purple-300 mb-2">{totals.break}h</div>
              <div className="text-purple-400/80 font-medium">Break Hours</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50 text-center">
              <div className="text-3xl font-bold text-white mb-2">{totals.total}h</div>
              <div className="text-gray-400 font-medium">Total Hours</div>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([date, dateSessions]) => {
              const dateTotal = dateSessions.reduce((total, session) => total + (session.duration ? parseFloat(session.duration) : 0), 0);
              return (
                <div key={date} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="text-lg font-bold text-gray-300">Total: {dateTotal.toFixed(2)}h</div>
                  </div>
                  <div className="space-y-3">
                    {dateSessions.map((session) => (
                      <div key={session.id} className={`p-4 rounded-xl border ${statusStyles[session.session_type].bg} ${statusStyles[session.session_type].border}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-3 h-3 rounded-full ${statusStyles[session.session_type].dot}`} />
                              <span className={`font-medium capitalize ${statusStyles[session.session_type].text}`}>{session.session_type}</span>
                              {!session.out_time && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">Active</span>}
                            </div>
                            <div className="text-sm text-gray-300 space-y-1">
                              <div><strong>In:</strong> {new Date(session.in_time).toLocaleString()}</div>
                              {session.out_time && <div><strong>Out:</strong> {new Date(session.out_time).toLocaleString()}</div>}
                              {session.duration && <div><strong>Duration:</strong> {session.duration} hours</div>}
                            </div>
                            {session.notes && <div className="mt-2 text-sm text-gray-300"><strong>Notes:</strong> {session.notes}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

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