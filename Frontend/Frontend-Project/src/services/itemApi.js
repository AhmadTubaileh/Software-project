const API_BASE = '/api/items';

const ItemApi = {
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
