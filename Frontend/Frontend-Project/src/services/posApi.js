// services/posApi.js
const API_BASE = 'http://localhost:5000/api/pos';

class PosApi {
  // Get ALL items with latest prices
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
      
      // Process items to add display_price
      const processedItems = data.items.map(item => {
        const displayPrice = item.on_sale_price && item.on_sale_price < item.price_cash 
          ? item.on_sale_price 
          : item.price_cash;
        
        return {
          ...item,
          display_price: displayPrice
        };
      });
      
      return processedItems;
    } catch (error) {
      console.error('Error fetching POS items:', error);
      throw error;
    }
  }

  // services/posApi.js - Update the checkout function:
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
          original_price: item.original_price,
          price_id: item.price_id, // Make sure this is included
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

  // Update item price (creates new price entry)
  static async updateItemPrice(itemId, newPrice, userId) {
    try {
      const response = await fetch(`${API_BASE}/update-price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemId, 
          newPrice, 
          userId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update price');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to update price');
      }

      return data;
    } catch (error) {
      console.error('Error updating price:', error);
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