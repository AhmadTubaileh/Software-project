import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import InventoryItemCard from '../components/inventory/InventoryItemCard.jsx';
import InventoryLogModal from '../components/inventory/InventoryLogModal.jsx';
import toast, { Toaster } from 'react-hot-toast';

function WorkerInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedItemLogs, setSelectedItemLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { currentUser } = useLocalSession();

  // ========== ACCESS CONTROL START ==========
  // Get user_type from currentUser
  const userType = currentUser?.user_type ?? 5;
  
  // Admin (0), Senior Manager (1), Manager (2), Supervisor (3), Employee (4) can access
  // Trainee (5) cannot access
  const allowedRoles = [0, 1, 2, 3, 4]; // All except Trainee (5)
  
  if (!allowedRoles.includes(userType)) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        <AdminSidebar />
        <div className="ml-64 min-h-screen flex items-center justify-center">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-4">
                Your account ({getRoleName(userType)}) does not have permission to access this page.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Inventory Management is accessible to all staff except Trainees.
                Trainees cannot manage inventory.
              </p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ========== ACCESS CONTROL END ==========

  // Fetch items for inventory management
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/items/inventory');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      toast.error('Failed to load items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load items on component mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter items based on search
  const filteredItems = items.filter(item => {
    return item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle quick add (add 1)
  const handleQuickAdd = async (item) => {
    try {
      const response = await fetch(`http://localhost:5000/api/items/${item.id}/adjust-quantity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerId: currentUser.id,
          changeType: 'add',
          quantity: 1
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add stock');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Added 1 item to stock');
        // Update local state
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ));
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error(error.message || 'Failed to add stock');
    }
  };

  // Handle quick remove (remove 1)
  const handleQuickRemove = async (item) => {
    if (item.quantity <= 0) {
      toast.error('Cannot remove from empty stock');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/items/${item.id}/adjust-quantity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerId: currentUser.id,
          changeType: 'remove',
          quantity: 1
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to remove stock');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Removed 1 item from stock');
        // Update local state
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
        ));
      }
    } catch (error) {
      console.error('Error removing stock:', error);
      toast.error(error.message || 'Failed to remove stock');
    }
  };

  // Open adjustment modal
  const handleAdjustClick = (item, type) => {
    setAdjustingItem(item);
    setAdjustmentType(type);
    setAdjustmentQuantity(1);
  };

  // Handle custom quantity adjustment
  const handleCustomAdjust = async () => {
    if (!adjustingItem || adjustmentQuantity <= 0) {
      toast.error('Invalid quantity');
      return;
    }

    if (adjustmentType === 'remove' && adjustingItem.quantity < adjustmentQuantity) {
      toast.error(`Cannot remove ${adjustmentQuantity} items. Only ${adjustingItem.quantity} available.`);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/items/${adjustingItem.id}/adjust-quantity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerId: currentUser.id,
          changeType: adjustmentType,
          quantity: adjustmentQuantity
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to adjust stock');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        // Update local state
        setItems(prev => prev.map(i => 
          i.id === adjustingItem.id ? { 
            ...i, 
            quantity: adjustmentType === 'add' 
              ? i.quantity + adjustmentQuantity 
              : i.quantity - adjustmentQuantity 
          } : i
        ));
        setAdjustingItem(null);
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error(error.message || 'Failed to adjust stock');
    }
  };

  // Handle viewing inventory logs
  const handleViewLogs = async (item) => {
    try {
      setLoadingLogs(true);
      const response = await fetch(`http://localhost:5000/api/items/${item.id}/inventory-logs`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const logs = await response.json();
      setSelectedItemLogs(logs);
      setShowLogsModal(true);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load inventory logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Get worker name
  const getWorkerName = () => {
    return currentUser?.username || `Worker #${currentUser?.id}`;
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchItems();
    toast.success('Inventory refreshed');
  };

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header and Search */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  Inventory Management
                </h1>
                <p className="text-gray-400">Adjust item quantities and track changes</p>
                <p className="text-gray-500 text-sm mt-1">
                  Logged in as: {currentUser?.username} ({getRoleName(userType)})
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    Total Items: <span className="text-white font-bold">{items.length}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Total Stock: <span className="text-white font-bold">
                      {items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>↻</span> Refresh
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search items by name or description..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pl-12"
                />
                <div className="absolute left-4 top-3.5 text-gray-400">
                  🔍
                </div>
              </div>
              
              {/* Legend */}
              <div className="hidden lg:flex items-center gap-4 px-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">In Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Low Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">Out of Stock</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading inventory...</p>
            </div>
          )}

          {/* Adjustment Modal */}
          {adjustingItem && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">
                    {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                  </h2>
                  <button
                    onClick={() => setAdjustingItem(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    &times;
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-300 mb-2">Item: <span className="font-bold">{adjustingItem.name}</span></p>
                  <p className="text-gray-400 mb-4">Current Stock: <span className="font-bold">{adjustingItem.quantity}</span></p>
                  
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity to {adjustmentType === 'add' ? 'Add' : 'Remove'}
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setAdjustmentQuantity(prev => Math.max(1, prev - 1))}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center"
                    />
                    <button
                      onClick={() => setAdjustmentQuantity(prev => prev + 1)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                    >
                      +
                    </button>
                  </div>
                  
                  {adjustmentType === 'remove' && adjustingItem.quantity < adjustmentQuantity && (
                    <p className="text-red-400 text-sm mt-2">
                      Warning: Only {adjustingItem.quantity} items available
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setAdjustingItem(null)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomAdjust}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      adjustmentType === 'add' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Logs Modal */}
          <InventoryLogModal
            isOpen={showLogsModal}
            logs={selectedItemLogs}
            loading={loadingLogs}
            onClose={() => {
              setShowLogsModal(false);
              setSelectedItemLogs([]);
            }}
          />

          {/* Items Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  onQuickAdd={handleQuickAdd}
                  onQuickRemove={handleQuickRemove}
                  onAdjustClick={handleAdjustClick}
                  onViewLogs={handleViewLogs}
                  currentWorkerId={currentUser.id}
                />
              ))}
            </div>
          )}

          {/* Empty State - No results after filtering */}
          {!loading && filteredItems.length === 0 && items.length > 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg">No items match your search</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Empty State - No items at all */}
          {!loading && items.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg">No items found in inventory</p>
              <p className="text-sm">Add items through the admin panel first</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper function to get role name
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

export default WorkerInventory;