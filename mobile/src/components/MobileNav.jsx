import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLocalSession } from '../hooks/useLocalSession.js';
import './MobileNav.css';

function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, clearSession } = useLocalSession();

  // Check if user has admin/manager access (user_type: 0, 1, 2)
  const userType = currentUser?.user_type ?? 5;
  const allowedRoles = [0, 1, 2];
  const isAdmin = allowedRoles.includes(userType);
  
  // Contract management access: Admin, Senior Manager, Manager, Supervisor, Employee (0-4)
  const canAccessContracts = userType >= 0 && userType <= 4;

  const navItems = [
    { path: '/my-tasks', icon: '📋', label: 'Tasks' },
    { path: '/time-tracking', icon: '⏰', label: 'Time' },
    { path: '/my-duty-hours', icon: '📊', label: 'Hours' },
    { path: '/project-management', icon: '📁', label: 'Projects' },
    // Contract management for authorized users (0-4)
    ...(canAccessContracts ? [{ path: '/contract-management', icon: '📝', label: 'Contracts' }] : []),
    // Admin-only navigation item
    ...(isAdmin ? [{ path: '/admin-duty-hours', icon: '👔', label: 'Admin' }] : []),
  ];

  const handleLogout = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || 
                        (item.path === '/project-management' && location.pathname.startsWith('/project/'));
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
      
      {/* Logout button - shown as last item */}
      <button
        onClick={handleLogout}
        className="mobile-nav-item mobile-nav-logout"
        title="Logout"
      >
        <span className="mobile-nav-icon">🚪</span>
        <span className="mobile-nav-label">Logout</span>
      </button>
    </nav>
  );
}

export default MobileNav;

