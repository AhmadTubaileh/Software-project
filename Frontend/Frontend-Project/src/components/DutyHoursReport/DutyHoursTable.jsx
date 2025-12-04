import React, { useMemo, useState } from 'react';
import Pagination from './Pagination.jsx';

const DutyHoursTable = ({ sessions, currentUser, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Process sessions into table data - ONLY WORK SESSIONS
  const tableData = useMemo(() => {
    // Filter only work sessions
    const workSessions = sessions.filter(session => session.session_type === 'work');
    
    // Group by date field (the actual work date from database)
    const groupedByDate = workSessions.reduce((groups, session) => {
      // Use the date field from database (YYYY-MM-DD format)
      const workDate = session.date;
      if (!groups[workDate]) groups[workDate] = [];
      groups[workDate].push(session);
      return groups;
    }, {});

    return Object.entries(groupedByDate).map(([workDate, dateSessions]) => {
      // Sort sessions by in_time
      const sortedSessions = dateSessions.sort((a, b) => {
        // Handle NULL times by putting them at the end
        if (!a.in_time) return 1;
        if (!b.in_time) return -1;
        return a.in_time.localeCompare(b.in_time);
      });

      // Create pairs and calculate total hours
      let pairs = [];
      let totalHours = 0;

      for (let i = 0; i < sortedSessions.length; i++) {
        const session = sortedSessions[i];
        
        const pair = {
          inTime: session.in_time,
          outTime: session.out_time,
          sessionId: session.id
        };

        pairs.push(pair);

        // Calculate hours for this pair if both times exist
        if (pair.inTime && pair.outTime && pair.inTime !== 'NULL' && pair.outTime !== 'NULL') {
          // Parse time strings (HH:MM:SS) to calculate duration
          const inTimeParts = pair.inTime.split(':').map(Number);
          const outTimeParts = pair.outTime.split(':').map(Number);
          
          const inMinutes = inTimeParts[0] * 60 + inTimeParts[1] + (inTimeParts[2] / 60);
          const outMinutes = outTimeParts[0] * 60 + outTimeParts[1] + (outTimeParts[2] / 60);
          
          const hours = (outMinutes - inMinutes) / 60;
          totalHours += hours;
        }
      }

      // Format work date as dd/mm/yyyy from date field
      const dateObj = new Date(workDate);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // Get day name from work date
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        userName: currentUser?.username || 'User',
        date: formattedDate, // dd/mm/yyyy from date field
        dayName: dayName, // Day name from date field
        pairs,
        totalHours: totalHours.toFixed(2),
        rawDate: workDate // For sorting if needed
      };
    });
  }, [sessions, currentUser]);

  // Sort table data by work date (OLDEST first)
  const sortedTableData = useMemo(() => {
    return tableData.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
  }, [tableData]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedTableData.length / rowsPerPage);
  const currentData = sortedTableData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Find maximum pairs for column headers
  const maxPairs = useMemo(() => {
    return Math.max(...sortedTableData.map(item => item.pairs.length), 1);
  }, [sortedTableData]);

  // Format time display (convert 24h to 12h format)
  const formatTimeDisplay = (timeString) => {
    if (!timeString || timeString === 'NULL') return 'NULL';
    
    try {
      const [hours, minutes, seconds] = timeString.split(':');
      let hourNum = parseInt(hours);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      
      hourNum = hourNum % 12;
      hourNum = hourNum ? hourNum : 12;
      
      return `${hourNum}:${minutes}:${seconds} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return timeString;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading duty hours...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
        <p>No duty hours recorded for the selected date range</p>
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="text-center py-12 text-yellow-400">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">No Work Sessions Found</h3>
        <p>Only work sessions are displayed in this table</p>
        <div className="mt-4 text-sm">
          <p>Total sessions: {sessions.length}</p>
          <p>Work sessions: {sessions.filter(s => s.session_type === 'work').length}</p>
          <p>Break sessions: {sessions.filter(s => s.session_type === 'break').length}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
      {/* Session Summary */}
      <div className="mb-4 p-4 bg-blue-500/10 rounded-lg">
        <div className="text-sm text-blue-300">
          Showing {tableData.length} work days • {sessions.filter(s => s.session_type === 'work').length} work sessions
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap">User Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap">Work Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap">Day</th>
              
              {/* Dynamic IN/OUT headers */}
              {Array.from({ length: maxPairs }, (_, index) => (
                <React.Fragment key={index}>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap">
                    In {index + 1}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap">
                    Out {index + 1}
                  </th>
                </React.Fragment>
              ))}
              
              <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap">Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr 
                key={row.rawDate} 
                className={`border-b border-gray-700/50 ${
                  index % 2 === 0 ? 'bg-gray-700/20' : 'bg-gray-800/20'
                } hover:bg-gray-700/30 transition-colors`}
              >
                <td className="py-3 px-4 text-white whitespace-nowrap">{row.userName}</td>
                <td className="py-3 px-4 text-gray-300 whitespace-nowrap">{row.date}</td>
                <td className="py-3 px-4 text-gray-300 whitespace-nowrap">{row.dayName}</td>
                
                {/* Dynamic IN/OUT cells */}
                {Array.from({ length: maxPairs }, (_, pairIndex) => {
                  const pair = row.pairs[pairIndex] || {};
                  return (
                    <React.Fragment key={pairIndex}>
                      <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                        {formatTimeDisplay(pair.inTime)}
                      </td>
                      <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                        {formatTimeDisplay(pair.outTime)}
                      </td>
                    </React.Fragment>
                  );
                })}
                
                <td className="py-3 px-4 font-semibold text-blue-300 whitespace-nowrap">
                  {row.totalHours}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default DutyHoursTable;