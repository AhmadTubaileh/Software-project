import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearSession, currentUser } = useLocalSession();
  const navRef = useRef(null);
  const [projects, setProjects] = useState([]);
  
  // Get user_type from currentUser, default to 5 (most restricted) if not available
  const userType = currentUser?.user_type ?? 5;
  
  // Use localStorage to persist expanded sections state
  const [expandedSections, setExpandedSections] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-expanded');
      return saved ? JSON.parse(saved) : {
        'Main': false,
        'Sales': false,
        'Management': false,
        'Projects': false,
        'Personal': false
      };
    }
    return {
      'Main': false,
      'Sales': false,
      'Management': false,
      'Projects': false,
      'Personal': false
    };
  });

  // Fetch user's projects (only if user has access)
  useEffect(() => {
    if (currentUser?.id && canSeeProjects()) {
      fetchUserProjects();
    }
  }, [currentUser]);

  const fetchUserProjects = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/user/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Save to localStorage whenever expandedSections changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-expanded', JSON.stringify(expandedSections));
    }
  }, [expandedSections]);

  // Function to check if user can see a specific menu item
  const canSeeItem = (itemName, sectionName) => {
    // Special case: Branches is ADMIN ONLY (user_type = 0)
    if (itemName === 'Branches') {
      return userType === 0; // Only admin can see Branches
    }
    
    // Admin, Senior Manager, Manager can see everything (except Branches which is admin-only)
    if (userType === 0) {
      return true; // Admin can see everything including Branches
    } else if (userType === 1 || userType === 2) {
      // Senior Manager and Manager can see everything except Branches
      const adminOnlyItems = ['Branches'];
      return !adminOnlyItems.includes(itemName);
    }
    
    // Supervisor (3) restrictions
    if (userType === 3) {
      const restrictedItems = [
        'Employees', 
        'Items', 
        'Project Management', 
        'Task Archive', 
        'Manage Duty Hours',
        'Branches' // Supervisor cannot see Branches
      ];
      return !restrictedItems.includes(itemName);
    }
    
    // Employee (4) restrictions (includes Supervisor restrictions + more)
    if (userType === 4) {
      const restrictedItems = [
        'Employees', 
        'Items', 
        'Project Management', 
        'Task Archive', 
        'Manage Duty Hours',
        'Returns',
        'Overdue Payments',
        'Branches' // Employee cannot see Branches
      ];
      return !restrictedItems.includes(itemName);
    }
    
    // Trainee (5) - Updated permissions
    if (userType === 5) {
      // Trainee can see:
      // 1. Online Store from Main section
      // 2. POS from Sales section
      // 3. My Tasks from Projects section
      // 4. All items from Personal section
      
      const allowedItems = [
        // Main section
        'Online Store',
        
        // Sales section
        'POS',
        
        // Projects section
        'My Tasks',
        
        // Personal section
        'Time Tracking',
        'My Duty Hours'
      ];
      
      return allowedItems.includes(itemName);
    }
    
    return false;
  };

  // Function to check if user can see a specific section
  const canSeeSection = (sectionName) => {
    // Trainee (5) can only see specific sections
    if (userType === 5) {
      const allowedSections = [
        'Main',
        'Sales',
        'Projects',
        'Personal'
      ];
      return allowedSections.includes(sectionName);
    }
    
    // Everyone else can see all sections (items will be filtered separately)
    return true;
  };

  // Function to check if user can see Projects section
  const canSeeProjects = () => {
    // Everyone except restricted users can see projects
    if (userType >= 0 && userType <= 5) return true;
    return false;
  };

  // Filtered menu sections based on user_type
  const menuSections = [
    {
      name: 'Main',
      items: [
        { name: 'Online Store', path: '/', icon: '💰' }
      ].filter(item => canSeeItem(item.name, 'Main'))
    },
    {
      name: 'Sales',
      items: [
        { name: 'POS', path: '/pos', icon: '💳' },
        { name: 'New Contract', path: '/contract-application', icon: '📝' },
        { name: 'Payment Processing', path: '/payment-processing', icon: '💰' },
        { name: 'Returns', path: '/returns', icon: '↩️' }
      ].filter(item => canSeeItem(item.name, 'Sales'))
    },
    {
      name: 'Installment Management',
      items: [
        { name: 'Manage Contracts', path: '/contract-management', icon: '⚡' },
        { name: 'Overdue Payments', path: '/overdue-payments', icon: '⏰' },
      ].filter(item => canSeeItem(item.name, 'Installment Management'))
    },
    {
      name: 'Managerial',
      items: [
        { name: 'Manage Stock', path: '/worker-inventory', icon: '📦' },
        { name: 'Employees', path: '/employees', icon: '👨‍💼' },
        { name: 'Branches', path: '/branches', icon: '🏢' }, // NEW: Added Branches
        { name: 'Items', path: '/items', icon: '📦' },
        { name: 'Project Management', path: '/project-management', icon: '🏗️' },
        { name: 'Task Archive', path: '/task-archive', icon: '📚' },
        { name: 'Manage Duty Hours', path: '/admin-duty-hours', icon: '👨‍💼' }
      ].filter(item => canSeeItem(item.name, 'Managerial'))
    },
    {
      name: 'Projects',
      items: [
        { name: 'My Tasks', path: '/my-tasks', icon: '📋' }
      ].filter(item => canSeeItem(item.name, 'Projects'))
    },
    {
      name: 'Personal',
      items: [
        { name: 'Time Tracking', path: '/time-tracking', icon: '⏰' },
        { name: 'My Duty Hours', path: '/duty-hours-report', icon: '📊' }
      ].filter(item => canSeeItem(item.name, 'Personal'))
    }
  ]
  .filter(section => {
    // First check if user can see this section at all
    if (!canSeeSection(section.name)) return false;
    
    // Remove sections that have no items after filtering
    if (section.items.length === 0) return false;
    
    // Special case for Projects section
    if (section.name === 'Projects' && !canSeeProjects()) return false;
    
    return true;
  });

  const isActive = (path) => location.pathname === path;

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Function to expand all sections
  const expandAllSections = () => {
    const newExpandedState = {};
    menuSections.forEach(section => {
      newExpandedState[section.name] = true;
    });
    setExpandedSections(newExpandedState);
  };

  // Function to collapse all sections
  const collapseAllSections = () => {
    const newExpandedState = {};
    menuSections.forEach(section => {
      newExpandedState[section.name] = false;
    });
    setExpandedSections(newExpandedState);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    clearSession();
    if (window.toast) {
      window.toast.success('Logged out successfully!');
    }
    navigate('/');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Section icons and colors - Add Managerial section if not present
  const sectionIcons = {
    'Main': '🏠',
    'Sales': '💰',
    'Installment Management': '📊',
    'Managerial': '⚙️',
    'Projects': '🏗️',
    'Personal': '👤'
  };

  const sectionColors = {
    'Main': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    'Sales': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    'Installment Management': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    'Managerial': 'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
    'Projects': 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    'Personal': 'from-orange-500/20 to-amber-500/20 border-orange-500/30'
  };

  // Don't render sidebar if trainee has no accessible items
  if (menuSections.length === 0) {
    return (
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col fixed top-0 left-0 h-screen z-50 border-r border-gray-700/50 shadow-2xl">
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
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <p className="text-gray-400">No menu access for your role</p>
            <p className="text-sm text-gray-500 mt-2">Contact administrator</p>
          </div>
        </div>
        
        {/* Footer with logout */}
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
      </aside>
    );
  }

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
                {getRoleName(userType)}
                {currentUser?.user_type !== undefined && ` • Level ${currentUser.user_type}`}
                {userType === 0 && <span className="ml-1 text-amber-400">🔐</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Only show if user has multiple sections */}
      {menuSections.length > 1 && (
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
      )}

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
              className={`w-full px-3 py-2 rounded-lg bg-gradient-to-r ${sectionColors[section.name] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30'} border backdrop-blur-sm transition-all duration-200 hover:brightness-110 flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{sectionIcons[section.name]}</span>
                <span className="font-semibold text-white text-sm tracking-wide">
                  {section.name}
                </span>
                <span className="bg-black/30 text-xs px-1.5 py-0.5 rounded-full">
                  {section.name === 'Projects' ? projects.length : section.items.length}
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
              {/* Static menu items */}
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
                  } ${
                    item.name === 'Branches' && userType === 0 
                      ? 'border-amber-500/30 hover:border-amber-500/50' 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                      isActive(item.path) ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'
                    } ${item.name === 'Branches' ? 'text-amber-400' : ''}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium transition-colors duration-200 text-sm ${
                          isActive(item.path) ? 'text-white' : 'text-gray-300 group-hover:text-white'
                        }`}>
                          {item.name}
                        </span>
                        {item.name === 'Branches' && userType === 0 && (
                          <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded-full">
                            Admin Only
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive(item.path) && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                </button>
              ))}

              {/* Dynamic project links - only for Projects section if user has access and has projects */}
              {section.name === 'Projects' && canSeeProjects() && projects.length > 0 && (
                <>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNavigation(`/project/${project.id}`);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                        isActive(`/project/${project.id}`)
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                          : 'hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                          isActive(`/project/${project.id}`) ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'
                        }`}>
                          📋
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium transition-colors duration-200 text-sm ${
                              isActive(`/project/${project.id}`) ? 'text-white' : 'text-gray-300 group-hover:text-white'
                            }`}>
                              {project.title}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {project.task_count} tasks • {project.member_count} members
                          </div>
                        </div>
                        {isActive(`/project/${project.id}`) && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    </button>
                  ))}
                </>
              )}
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
    </aside>
  );
}

// Helper function to get role name from user_type
function getRoleName(userType) {
  switch(userType) {
    case 0: return 'Administrator';
    case 1: return 'Senior Manager';
    case 2: return 'Manager';
    case 3: return 'Supervisor';
    case 4: return 'Employee';
    case 5: return 'Trainee';
    default: return 'User';
  }
}

export default AdminSidebar;