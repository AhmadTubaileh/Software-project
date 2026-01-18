import React, { useState } from 'react';

const SearchByWorkerTime = ({ workers, onSearch, loading }) => {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedWorker || !startDate || !endDate) {
      return;
    }
    
    // Convert dates to ISO format
    const start = new Date(startDate).toISOString().slice(0, 19).replace('T', ' ');
    const end = new Date(endDate).toISOString().slice(0, 19).replace('T', ' ');
    
    onSearch(selectedWorker, start, end);
  };

  // Quick date range presets
  const setDateRange = (preset) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last24':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        const dayOfWeek = now.getDay();
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().slice(0, 16));
    setEndDate(end.toISOString().slice(0, 16));
  };

  // Set default dates (last 7 days with time)
  React.useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0); // Start of day
    
    today.setHours(23, 59, 59, 999); // End of day
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    setStartDate(lastWeek.toISOString().slice(0, 16));
    setEndDate(today.toISOString().slice(0, 16));
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>👨‍💼</span>
        Search by Worker & Time
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Select Worker
          </label>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 cursor-pointer"
            required
          >
            <option value="">Choose a worker...</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id} className="bg-gray-800">
                {worker.username} (Type: {worker.user_type})
              </option>
            ))}
          </select>
        </div>
        
        {/* Quick Date Presets */}
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Quick Date Ranges:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-blue-600 rounded-md transition-colors duration-200"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateRange('last24')}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-blue-600 rounded-md transition-colors duration-200"
            >
              Last 24h
            </button>
            <button
              type="button"
              onClick={() => setDateRange('last7')}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-blue-600 rounded-md transition-colors duration-200"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('thisWeek')}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-blue-600 rounded-md transition-colors duration-200"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setDateRange('thisMonth')}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-blue-600 rounded-md transition-colors duration-200"
            >
              This Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !selectedWorker || !startDate || !endDate}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
            loading || !selectedWorker || !startDate || !endDate
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Searching...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🔍 Search Sales
            </span>
          )}
        </button>
      </form>
      
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Instructions:</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Select worker and specific time period (date & time)</li>
          <li>• Shows only cash sales within that time range</li>
          <li>• Click on a sale to see all records</li>
          <li>• Then select cash record to process return</li>
        </ul>
      </div>
    </div>
  );
};

// Make sure this export is at the bottom
export default SearchByWorkerTime;