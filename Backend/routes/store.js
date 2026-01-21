const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/store/branches - Get all branches for selection
router.get('/branches', (req, res) => {
  console.log('🏪 Store: Fetching branches...');
  
  const query = `
    SELECT id, name, address, phone, branch_img
    FROM branches
    ORDER BY name ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching branches:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch branches',
        error: err.message 
      });
    }
    
    console.log(`✅ Store: Found ${results.length} branches`);
    
    // Process branch images - handle URLs and relative paths
    const branches = results.map(branch => {
      let branchImg = branch.branch_img;
      
      // If branch_img exists and is not already a full URL
      if (branchImg && !branchImg.startsWith('http://') && !branchImg.startsWith('https://')) {
        // If it's a relative path starting with /
        if (branchImg.startsWith('/')) {
          branchImg = `http://localhost:5000${branchImg}`;
        } else {
          // Assume it's in uploads directory
          branchImg = `http://localhost:5000/uploads/${branchImg}`;
        }
      }
      
      return {
        id: branch.id,
        name: branch.name,
        address: branch.address || null,
        phone: branch.phone || null,
        branch_img: branchImg || null
      };
    });
    
    res.json({
      success: true,
      branches: branches
    });
  });
});

// GET /api/store/items - Get all items for the store with main_img and sub_imgs
// Optional query parameter: branch_id to filter by branch
router.get('/items', (req, res) => {
  const branchId = req.query.branch_id;
  
  if (branchId) {
    console.log(`🏪 Store: Fetching items for branch ${branchId}...`);
  } else {
    console.log('🏪 Store: Fetching all items...');
  }
  
  let query = `
    SELECT 
      i.id,
      i.name,
      i.description,
      i.quantity,
      i.category_id,
      i.branch_id,
      i.installment,
      i.main_img,
      i.sub_img1,
      i.sub_img2,
      i.sub_img3,
      i.sub_img4,
      ip.price_cash,
      ip.id as price_id,
      ip.price_installment_total,
      ip.installment_first_payment,
      ip.installment_months,
      ip.installment_per_month,
      ip.installment_last_payment
    FROM items i
    LEFT JOIN item_prices ip ON i.id = ip.item_id
    WHERE (ip.date = (
      SELECT MAX(date) 
      FROM item_prices 
      WHERE item_id = i.id
    )
    OR ip.date IS NULL)
  `;
  
  const queryParams = [];
  
  // Add branch filter if branch_id is provided
  if (branchId) {
    query += ` AND i.branch_id = ?`;
    queryParams.push(branchId);
  }
  
  query += ` ORDER BY i.id DESC`;
  
  // Execute query with or without branch filter
  const queryCallback = (err, results) => {
    if (err) {
      console.error('❌ Error fetching store items:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch store items',
        error: err.message 
      });
    }
    
    console.log(`✅ Store: Found ${results.length} items`);
    
    // Transform the data to match frontend format
    const storeProducts = results.map(item => {
      // Build images array: main_img first, then sub_imgs
      // Note: sub_img1-4 and main_img can be NULL in the database - we filter them out
      const imgs = [
        item.main_img,
        item.sub_img1,
        item.sub_img2,
        item.sub_img3,
        item.sub_img4
      ].filter(img => img != null && img !== ''); // Filter out null and empty string values
      
      // Build image URLs - if it's a relative path, prepend server URL
      // If it's already a full URL, use it as is
      const processImageUrl = (img) => {
        if (!img) return null;
        // If it's already a full URL (http:// or https://), return as is
        if (img.startsWith('http://') || img.startsWith('https://')) {
          return img;
        }
        // If it's a relative path, construct full URL
        // For local files in uploads directory
        if (img.startsWith('/')) {
          return `http://localhost:5000${img}`;
        }
        // For paths relative to uploads
        return `http://localhost:5000/uploads/${img}`;
      };
      
      const processedImgs = imgs.map(processImageUrl).filter(img => img != null);
      
      return {
        id: item.id.toString(),
        name: item.name,
        price: parseFloat(item.price_cash) || 0,
        price_installment_total: parseFloat(item.price_installment_total) || 0,
        installment_first_payment: parseFloat(item.installment_first_payment) || 0, // ADD
        installment: item.installment != null ? Number(item.installment) : 1,
        installment_months: parseInt(item.installment_months) || 12, // ADD
        installment_per_month: parseFloat(item.installment_per_month) || 0, // ADD
        installment_last_payment: parseFloat(item.installment_last_payment) || 0, // ADD
        img: processedImgs[0] || null,
        imgs: processedImgs,
        description: item.description || '',
        quantity: item.quantity || 0,
        category_id: item.category_id || null,
        price_id: item.price_id || null // ADD
      };
    });
    
    res.json({
      success: true,
      items: storeProducts
    });
  };
  
  if (queryParams.length > 0) {
    db.query(query, queryParams, queryCallback);
  } else {
    db.query(query, queryCallback);
  }
});

// GET /api/store/items/:id - Get a single item by ID for the store
router.get('/items/:id', (req, res) => {
  const itemId = req.params.id;
  console.log(`🏪 Store: Fetching item ${itemId}...`);
  
  const query = `
    SELECT 
      i.id,
      i.name,
      i.description,
      i.quantity,
      i.category_id,
      i.installment,
      i.main_img,
      i.sub_img1,
      i.sub_img2,
      i.sub_img3,
      i.sub_img4,
      ip.price_cash,
      ip.id as price_id,
      ip.price_installment_total,
      ip.installment_first_payment,
      ip.installment_months,
      ip.installment_per_month,
      ip.installment_last_payment
    FROM items i
    LEFT JOIN item_prices ip ON i.id = ip.item_id
    WHERE i.id = ? AND (
      ip.date = (
        SELECT MAX(date) 
        FROM item_prices 
        WHERE item_id = i.id
      )
      OR ip.date IS NULL
    )
    LIMIT 1
  `;
  
  db.query(query, [itemId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching store item:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch store item',
        error: err.message 
      });
    }
    
    if (!results || results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }
    
    const item = results[0];
    
    // Build images array: main_img first, then sub_imgs
    // Note: sub_img1-4 and main_img can be NULL in the database - we filter them out
    const imgs = [
      item.main_img,
      item.sub_img1,
      item.sub_img2,
      item.sub_img3,
      item.sub_img4
    ].filter(img => img != null && img !== ''); // Filter out null and empty string values
    
    // Build image URLs - if it's a relative path, prepend server URL
    const processImageUrl = (img) => {
      if (!img) return null;
      // If it's already a full URL (http:// or https://), return as is
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
      }
      // If it's a relative path, construct full URL
      if (img.startsWith('/')) {
        return `http://localhost:5000${img}`;
      }
      // For paths relative to uploads
      return `http://localhost:5000/uploads/${img}`;
    };
    
    const processedImgs = imgs.map(processImageUrl).filter(img => img != null);
    
    const storeProduct = {
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price_cash) || 0,
      price_installment_total: parseFloat(item.price_installment_total) || 0,
      installment_first_payment: parseFloat(item.installment_first_payment) || 0, // ADD THIS
      installment: item.installment != null ? Number(item.installment) : 1,
      installment_months: parseInt(item.installment_months) || 12, // ADD THIS
      installment_per_month: parseFloat(item.installment_per_month) || 0, // ADD THIS
      installment_last_payment: parseFloat(item.installment_last_payment) || 0, // ADD THIS
      img: processedImgs[0] || null,
      imgs: processedImgs,
      description: item.description || '',
      quantity: item.quantity || 0,
      category_id: item.category_id || null,
      price_id: item.price_id || null // ADD THIS
    };
    
    res.json({
      success: true,
      item: storeProduct
    });
  });
});

// POST /api/store/checkout - Process store checkout and create order
router.post('/checkout', (req, res) => {
  const { cartItems, billingAddress, totalAmount, userId } = req.body;

  console.log('🏪 Store: Processing checkout...');
  console.log(`👤 User ID: ${userId}`);
  console.log(`📦 Cart items: ${cartItems?.length || 0}`);
  console.log(`💰 Total amount: ${totalAmount}`);

  // Validation
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  if (!billingAddress || !billingAddress.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Billing address is required'
    });
  }

  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid total amount'
    });
  }

  // Use transaction to ensure data consistency
  db.getConnection((err, connection) => {
    if (err) {
      console.error('❌ Error getting database connection:', err);
      return res.status(500).json({
        success: false,
        message: 'Database connection error',
        error: err.message
      });
    }

    connection.beginTransaction((err) => {
      if (err) {
        console.error('❌ Error starting transaction:', err);
        connection.release();
        return res.status(500).json({
          success: false,
          message: 'Transaction error',
          error: err.message
        });
      }

      // Step 1: Create order record
      const orderQuery = `
        INSERT INTO orders (user_id, total_amount, status, billing_address, created_at)
        VALUES (?, ?, 'pending', ?, NOW())
      `;

      connection.query(orderQuery, [userId, totalAmount, billingAddress], (err, orderResult) => {
        if (err) {
          console.error('❌ Error creating order:', err);
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({
              success: false,
              message: 'Error creating order',
              error: err.message
            });
          });
        }

        const orderId = orderResult.insertId;
        console.log(`✅ Order ${orderId} created successfully`);

        // Step 2: Insert order items
        const orderItemsQuery = `
          INSERT INTO order_items (order_id, item_id, quantity, price)
          VALUES ?
        `;

        const orderItemsValues = cartItems.map(item => [
          orderId,
          parseInt(item.id),
          parseInt(item.quantity),
          parseFloat(item.price)
        ]);

        connection.query(orderItemsQuery, [orderItemsValues], (err, itemsResult) => {
          if (err) {
            console.error('❌ Error creating order items:', err);
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({
                success: false,
                message: 'Error creating order items',
                error: err.message
              });
            });
          }

          console.log(`✅ ${itemsResult.affectedRows} order items created`);

          // Commit transaction
          connection.commit((err) => {
            if (err) {
              console.error('❌ Error committing transaction:', err);
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({
                  success: false,
                  message: 'Error committing transaction',
                  error: err.message
                });
              });
            }

            connection.release();
            console.log(`✅ Checkout completed successfully! Order ID: ${orderId}`);
            
            res.json({
              success: true,
              message: 'Order placed successfully',
              orderId: orderId,
              totalItems: cartItems.length,
              totalAmount: totalAmount
            });
          });
        });
      });
    });
  });
});

module.exports = router;
