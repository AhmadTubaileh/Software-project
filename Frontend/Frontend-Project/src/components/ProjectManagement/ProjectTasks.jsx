import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import TaskTimelineBar from './TaskTimelineBar.jsx';
import Pagination from '../DutyHoursReport/Pagination.jsx';

const ProjectTasks = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/project/${projectId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTasks(data);
      } else {
        toast.error('Failed to load tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  // Group tasks by date
  const tableData = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    // Group tasks by date (extract date from start_time or time_started)
    const groupedByDate = tasks.reduce((groups, task) => {
      const timeField = task.time_started || task.start_time;
      if (!timeField) return groups;

      const taskDate = new Date(timeField);
      const dateKey = taskDate.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          tasks: []
        };
      }
      groups[dateKey].tasks.push(task);
      return groups;
    }, {});

    // Convert to array and format dates
    return Object.values(groupedByDate).map(group => {
      const dateObj = new Date(group.date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        date: formattedDate,
        dayName: dayName,
        rawDate: group.date,
        tasks: group.tasks,
        taskCount: group.tasks.length
      };
    }).sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
  }, [tasks]);

  // Calculate pagination
  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const currentData = tableData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Tasks ({tasks.length})</h3>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-600 rounded-lg">
          <div className="text-4xl mb-2">📋</div>
          <p>No tasks yet</p>
          <p className="text-sm">Add tasks to get started with this project</p>
        </div>
      ) : tableData.length === 0 ? (
        <div className="text-center py-8 text-yellow-400 border border-dashed border-yellow-600 rounded-lg">
          <div className="text-4xl mb-2">⚠️</div>
          <p>No tasks with time data</p>
          <p className="text-sm">Tasks need start_time and end_time to appear on timeline</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <div className="mb-4 p-4 bg-blue-500/10 rounded-lg">
            <div className="text-sm text-blue-300">
              Showing {tableData.length} days with tasks • {tasks.length} total tasks
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap">Day</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap min-w-[800px]">24-Hour Timeline</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300 whitespace-nowrap">Tasks Count</th>
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
                    <td className="py-3 px-4 text-gray-300 whitespace-nowrap">{row.date}</td>
                    <td className="py-3 px-4 text-gray-300 whitespace-nowrap">{row.dayName}</td>
                    
                    {/* Timeline Visualization - Shows all tasks for this day */}
                    <td className="py-3 px-4 min-w-0">
                      <TaskTimelineBar tasks={row.tasks} date={row.rawDate} />
                    </td>
                    
                    <td className="py-3 px-4 font-semibold text-blue-300 whitespace-nowrap">
                      {row.taskCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;