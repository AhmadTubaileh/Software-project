import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearSession, currentUser } = useLocalSession();
  const navRef = useRef(null);
  
  // Use localStorage to persist expanded sections state - DEFAULT ALL CLOSED
  const [expandedSections, setExpandedSections] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-expanded');
      return saved ? JSON.parse(saved) : {
        'Main': false,
        'Sales': false,
        'Management': false,
        'Personal': false
      };
    }
    return {
      'Main': false,
      'Sales': false,
      'Management': false,
      'Personal': false
    };
  });

  // Save to localStorage whenever expandedSections changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-expanded', JSON.stringify(expandedSections));
    }
  }, [expandedSections]);

  // Save scroll position before navigation
  useEffect(() => {
    const saveScrollPosition = () => {
      if (navRef.current) {
        sessionStorage.setItem('sidebar-scroll-position', navRef.current.scrollTop.toString());
      }
    };

    // Save scroll position when location changes
    saveScrollPosition();
  }, [location.pathname]);

  // Restore scroll position after render
  useEffect(() => {
    const restoreScrollPosition = () => {
      const savedPosition = sessionStorage.getItem('sidebar-scroll-position');
      if (navRef.current && savedPosition) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          navRef.current.scrollTop = parseInt(savedPosition, 10);
        });
      }
    };

    restoreScrollPosition();
  }, [location.pathname]); // Re-run when path changes

  // Grouped menu items
  const menuSections = [
    {
      name: 'Main',
      items: [
        { name: 'Dashboard', path: '/', icon: '📊' }
      ]
    },
    {
      name: 'Sales',
      items: [
        { name: 'POS', path: '/pos', icon: '💳' },
        { name: 'New Contract', path: '/contract-application', icon: '📝' },
        { name: 'Payment Processing', path: '/payment-processing', icon: '💰' }
      ]
    },
    {
      name: 'Management',
      items: [
        { name: 'Employees', path: '/employees', icon: '👨‍💼' },
        { name: 'Items', path: '/items', icon: '📦' },
        { name: 'Manage Contracts', path: '/contract-management', icon: '⚡' },
        { name: 'Task Management', path: '/task-management', icon: '✅' },
        { name: 'Manage Duty Hours', path: '/admin-duty-hours', icon: '👨‍💼' }
      ]
    },
    {
      name: 'Personal',
      items: [
        { name: 'My Tasks', path: '/my-tasks', icon: '📋' },
        { name: 'Time Tracking', path: '/time-tracking', icon: '⏰' },
        { name: 'My Duty Hours', path: '/duty-hours-report', icon: '📊' }
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Function to expand all sections
  const expandAllSections = () => {
    setExpandedSections({
      'Main': true,
      'Sales': true,
      'Management': true,
      'Personal': true
    });
  };

  // Function to collapse all sections
  const collapseAllSections = () => {
    setExpandedSections({
      'Main': false,
      'Sales': false,
      'Management': false,
      'Personal': false
    });
  };

  const handleNavigation = (path) => {
    // Save current state before navigation
    const currentScrollTop = navRef.current?.scrollTop;
    if (currentScrollTop !== undefined) {
      sessionStorage.setItem('sidebar-scroll-position', currentScrollTop.toString());
    }
    
    navigate(path);
  };

  const handleLogout = () => {
    // Clear scroll position on logout
    sessionStorage.removeItem('sidebar-scroll-position');
    clearSession();
    if (window.toast) {
      window.toast.success('Logged out successfully!');
    }
    navigate('/');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Section icons and colors
  const sectionIcons = {
    'Main': '🏠',
    'Sales': '💰',
    'Management': '⚙️',
    'Personal': '👤'
  };

  const sectionColors = {
    'Main': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    'Sales': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    'Management': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    'Personal': 'from-orange-500/20 to-amber-500/20 border-orange-500/30'
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col fixed top-0 left-0 h-screen z-50 border-r border-gray-700/50 shadow-2xl">
      {/* Header */}
      <div className="p-6 pb-4 flex-shrink-0">
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
      <div className="px-6 pb-4 flex-shrink-0">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
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
      </div>

      {/* Quick Actions */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex gap-1">
          <button
            onClick={expandAllSections}
            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors duration-200"
            title="Expand All Sections"
          >
            📂 All
          </button>
          <button
            onClick={collapseAllSections}
            className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium transition-colors duration-200"
            title="Collapse All Sections"
          >
            📁 Close
          </button>
        </div>
      </div>

      {/* Navigation - Scrollable Area with ref */}
      <nav 
        ref={navRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-4"
        style={{ scrollBehavior: 'auto' }}
      >
        {menuSections.map((section) => (
          <div key={section.name} className="space-y-2">
            {/* Section Header - Clickable */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSection(section.name);
              }}
              className={`w-full px-3 py-2 rounded-lg bg-gradient-to-r ${sectionColors[section.name]} border backdrop-blur-sm transition-all duration-200 hover:brightness-110 flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{sectionIcons[section.name]}</span>
                <span className="font-semibold text-white text-sm tracking-wide">
                  {section.name}
                </span>
                <span className="bg-black/30 text-xs px-1.5 py-0.5 rounded-full">
                  {section.items.length}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-white transition-transform duration-200 ${
                  expandedSections[section.name] ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Section Items - Animated */}
            <div className={`space-y-1 transition-all duration-300 overflow-hidden ${
              expandedSections[section.name] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              {section.items.map((item) => (
                <button
                  key={item.name}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNavigation(item.path);
                  }}
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
                        <span className={`font-medium transition-colors duration-200 text-sm ${
                          isActive(item.path) ? 'text-white' : 'text-gray-300 group-hover:text-white'
                        }`}>
                          {item.name}
                        </span>
                      </div>
                    </div>
                    {isActive(item.path) && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-gray-700/50 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
        >
          <div className="text-xl group-hover:scale-110 transition-transform duration-200">
            🚪
          </div>
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Custom Scrollbar Styling */}
      <style jsx>{`
        nav::-webkit-scrollbar {
          width: 4px;
        }
        nav::-webkit-scrollbar-track {
          background: rgba(75, 85, 99, 0.3);
          border-radius: 10px;
        }
        nav::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.5);
          border-radius: 10px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 0.7);
        }
      `}</style>
    </aside>
  );
}

export default AdminSidebar;