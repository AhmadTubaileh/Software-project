import React from 'react';
import WorkerDropdown from './WorkerDropdown.jsx';

const AddTaskModal = ({ newTask, setNewTask, workers, currentUser, onSubmit, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newTask.assigned_to || !newTask.task.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    const taskData = {
      assigned_by: currentUser.id,
      assigned_to: parseInt(newTask.assigned_to),
      task: newTask.task.trim()
    };

    onSubmit(taskData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700/50">
        <h2 className="text-xl font-bold mb-4">Assign New Task</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <WorkerDropdown
              value={newTask.assigned_to}
              onChange={(e) => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
              workers={workers}
              label="Assign To"
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Task Description
              </label>
              <textarea
                value={newTask.task}
                onChange={(e) => setNewTask(prev => ({ ...prev, task: e.target.value }))}
                rows="4"
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Describe the task in detail..."
                required
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;