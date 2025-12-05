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

  // Set default dates (last 7 days)
  React.useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    setStartDate(lastWeek.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              End Date
            </label>
            <input
              type="date"
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
          <li>• Select worker and time period</li>
          <li>• Shows only cash sales in that period</li>
          <li>• Click on a sale to see all records</li>
          <li>• Then select cash record to process return</li>
        </ul>
      </div>
    </div>
  );
};

// Make sure this export is at the bottom
export default SearchByWorkerTime;