const API_BASE = 'http://localhost:5000/api/store';

class StoreApi {
  static async getItems(branchId = null) {
    try {
      let url = `${API_BASE}/items`;
      if (branchId) {
        url += `?branch_id=${branchId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch store items');
      }
      
      return data.items || [];
    } catch (error) {
      console.error('Error fetching store items:', error);
      throw error;
    }
  }

  static async getItemById(id) {
    try {
      const response = await fetch(`${API_BASE}/items/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch store item');
      }
      
      return data.item || null;
    } catch (error) {
      console.error('Error fetching store item:', error);
      throw error;
    }
  }
}

export default StoreApi;
