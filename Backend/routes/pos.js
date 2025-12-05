// routes/pos.js
const express = require('express');
const router = express.Router();
const POS = require('../models/POS');

// GET /api/pos/items - Get ALL items for POS (including out of stock)
router.get('/items', (req, res) => {
  console.log('🛒 POS: Fetching ALL items with latest prices...');
  
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
    
    // Convert image to base64 if exists
    const items = results.map(item => {
      const processedItem = {
        ...item,
        price_id: item.price_id || null,
        // Ensure all price fields exist
        price_cash: item.price_cash || 0,
        price_installment_total: item.price_installment_total || null,
        installment_months: item.installment_months || null,
        installment_per_month: item.installment_per_month || null,
        installment_last_payment: item.installment_last_payment || null,
        on_sale_price: item.on_sale_price || null,
        price_date: item.price_date || null,
        updated_by: item.updated_by || 'System'
      };
      
      if (item.item_image) {
        try {
          processedItem.item_image = Buffer.from(item.item_image).toString('base64');
        } catch (error) {
          console.error('Error converting image:', error);
          processedItem.item_image = null;
        }
      }
      
      return processedItem;
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
  
  console.log('💰 POS Checkout Request:', { 
    userId, 
    cartItems: cart?.length,
    totalUnits: cart?.reduce((sum, item) => sum + item.qty, 0) || 0
  });
  
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
  POS.checkQuantities(cart, (err, insufficientItems) => {
    if (err) {
      console.error('❌ Error checking quantities:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking inventory',
        error: err.message 
      });
    }

    if (insufficientItems.length > 0) {
      console.log('❌ Insufficient quantities:', insufficientItems);
      return res.status(400).json({
        success: false,
        message: 'Insufficient quantity for some items',
        insufficientItems
      });
    }

    console.log('✅ All items have sufficient quantity, processing sale...');

    // Step 2: Process sale transaction
    POS.processSaleTransaction({ cart, userId }, (err, result) => {
      if (err) {
        console.error('❌ Error processing sale:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error processing sale',
          error: err.message 
        });
      }

      console.log(`✅ Sale ${result.saleId} completed successfully!`);
      console.log(`📦 Items: ${result.totalItems}, Units: ${result.totalUnits}`);
      
      res.json({
        success: true,
        message: 'Sale processed successfully',
        saleId: result.saleId,
        totalItems: result.totalItems,
        totalUnits: result.totalUnits,
        timestamp: result.timestamp
      });
    });
  });
});

// routes/pos.js - Add debugging to checkout route:
router.post('/checkout', (req, res) => {
  const { cart, userId } = req.body;
  
  console.log('💰 POS Checkout Request:', { 
    userId, 
    cartItems: cart?.length,
    totalUnits: cart?.reduce((sum, item) => sum + item.qty, 0) || 0
  });
  
  // Debug: Check if price_id is coming from frontend
  cart?.forEach((item, index) => {
    console.log(`📦 Cart Item ${index + 1}:`, {
      id: item.id,
      name: item.name,
      qty: item.qty,
      price_cash: item.price_cash,
      price_id: item.price_id,
      has_price_id: !!item.price_id
    });
  });
  
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
  POS.checkQuantities(cart, (err, insufficientItems) => {
    if (err) {
      console.error('❌ Error checking quantities:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking inventory',
        error: err.message 
      });
    }

    if (insufficientItems.length > 0) {
      console.log('❌ Insufficient quantities:', insufficientItems);
      return res.status(400).json({
        success: false,
        message: 'Insufficient quantity for some items',
        insufficientItems
      });
    }

    console.log('✅ All items have sufficient quantity, processing sale...');

    // Step 2: Process sale transaction
    POS.processSaleTransaction({ cart, userId }, (err, result) => {
      if (err) {
        console.error('❌ Error processing sale:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error processing sale',
          error: err.message 
        });
      }

      console.log(`✅ Sale ${result.saleId} completed successfully!`);
      console.log(`📦 Items: ${result.totalItems}, Units: ${result.totalUnits}`);
      
      res.json({
        success: true,
        message: 'Sale processed successfully',
        saleId: result.saleId,
        totalItems: result.totalItems,
        totalUnits: result.totalUnits,
        timestamp: result.timestamp
      });
    });
  });
});

// PUT /api/pos/update-price - Update item price (not used in new logic but kept for compatibility)
router.put('/update-price', (req, res) => {
  // This endpoint is kept for compatibility but price changes are now handled in sales records only
  res.json({
    success: true,
    message: 'Price changes are now recorded directly in sales records'
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