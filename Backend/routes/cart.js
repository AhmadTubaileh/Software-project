const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Item = require('../models/Item');

router.post('/add', (req, res) => {
  const { userId, itemId, quantity, paymentPreference } = req.body;

  if (!userId || !itemId || !quantity) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: userId, itemId, quantity' 
    });
  }

  Item.getByIdWithLatestPrice(itemId, (err, item) => {
    if (err) {
      console.error('Error fetching item:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching item details' 
      });
    }

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }

    if (item.available !== 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item is not available' 
      });
    }

    const price = item.on_sale_price || item.price_cash;

    Cart.addItem(userId, itemId, quantity, price, paymentPreference || 'cash', (err, result) => {
      if (err) {
        console.error('Error adding to cart:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to add item to cart' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Item added to cart successfully',
        cartItemId: result.insertId
      });
    });
  });
});

router.get('/:userId', (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID is required' 
    });
  }

  Cart.getCartItems(userId, (err, items) => {
    if (err) {
      console.error('Error fetching cart:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch cart items' 
      });
    }

    const formattedItems = items.map(item => ({
      id: item.cart_item_id,
      itemId: item.item_id,
      name: item.name,
      description: item.description,
      img: item.main_img || item.item_image,
      price: parseFloat(item.price_at_add),
      currentPrice: parseFloat(item.current_price || item.price_at_add),
      onSalePrice: item.on_sale_price ? parseFloat(item.on_sale_price) : null,
      quantity: item.quantity,
      subtotal: parseFloat(item.price_at_add) * item.quantity,
      paymentPreference: item.payment_preference,
      installment: item.installment,
      available: item.available
    }));

    res.json({ 
      success: true, 
      items: formattedItems 
    });
  });
});

router.put('/update', (req, res) => {
  const { userId, itemId, quantity } = req.body;

  if (!userId || !itemId || quantity === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: userId, itemId, quantity' 
    });
  }

  Cart.updateQuantity(userId, itemId, quantity, (err, result) => {
    if (err) {
      console.error('Error updating cart:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update cart item' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Cart updated successfully' 
    });
  });
});

router.delete('/remove', (req, res) => {
  const { userId, itemId } = req.body;

  if (!userId || !itemId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: userId, itemId' 
    });
  }

  Cart.removeItem(userId, itemId, (err, result) => {
    if (err) {
      console.error('Error removing from cart:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to remove item from cart' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Item removed from cart successfully' 
    });
  });
});

router.delete('/clear/:userId', (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID is required' 
    });
  }

  Cart.clearCart(userId, (err, result) => {
    if (err) {
      console.error('Error clearing cart:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to clear cart' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Cart cleared successfully' 
    });
  });
});

router.get('/count/:userId', (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID is required' 
    });
  }

  Cart.getCartCount(userId, (err, count) => {
    if (err) {
      console.error('Error getting cart count:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get cart count' 
      });
    }

    res.json({ 
      success: true, 
      count: count 
    });
  });
});

module.exports = router;
