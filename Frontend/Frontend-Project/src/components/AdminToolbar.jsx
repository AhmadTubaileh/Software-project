import React from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminToolbar() {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Admin', path: '/admin', icon: '👑' },
    { name: 'POS', path: '/pos', icon: '💳' },
    { name: 'Products', path: '/products', icon: '📦' },
    { name: 'Orders', path: '/orders', icon: '🛒' },
    { name: 'Customers', path: '/customers', icon: '👥' },
    { name: 'Employees', path: '/employees', icon: '👨‍💼' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
    { name: 'Service Tickets', path: '/tickets', icon: '🎫' },
    { name: 'Users & Roles', path: '/users', icon: '👤' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <section
      className="admin-toolbar flex flex-wrap gap-3 my-4"
      aria-label="Admin actions"
    >
      {menuItems.map((item) => (
        <button
          key={item.name}
          className={`chip px-4 py-3 rounded-xl border text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 flex items-center gap-2 ${
            item.name === 'Admin' 
              ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 hover:shadow-yellow-500/20' 
              : 'border-blue-500/35 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 hover:shadow-blue-500/20'
          }`}
          onClick={() => handleNavigation(item.path)}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="font-medium">{item.name}</span>
        </button>
      ))}
    </section>
  );
}

export default AdminToolbar;