const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/orders - Get all orders with optional status filter
router.get('/', (req, res) => {
  const { status } = req.query;
  
  console.log('📦 Orders: Fetching orders...');
  if (status) {
    console.log(`   Filter: status = ${status}`);
  }
  
  let query = `
    SELECT 
      o.id,
      o.worker_id,
      o.user_id,
      o.total_amount,
      o.status,
      o.reason_for_decline,
      o.billing_address,
      o.created_at,
      u.username as customer_name,
      u.email as customer_email,
      w.username as worker_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN users w ON o.worker_id = w.id
  `;
  
  const params = [];
  
  if (status && status !== 'all') {
    query += ' WHERE o.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY o.created_at DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Error fetching orders:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: err.message
      });
    }
    
    console.log(`✅ Orders: Found ${results.length} orders`);
    
    res.json({
      success: true,
      orders: results || []
    });
  });
});

// GET /api/orders/user/:userId - Get all orders for a specific user
router.get('/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  console.log(`📦 Orders: Fetching orders for user ${userId}...`);
  
  const query = `
    SELECT 
      o.id,
      o.worker_id,
      o.user_id,
      o.total_amount,
      o.status,
      o.reason_for_decline,
      o.billing_address,
      o.created_at
    FROM orders o
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching user orders:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: err.message
      });
    }
    
    console.log(`✅ Orders: Found ${results.length} orders for user ${userId}`);
    
    res.json({
      success: true,
      orders: results || []
    });
  });
});

// GET /api/orders/:id - Get order details with items
router.get('/:id', (req, res) => {
  const orderId = req.params.id;
  
  console.log(`📦 Orders: Fetching order ${orderId}...`);
  
  // Get order details
  const orderQuery = `
    SELECT 
      o.id,
      o.worker_id,
      o.user_id,
      o.total_amount,
      o.status,
      o.reason_for_decline,
      o.billing_address,
      o.created_at,
      u.username as customer_name,
      u.email as customer_email,
      u.phone as customer_phone,
      w.username as worker_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN users w ON o.worker_id = w.id
    WHERE o.id = ?
  `;
  
  db.query(orderQuery, [orderId], (err, orderResults) => {
    if (err) {
      console.error('❌ Error fetching order:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: err.message
      });
    }
    
    if (!orderResults || orderResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const order = orderResults[0];
    
    // Get order items
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id,
        oi.item_id,
        oi.quantity,
        oi.price,
        i.name as item_name,
        i.description as item_description,
        i.main_img as item_image
      FROM order_items oi
      LEFT JOIN items i ON oi.item_id = i.id
      WHERE oi.order_id = ?
    `;
    
    db.query(itemsQuery, [orderId], (err, itemsResults) => {
      if (err) {
        console.error('❌ Error fetching order items:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch order items',
          error: err.message
        });
      }
      
      console.log(`✅ Orders: Order ${orderId} found with ${itemsResults.length} items`);
      
      res.json({
        success: true,
        order: {
          ...order,
          items: itemsResults || []
        }
      });
    });
  });
});

// GET /api/orders/:id/items - Get items for a specific order
router.get('/:id/items', (req, res) => {
  const orderId = req.params.id;
  
  console.log(`📦 Orders: Fetching items for order ${orderId}...`);
  
  const itemsQuery = `
    SELECT 
      oi.id,
      oi.order_id,
      oi.item_id,
      oi.quantity,
      oi.price,
      i.name,
      i.description,
      i.main_img as img
    FROM order_items oi
    LEFT JOIN items i ON oi.item_id = i.id
    WHERE oi.order_id = ?
  `;
  
  db.query(itemsQuery, [orderId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching order items:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch order items',
        error: err.message
      });
    }
    
    console.log(`✅ Orders: Found ${results.length} items for order ${orderId}`);
    
    res.json({
      success: true,
      items: results || []
    });
  });
});

// PUT /api/orders/:id/approve - Approve an order
router.put('/:id/approve', (req, res) => {
  const orderId = req.params.id;
  const { worker_id } = req.body;
  
  console.log(`✅ Orders: Approving order ${orderId} by worker ${worker_id}...`);
  
  if (!worker_id) {
    return res.status(400).json({
      success: false,
      error: 'Worker ID is required'
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
      
      // First check if order exists and is pending
      const checkQuery = 'SELECT id, status FROM orders WHERE id = ?';
      
      connection.query(checkQuery, [orderId], (err, checkResults) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({
              success: false,
              message: 'Error checking order',
              error: err.message
            });
          });
        }
        
        if (!checkResults || checkResults.length === 0) {
          return connection.rollback(() => {
            connection.release();
            res.status(404).json({
              success: false,
              message: 'Order not found'
            });
          });
        }
        
        if (checkResults[0].status !== 'pending') {
          return connection.rollback(() => {
            connection.release();
            res.status(400).json({
              success: false,
              message: `Order is already ${checkResults[0].status}`
            });
          });
        }
        
        // Update order status and worker_id
        const updateQuery = `
          UPDATE orders 
          SET status = 'approved', worker_id = ?
          WHERE id = ?
        `;
        
        connection.query(updateQuery, [worker_id, orderId], (err, updateResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({
                success: false,
                message: 'Error approving order',
                error: err.message
              });
            });
          }
          
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
            console.log(`✅ Orders: Order ${orderId} approved successfully`);
            
            res.json({
              success: true,
              message: 'Order approved successfully'
            });
          });
        });
      });
    });
  });
});

// PUT /api/orders/:id/reject - Reject an order
router.put('/:id/reject', (req, res) => {
  const orderId = req.params.id;
  const { worker_id, reason } = req.body;
  
  console.log(`❌ Orders: Rejecting order ${orderId} by worker ${worker_id}...`);
  
  if (!worker_id) {
    return res.status(400).json({
      success: false,
      error: 'Worker ID is required'
    });
  }
  
  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Rejection reason is required'
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
      
      // First check if order exists and is pending
      const checkQuery = 'SELECT id, status FROM orders WHERE id = ?';
      
      connection.query(checkQuery, [orderId], (err, checkResults) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({
              success: false,
              message: 'Error checking order',
              error: err.message
            });
          });
        }
        
        if (!checkResults || checkResults.length === 0) {
          return connection.rollback(() => {
            connection.release();
            res.status(404).json({
              success: false,
              message: 'Order not found'
            });
          });
        }
        
        if (checkResults[0].status !== 'pending') {
          return connection.rollback(() => {
            connection.release();
            res.status(400).json({
              success: false,
              message: `Order is already ${checkResults[0].status}`
            });
          });
        }
        
        // Update order status, worker_id, and reason
        const updateQuery = `
          UPDATE orders 
          SET status = 'rejected', worker_id = ?, reason_for_decline = ?
          WHERE id = ?
        `;
        
        connection.query(updateQuery, [worker_id, reason.trim(), orderId], (err, updateResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({
                success: false,
                message: 'Error rejecting order',
                error: err.message
              });
            });
          }
          
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
            console.log(`✅ Orders: Order ${orderId} rejected successfully`);
            
            res.json({
              success: true,
              message: 'Order rejected successfully'
            });
          });
        });
      });
    });
  });
});

module.exports = router;
