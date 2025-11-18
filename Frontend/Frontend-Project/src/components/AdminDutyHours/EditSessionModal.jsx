import React from 'react';

const EditSessionModal = ({ session, onUpdate, onClose }) => {
  const [editingSession, setEditingSession] = React.useState(session);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(editingSession);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700/50">
        <h2 className="text-xl font-bold mb-4">Edit Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Session Type</label>
              <select
                value={editingSession.session_type}
                onChange={(e) => setEditingSession(prev => ({ ...prev, session_type: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="work">Work</option>
                <option value="break">Break</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={editingSession.date}
                onChange={(e) => setEditingSession(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">In Time</label>
              <input
                type="datetime-local"
                value={editingSession.in_time ? editingSession.in_time.slice(0, 16) : ''}
                onChange={(e) => setEditingSession(prev => ({ ...prev, in_time: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Out Time</label>
              <input
                type="datetime-local"
                value={editingSession.out_time ? editingSession.out_time.slice(0, 16) : ''}
                onChange={(e) => setEditingSession(prev => ({ ...prev, out_time: e.target.value || null }))}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={editingSession.notes || ''}
              onChange={(e) => setEditingSession(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200">Cancel</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105">Update Session</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSessionModal;