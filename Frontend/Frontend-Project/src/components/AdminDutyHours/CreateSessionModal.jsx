import React from 'react';

const CreateSessionModal = ({ newSession, setNewSession, workers, onCreate, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(newSession);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700/50">
        <h2 className="text-xl font-bold mb-4">Create New Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Employee *</label>
              <select
                value={newSession.user_id}
                onChange={(e) => setNewSession(prev => ({ ...prev, user_id: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>{worker.username} (Level {worker.user_type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Session Type</label>
              <select
                value={newSession.session_type}
                onChange={(e) => setNewSession(prev => ({ ...prev, session_type: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="work">Work</option>
                <option value="break">Break</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
              <input
                type="date"
                value={newSession.date}
                onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">In Time *</label>
              <input
                type="datetime-local"
                value={newSession.in_time}
                onChange={(e) => setNewSession(prev => ({ ...prev, in_time: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Out Time</label>
              <input
                type="datetime-local"
                value={newSession.out_time}
                onChange={(e) => setNewSession(prev => ({ ...prev, out_time: e.target.value || null }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={newSession.notes}
              onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200">Cancel</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105">Create Session</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;