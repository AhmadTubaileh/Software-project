// routes/pos.js
const express = require('express');
const router = express.Router();
const POS = require('../models/POS');
const db = require('../config/database');

// GET /api/pos/items - Get ALL items for POS (including out of stock, filtered by accessible branches)
router.get('/items', (req, res) => {
  // Get userId from query params or request body
  const userId = req.query.userId || req.body.userId || (req.user ? req.user.id : null);
  
  console.log('🛒 POS: Fetching items with latest prices...', { userId });
  
  POS.getAvailableItems(userId, (err, results) => {
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

// GET /api/pos/search-sales - Search sales by criteria
router.get('/search-sales', (req, res) => {
  const { searchType, saleId, userId, startDate, endDate, branchId } = req.query;
  
  console.log('🔍 Searching sales:', { searchType, saleId, userId, startDate, endDate, branchId });
  
  // Get user's accessible branches if branchId not specified
  const getBranchIds = (callback) => {
    if (branchId) {
      // If specific branch selected, use only that branch
      return callback(null, [parseInt(branchId)]);
    }
    
    // Get accessible branches for the current user (from userId or req.user)
    const currentUserId = userId || (req.user ? req.user.id : null);
    if (!currentUserId) {
      return callback(null, null); // No filter if no user
    }
    
    const branchQuery = `
      SELECT DISTINCT branch_id 
      FROM user_branches 
      WHERE user_id = ?
    `;
    
    const db = require('../config/database');
    db.query(branchQuery, [currentUserId], (err, branchResults) => {
      if (err) {
        console.error('Error fetching accessible branches:', err);
        return callback(err);
      }
      
      if (!branchResults || branchResults.length === 0) {
        return callback(null, null); // No filter if no branches
      }
      
      const branchIds = branchResults.map(b => b.branch_id);
      callback(null, branchIds);
    });
  };
  
  if (searchType === 'saleId' && saleId) {
    // Get branch IDs for filtering
    getBranchIds((err, branchIds) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error getting branch access',
          error: err.message 
        });
      }
      
      // Search by sale ID - get ALL records (cash and retrieve) for that sale_id
      POS.searchSalesBySaleId(saleId, branchIds, (err, results) => {
      if (err) {
        console.error('❌ Error searching sales by ID:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error searching sales',
          error: err.message 
        });
      }
      
      // Group by item_id for better display
      const groupedResults = {};
      results.forEach(record => {
        const itemId = record.item_id;
        if (!groupedResults[itemId]) {
          groupedResults[itemId] = {
            item_id: itemId,
            item_name: record.item_name,
            item_description: record.item_description,
            original_quantity: 0,
            returned_quantity: 0,
            available_for_return: 0,
            cash_records: [],
            retrieve_records: []
          };
        }
        
        if (record.sale_type === 'cash') {
          groupedResults[itemId].cash_records.push({
            id: record.id,
            sale_id: record.sale_id,
            quantity: record.quantity,
            price: record.price,
            date: record.date,
            worker_name: record.worker_name,
            user_id: record.user_id,
            price_id: record.price_id
          });
          groupedResults[itemId].original_quantity += record.quantity;
        } else if (record.sale_type === 'retrieve') {
          groupedResults[itemId].retrieve_records.push({
            id: record.id,
            sale_id: record.sale_id,
            quantity: record.quantity,
            price: record.price,
            date: record.date,
            worker_name: record.worker_name,
            user_id: record.user_id,
            price_id: record.price_id
          });
          groupedResults[itemId].returned_quantity += record.quantity;
        }
      });
      
      // Calculate available for return for each item
      Object.values(groupedResults).forEach(item => {
        item.available_for_return = item.original_quantity - item.returned_quantity;
      });
      
      res.json({
        success: true,
        searchType: 'saleId',
        saleId: saleId,
        items: Object.values(groupedResults),
        totalItems: Object.keys(groupedResults).length
      });
    });
    });
    
  } else if (searchType === 'workerTime' && userId && startDate && endDate) {
    // Get branch IDs for filtering
    getBranchIds((err, branchIds) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error getting branch access',
          error: err.message 
        });
      }
      
      // Search by worker and time period - get only cash records first
      POS.searchSalesByWorkerTime(userId, startDate, endDate, branchIds, (err, results) => {
      if (err) {
        console.error('❌ Error searching sales by worker/time:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error searching sales',
          error: err.message 
        });
      }
      
      res.json({
        success: true,
        searchType: 'workerTime',
        userId: userId,
        startDate: startDate,
        endDate: endDate,
        results: results,
        totalSales: results.length
      });
    });
    });
    
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid search parameters'
    });
  }
});

// GET /api/pos/sale-details - Get complete details for a sale_id
router.get('/sale-details/:saleId', (req, res) => {
  const saleId = req.params.saleId;
  
  console.log('📋 Getting details for sale:', saleId);
  
  // Get all records for this sale_id (cash and retrieve)
  POS.getSaleDetails(saleId, (err, results) => {
    if (err) {
      console.error('❌ Error getting sale details:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error getting sale details',
        error: err.message 
      });
    }
    
    // Group by item_id
    const groupedByItem = {};
    results.forEach(record => {
      const itemId = record.item_id;
      if (!groupedByItem[itemId]) {
        groupedByItem[itemId] = {
          item_id: itemId,
          item_name: record.item_name,
          item_description: record.item_description,
          current_stock: record.current_stock,
          original_quantity: 0,
          returned_quantity: 0,
          available_for_return: 0,
          cash_records: [],
          retrieve_records: []
        };
      }
      
      if (record.sale_type === 'cash') {
        groupedByItem[itemId].cash_records.push({
          id: record.id,
          sale_type: record.sale_type,
          sale_id: record.sale_id,
          quantity: record.quantity,
          price: record.price,
          date: record.date,
          worker_name: record.worker_name,
          user_id: record.user_id,
          price_id: record.price_id
        });
        groupedByItem[itemId].original_quantity += record.quantity;
      } else if (record.sale_type === 'retrieve') {
        groupedByItem[itemId].retrieve_records.push({
          id: record.id,
          sale_type: record.sale_type,
          sale_id: record.sale_id,
          quantity: record.quantity,
          price: record.price,
          date: record.date,
          worker_name: record.worker_name,
          user_id: record.user_id,
          price_id: record.price_id
        });
        groupedByItem[itemId].returned_quantity += record.quantity;
      }
    });
    
    // Calculate available for return for each item
    Object.values(groupedByItem).forEach(item => {
      item.available_for_return = item.original_quantity - item.returned_quantity;
    });
    
    res.json({
      success: true,
      saleId: saleId,
      items: Object.values(groupedByItem),
      totalItems: Object.keys(groupedByItem).length
    });
  });
});

// POST /api/pos/process-return - Process item return
router.post('/process-return', (req, res) => {
  const { saleId, itemId, cashRecordId, returnQuantity, returnType, userId, originalPrice, branchId } = req.body;
  
  console.log('🔄 Processing return:', {
    saleId, itemId, cashRecordId, returnQuantity, returnType, userId, originalPrice, branchId
  });
  
  // Validate input
  if (!saleId || !itemId || !cashRecordId || !returnQuantity || !returnType || !userId || !originalPrice) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  if (returnQuantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Return quantity must be positive'
    });
  }
  
  // Use the existing POS model method for return processing
  POS.processReturnTransaction({
    saleId,
    itemId,
    cashRecordId,
    returnQuantity,
    returnType,
    userId,
    originalPrice,
    branchId: branchId || null // Pass branchId if provided
  }, (err, result) => {
    if (err) {
      console.error('❌ Error processing return:', err);
      return res.status(500).json({
        success: false,
        message: 'Error processing return',
        error: err.message
      });
    }
    
    res.json({
      success: true,
      message: `Return processed successfully. ${returnQuantity} item(s) returned.`,
      returnType: returnType,
      quantity: returnQuantity,
      refundAmount: returnQuantity * originalPrice,
      saleId: saleId
    });
  });
});

// GET /api/pos/workers - Get all workers (users with user_type 0-9)
router.get('/workers', (req, res) => {
  POS.getWorkers((err, workers) => {
    if (err) {
      console.error('❌ Error fetching workers:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching workers',
        error: err.message
      });
    }
    
    res.json({
      success: true,
      workers: workers,
      count: workers.length
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