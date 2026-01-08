// components/POS/Header.jsx
import React from 'react';

const Header = ({ currentUser, items, isItemAvailable }) => {
  const availableItems = items.filter(item => isItemAvailable(item)).length;
  const saleItems = items.filter(item => 
    item.on_sale_price && 
    item.on_sale_price < item.price_cash && 
    isItemAvailable(item)
  ).length;

  return (
    <header className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Point of Sale System
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-gray-400 text-sm">
                Welcome, <span className="text-white font-semibold">{currentUser?.username || 'User'}</span>
              </p>
            </div>
            <span className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
              {currentUser?.role?.toUpperCase() || 'GUEST'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700 min-w-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Available</p>
                <p className="text-2xl font-bold text-green-400">{availableItems}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <span className="text-green-400 text-xl">✓</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700 min-w-[140px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">On Sale</p>
                <p className="text-2xl font-bold text-orange-400">{saleItems}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <span className="text-orange-400 text-xl">🔥</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Products</p>
            <p className="text-xl font-bold text-white">{items.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Out of Stock</p>
            <p className="text-xl font-bold text-red-400">{items.length - availableItems}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Installment Available</p>
            <p className="text-xl font-bold text-blue-400">
              {items.filter(item => item.installment === 1).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">With Images</p>
            <p className="text-xl font-bold text-purple-400">
              {items.filter(item => item.item_image).length}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;