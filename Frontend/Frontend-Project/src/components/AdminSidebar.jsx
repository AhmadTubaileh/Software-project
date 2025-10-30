import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearSession, currentUser } = useLocalSession();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    // { name: 'Admin', path: '/admin', icon: '👑' },
    { name: 'POS', path: '/pos', icon: '💳' },
    // { name: 'Products', path: '/products', icon: '📦' },
    // { name: 'Orders', path: '/orders', icon: '🛒' },
    // { name: 'Customers', path: '/customers', icon: '👥' },
    { name: 'Employees', path: '/employees', icon: '👨‍💼' },
    { name: 'Items', path: '/items', icon: '📦' },
    // { name: 'Reports', path: '/reports', icon: '📈' },
    // { name: 'Settings', path: '/settings', icon: '⚙️' },
    // { name: 'Service Tickets', path: '/tickets', icon: '🎫' },
    // { name: 'Users & Roles', path: '/users', icon: '👤' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 flex flex-col fixed top-0 left-0 h-screen z-50 border-r border-gray-700/50 shadow-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            🛍️
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              ShopAdmin Pro
            </h1>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
            {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">
              {currentUser?.username || 'User'}
            </h3>
            <p className="text-xs text-gray-400 capitalize">
              {currentUser?.role || 'Customer'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Vertical Arrangement */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`w-full text-left p-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                : 'hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                isActive(item.path) ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'
              }`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium transition-colors duration-200 ${
                    isActive(item.path) ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>
                    {item.name}
                  </span>
                </div>
              </div>
              {isActive(item.path) && (
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              )}
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-gray-700/50">
        <button
          onClick={clearSession}
          className="w-full flex items-center gap-3 p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
        >
          <div className="text-xl group-hover:scale-110 transition-transform duration-200">
            🚪
          </div>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;