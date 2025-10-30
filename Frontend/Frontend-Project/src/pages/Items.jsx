import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSession } from '../hooks/useLocalSession.js';
import AdminSidebar from '../components/AdminSidebar.jsx';
import ItemHeader from '../components/items/ItemHeader.jsx';
import ItemCard from '../components/items/ItemCard.jsx';
import ItemForm from '../components/items/ItemForm.jsx';
import ImageModal from '../components/items/ImageModal.jsx';
import EmptyState from '../components/items/EmptyState.jsx';
import toast, { Toaster } from 'react-hot-toast';

function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableFilter, setAvailableFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const { currentUser } = useLocalSession();

  // Access control
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'employee')) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need admin or employee privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Fetch items from backend
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/items');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
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

  // Filter items based on search and availability
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAvailability = availableFilter === 'all' || 
                               String(item.available) === availableFilter;
    
    return matchesSearch && matchesAvailability;
  });

  // Handle add new item
  const handleAddItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  // Handle edit item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // Handle delete item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Item deleted successfully');
        setItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  // Handle viewing item image
  const handleViewImage = (item) => {
    setViewingImage(item);
  };

  // Handle closing image modal
  const handleCloseImageModal = () => {
    setViewingImage(null);
  };

  // Handle form submission (both add and edit)
  const handleFormSubmit = async (formData) => {
    try {
      const url = editingItem 
        ? `http://localhost:5000/api/items/${editingItem.id}`
        : 'http://localhost:5000/api/items';
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        toast.success(editingItem ? 'Item updated successfully' : 'Item added successfully');
        setShowForm(false);
        setEditingItem(null);
        await fetchItems();
      } else {
        throw new Error(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Failed to save item');
      throw error;
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle availability filter change
  const handleAvailableFilterChange = (e) => {
    setAvailableFilter(e.target.value);
  };

  // Get full image source for modal
  const getFullImageSrc = (item) => {
    if (item.item_image) {
      return `data:image/jpeg;base64,${item.item_image}`;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {/* Header and Search/Filters */}
          <ItemHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onAddItem={handleAddItem}
            availableFilter={availableFilter}
            onAvailableFilterChange={handleAvailableFilterChange}
          />

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading items...</p>
            </div>
          )}

          {/* Item Form Modal */}
          <ItemForm
            isOpen={showForm || editingItem}  // ✅ FIXED: editingItem instead of editingEmployee
            item={editingItem}
            onSubmit={handleFormSubmit}  // ✅ FIXED: Use existing function
            onCancel={handleFormCancel}  // ✅ FIXED: Use existing function
          />

          {/* Image View Modal */}
          {viewingImage && (
            <ImageModal
              isOpen={!!viewingImage}
              imageSrc={getFullImageSrc(viewingImage)}
              item={viewingImage}
              onClose={handleCloseImageModal}
            />
          )}

          {/* Items Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onViewImage={handleViewImage}
                />
              ))}
            </div>
          )}

          {/* Empty State - No results after filtering */}
          {!loading && filteredItems.length === 0 && items.length > 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg">No items match your filters</p>
              <button
                onClick={() => {
                  setAvailableFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Show all items
              </button>
            </div>
          )}

          {/* Empty State - No items at all */}
          {!loading && items.length === 0 && (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}

export default Items;