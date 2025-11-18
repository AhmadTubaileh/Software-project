import React from 'react';

const Header = ({ currentUser, items, isItemAvailable }) => {
  return (
    <header className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-blue-400">Point of Sale</h1>
        <p className="text-gray-400 text-sm mt-1">
          Welcome, {currentUser?.username || 'User'} • {currentUser?.role || 'Guest'}
        </p>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold text-green-400">
          Available Items: {items.filter(item => isItemAvailable(item)).length}
        </div>
        <div className="text-sm text-gray-400">
          Total Products: {items.length}
        </div>
      </div>
    </header>
  );
};

export default Header;