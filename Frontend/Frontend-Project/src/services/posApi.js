const API_BASE = 'http://localhost:5000/api/pos';

class PosApi {
  // Get all available items for POS
  static async getItems() {
    try {
      const response = await fetch(`${API_BASE}/items`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch items');
      }
      
      return data.items;
    } catch (error) {
      console.error('Error fetching POS items:', error);
      throw error;
    }
  }

  // Process checkout/sale
  static async checkout(cart, userId) {
    try {
      const response = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: cart.map(item => ({
            id: item.id,
            name: item.name,
            qty: item.qty,
            price_cash: item.price_cash,
            quantity: item.quantity // Current available quantity
          })),
          userId: userId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle insufficient quantities
        if (data.insufficientItems) {
          throw {
            type: 'INSUFFICIENT_QUANTITY',
            items: data.insufficientItems,
            message: data.message
          };
        }
        throw new Error(data.message || 'Checkout failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Checkout failed');
      }

      return data;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }

  // Health check
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
}

export default PosApi;