const API_BASE = '/api/items';

const ItemApi = {


  // New functions for worker inventory management
  async getInventoryItems() {
    const res = await fetch(`${API_BASE}/inventory`);
    if (!res.ok) throw new Error('Failed to fetch inventory items');
    return await res.json();
  },
  
  async adjustQuantity(itemId, adjustmentData) {
    const res = await fetch(`${API_BASE}/${itemId}/adjust-quantity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adjustmentData),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to adjust quantity');
    }
    
    return await res.json();
  },
  
  async getInventoryLogs(itemId) {
    const res = await fetch(`${API_BASE}/${itemId}/inventory-logs`);
    if (!res.ok) throw new Error('Failed to fetch inventory logs');
    return await res.json();
  },

  // Existing item management functions



  async getAllItems() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch items');
    return await res.json();
  },
  async createItem(itemData) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: itemData,
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to add item');
    return await res.json();
  },
  async updateItem(id, itemData) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: itemData,
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to update item');
    return await res.json();
  },
  async deleteItem(id) {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete item');
    return await res.json();
  }
};

export default ItemApi;
