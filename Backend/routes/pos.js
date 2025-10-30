const express = require('express');
const router = express.Router();
const POS = require('../models/POS');

// GET /api/pos/items - Get ALL items for POS (including out of stock)
router.get('/items', (req, res) => {
  console.log('🛒 POS: Fetching ALL items...');
  
  POS.getAvailableItems((err, results) => {
    if (err) {
      console.error('❌ Error fetching POS items:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch items',
        error: err.message 
      });
    }
    
    console.log(`✅ POS: Found ${results.length} total items`);
    console.log(`📊 Available: ${results.filter(item => item.available === 1 && item.quantity > 0).length}`);
    console.log(`📊 Out of stock: ${results.filter(item => item.available === 0 || item.quantity <= 0).length}`);
    
    // Convert image to base64 if exists
    const items = results.map(item => {
      if (item.item_image) {
        try {
          item.item_image = Buffer.from(item.item_image).toString('base64');
        } catch (error) {
          console.error('Error converting image:', error);
          item.item_image = null;
        }
      }
      return item;
    });
    
    res.json({ 
      success: true, 
      items,
      message: `Found ${items.length} total items (${items.filter(item => item.available === 1 && item.quantity > 0).length} available)`
    });
  });
});

// POST /api/pos/checkout - Process sale
router.post('/checkout', (req, res) => {
  const { cart, userId } = req.body;
  
  console.log('💰 POS Checkout:', { userId, cartItems: cart?.length });
  
  // Validate input
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cart is empty' 
    });
  }

  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID is required' 
    });
  }

  // Step 1: Check if all items have sufficient quantity
  POS.checkQuantities(cart, (err, availableItems) => {
    if (err) {
      console.error('❌ Error checking quantities:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking inventory',
        error: err.message 
      });
    }

    // Check for insufficient quantities
    const insufficientItems = [];
    cart.forEach(cartItem => {
      const availableItem = availableItems.find(item => item.id === cartItem.id);
      if (!availableItem || availableItem.quantity < cartItem.qty) {
        insufficientItems.push({
          id: cartItem.id,
          name: cartItem.name,
          requested: cartItem.qty,
          available: availableItem ? availableItem.quantity : 0
        });
      }
    });

    if (insufficientItems.length > 0) {
      console.log('❌ Insufficient quantities:', insufficientItems);
      return res.status(400).json({
        success: false,
        message: 'Insufficient quantity for some items',
        insufficientItems
      });
    }

    // Step 2: Get next sale ID
    POS.getNextSaleId((err, saleIdResult) => {
      if (err) {
        console.error('❌ Error getting sale ID:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error processing sale',
          error: err.message 
        });
      }

      const saleId = saleIdResult[0].next_sale_id;
      const totalPrice = cart.reduce((sum, item) => sum + (item.price_cash * item.qty), 0);

      console.log(`🆕 Sale ID: ${saleId}, Total: $${totalPrice}`);

      // Step 3: Prepare data for database
      const salesData = cart.map(item => [
        userId,                    // user_id (employee who made sale)
        null,                      // customer_id (null for walk-in customers)
        item.id,                   // item_id
        'cash',                    // sale_type
        item.price_cash * item.qty, // total_price for this item line
        saleId                     // sale_id (groups all items in one sale)
      ]);

      const inventoryLogData = cart.map(item => [
        item.id,                   // item_id
        userId,                    // worker_id
        'sale',                    // change_type
        -item.qty                  // quantity_changed (negative for sales)
      ]);

      // Step 4: Update item quantities
      const updatePromises = cart.map(item => {
        return new Promise((resolve, reject) => {
          const newQuantity = item.quantity - item.qty;
          POS.updateItemQuantity(item.id, newQuantity, (err) => {
            if (err) {
              console.error(`❌ Error updating quantity for item ${item.id}:`, err);
              reject(err);
            } else {
              console.log(`✅ Updated item ${item.id} quantity to ${newQuantity}`);
              resolve();
            }
          });
        });
      });

      // Step 5: Execute all database operations
      Promise.all(updatePromises)
        .then(() => {
          console.log('✅ All quantities updated, creating sales records...');
          
          // Create sales records
          POS.createSale(salesData, (err) => {
            if (err) {
              console.error('❌ Error creating sales:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Error recording sale',
                error: err.message 
              });
            }

            console.log('✅ Sales records created, creating inventory logs...');
            
            // Create inventory logs
            POS.createInventoryLog(inventoryLogData, (err) => {
              if (err) {
                console.error('❌ Error creating inventory logs:', err);
                // Don't fail the sale if logs fail
              }

              console.log(`✅ Sale ${saleId} completed successfully!`);
              
              res.json({
                success: true,
                message: 'Sale processed successfully',
                saleId,
                totalPrice,
                itemsSold: cart.length,
                timestamp: new Date().toISOString()
              });
            });
          });
        })
        .catch(error => {
          console.error('❌ Error updating quantities:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Error updating inventory',
            error: error.message 
          });
        });
    });
  });
});

// GET /api/pos/health - Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'POS system is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;