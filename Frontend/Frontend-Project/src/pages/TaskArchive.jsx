import React, { useState, useEffect } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import toast, { Toaster } from 'react-hot-toast';

function TaskArchive() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedTasks, setExpandedTasks] = useState({}); // Track which tasks show files
  const { currentUser } = useLocalSession();

  useEffect(() => {
    fetchArchivedTasks();
  }, []);

  const fetchArchivedTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks/archive');
      const data = await response.json();
      
      if (response.ok) {
        setTasks(data);
      } else {
        toast.error('Failed to load archived tasks');
      }
    } catch (error) {
      console.error('Error fetching archived tasks:', error);
      toast.error('Error loading archived tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch files for a specific task
  const fetchTaskFiles = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/files`);
      if (response.ok) {
        const files = await response.json();
        return files;
      }
      return [];
    } catch (error) {
      console.error('Error fetching task files:', error);
      return [];
    }
  };

  // Toggle file display for a task
  const toggleTaskFiles = async (taskId) => {
    // If already expanded, collapse it
    if (expandedTasks[taskId]) {
      setExpandedTasks(prev => ({
        ...prev,
        [taskId]: null
      }));
      return;
    }

    // If not expanded, fetch files and expand
    const files = await fetchTaskFiles(taskId);
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: files
    }));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'deleted') return task.is_deleted === 1;
    return true;
  });

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons = {
      pdf: '📕',
      doc: '📘',
      docx: '📘',
      xls: '📗',
      xlsx: '📗',
      txt: '📄',
      csv: '📊',
      zip: '📦',
      rar: '📦',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      webp: '🖼️',
      svg: '🖼️'
    };
    return icons[ext] || '📄';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        <Toaster position="top-center" />
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}
        <main className={`flex-1 min-h-screen transition-all duration-300 ${
          currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
        }`}>
          <div className="p-6 flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') && <AdminSidebar />}

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${
        currentUser && (currentUser.role === 'admin' || currentUser.role === 'employee') ? 'ml-64' : ''
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              Task Archive & History
            </h1>
            <p className="text-gray-400">View completed and deleted tasks across all projects</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6 p-1 bg-gray-800/30 rounded-2xl border border-gray-700/50 w-fit">
            {[
              { value: 'all', label: 'All Tasks', emoji: '📋' },
              { value: 'completed', label: 'Completed', emoji: '✅' },
              { value: 'deleted', label: 'Deleted', emoji: '🗑️' }
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  filter === filterOption.value
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'hover:bg-gray-700/50 border border-transparent'
                }`}
              >
                <span className="text-lg">{filterOption.emoji}</span>
                <div className="text-left">
                  <div className="font-medium text-sm">{filterOption.label}</div>
                  <div className={`text-xs ${
                    filter === filterOption.value ? 'text-blue-300' : 'text-gray-400'
                  }`}>
                    {tasks.filter(task => 
                      filterOption.value === 'all' ? true :
                      filterOption.value === 'completed' ? task.status === 'completed' :
                      task.is_deleted === 1
                    ).length} tasks
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Tasks Grid */}
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-gray-800/30 rounded-2xl p-6 border transition-all duration-300 ${
                  task.is_deleted 
                    ? 'border-red-500/30 bg-red-500/10' 
                    : task.status === 'completed'
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-gray-700/50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {task.is_deleted ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium border border-red-500/30 bg-red-500/20 text-red-300">
                          DELETED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium border border-green-500/30 bg-green-500/20 text-green-300">
                          COMPLETED
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                        task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        task.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {task.priority}
                      </span>
                      {task.project_title && (
                        <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-300">
                          {task.project_title}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {task.task}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                        <span className="text-gray-400">👤</span>
                        <span className="text-gray-300">Assigned to <span className="font-medium text-white">{task.assigned_to_name}</span></span>
                      </div>
                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                        <span className="text-gray-400">👤</span>
                        <span className="text-gray-300">By <span className="font-medium text-white">{task.assigned_by_name}</span></span>
                      </div>
                      {task.estimated_time_minutes && (
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                          <span className="text-gray-400">⏱️</span>
                          <span className="text-gray-300">Est: {formatTime(task.estimated_time_minutes)}</span>
                        </div>
                      )}
                      {task.actual_time_minutes && (
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
                          <span className="text-gray-400">⏰</span>
                          <span className="text-gray-300">Actual: {formatTime(task.actual_time_minutes)}</span>
                        </div>
                      )}
                    </div>

                    {/* Files Section for Completed Tasks */}
                    {task.status === 'completed' && (
                      <div className="mt-4">
                        <button
                          onClick={() => toggleTaskFiles(task.id)}
                          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
                        >
                          <span>📎</span>
                          <span className="text-sm">
                            {expandedTasks[task.id] ? 'Hide Files' : 'Show Files'}
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              expandedTasks[task.id] ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Files List */}
                        {expandedTasks[task.id] && (
                          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                            {expandedTasks[task.id].length === 0 ? (
                              <div className="text-center py-4 text-gray-500">
                                <div className="text-2xl mb-2">📎</div>
                                <p className="text-sm">No files attached to this task</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                  <span>📎</span>
                                  <span>Attached Files ({expandedTasks[task.id].length})</span>
                                </div>
                                {expandedTasks[task.id].map((file) => (
                                  <div
                                    key={file.id}
                                    className="flex items-center justify-between p-3 bg-gray-600/20 rounded-lg border border-gray-500/30 hover:border-gray-400/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="text-2xl">
                                        {getFileIcon(file.file_name)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-medium truncate" title={file.file_name}>
                                          {file.file_name}
                                        </div>
                                        <div className="text-gray-400 text-xs flex flex-wrap gap-2 mt-1">
                                          <span>By {file.uploaded_by_name}</span>
                                          <span>•</span>
                                          <span>{formatFileSize(file.file_size)}</span>
                                          <span>•</span>
                                          <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <a
                                      href={`http://localhost:5000${file.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-4 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition-colors whitespace-nowrap"
                                    >
                                      Download
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completion/Deletion Info */}
                    <div className="text-xs text-gray-400 mt-4">
                      {task.is_deleted ? (
                        <span>Deleted on: {new Date(task.deleted_at).toLocaleString()}</span>
                      ) : task.approved_at ? (
                        <span>Completed on: {new Date(task.approved_at).toLocaleString()}</span>
                      ) : (
                        <span>Created on: {new Date(task.created_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">No archived tasks</h3>
                <p>Completed and deleted tasks will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TaskArchive;