const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const upload = require('../middleware/upload');
const db = require('../config/database');

// Update the calculateInstallmentPayments function in the items.js router:
function calculateInstallmentPayments(price_installment_total, installment_first_payment, installment_months) {
  if (!price_installment_total || !installment_first_payment || !installment_months) {
    return { installment_per_month: null, installment_last_payment: null };
  }

  const total = parseFloat(price_installment_total);
  const downPayment = parseFloat(installment_first_payment);
  const months = parseInt(installment_months);

  if (months <= 1) {
    return {
      installment_per_month: 0,
      installment_last_payment: total - downPayment
    };
  }

  const remaining = total - downPayment;
  const equalMonths = months - 1; // CHANGED: Months - 1
  
  // Calculate monthly payment (rounded down to nearest 10)
  const rawMonthly = remaining / equalMonths;
  const monthlyPayment = Math.floor(rawMonthly / 10) * 10;
  
  // Calculate last payment
  let lastPayment = remaining - (monthlyPayment * equalMonths);
  
  // NEW LOGIC: If last payment is 0, take 10 from each monthly payment
  if (lastPayment === 0) {
    // Take 10 from each monthly payment
    const adjustedMonthly = monthlyPayment - 10;
    // Add (10 * equalMonths) to last payment
    lastPayment = 10 * equalMonths;
    
    console.log('New installment calculation (Months-1 method):');
    console.log('Total:', total, 'Down:', downPayment, 'Months:', months);
    console.log('Remaining:', remaining, 'Equal Months:', equalMonths);
    console.log('Original monthly:', monthlyPayment);
    console.log('Adjusted monthly:', adjustedMonthly);
    console.log('Adjusted last:', lastPayment);
    
    return {
      installment_per_month: adjustedMonthly,
      installment_last_payment: lastPayment
    };
  }
  
  return {
    installment_per_month: monthlyPayment,
    installment_last_payment: lastPayment
  };
}

// GET /api/items - Get all items with latest prices (with branch filtering)
router.get('/', async (req, res) => {
  try {
    // Get current user from session or use default for testing
    let currentUser;
    
    if (req.user) {
      currentUser = req.user;
      console.log('User from session:', currentUser);
    } else {
      // For testing - you should remove this in production
      currentUser = {
        id: 1,
        user_type: 0,
        username: 'admin'
      };
      console.log('Using default admin user for testing');
    }
    
    console.log(`Fetching items for user type ${currentUser.user_type}`);
    
    // For non-admin users, filter by accessible branches
    if (currentUser.user_type !== 0) {
      console.log(`Non-admin user type ${currentUser.user_type}, filtering by accessible branches...`);
      
      // Get accessible branches for current user
      const accessibleBranches = await new Promise((resolve, reject) => {
        const query = `
          SELECT DISTINCT b.id, b.name 
          FROM branches b
          INNER JOIN user_branches ub ON b.id = ub.branch_id
          WHERE ub.user_id = ?
          ORDER BY b.name
        `;
        db.query(query, [currentUser.id], (err, results) => {
          if (err) {
            console.error('Database error in getAccessibleBranches:', err);
            reject(err);
          } else {
            console.log(`Found ${results.length} accessible branches`);
            resolve(results || []);
          }
        });
      });

      if (!accessibleBranches || accessibleBranches.length === 0) {
        console.log('No accessible branches, returning empty array');
        return res.json([]);
      }

      // Extract branch IDs
      const branchIds = accessibleBranches.map(b => b.id);
      console.log('Accessible branch IDs:', branchIds);

      // Query to get items from accessible branches with latest prices
      const query = `
        SELECT 
          i.*,
          b.name as branch_name,
          ip.price_cash,
          ip.buy_price,
          ip.price_installment_total,
          ip.installment_first_payment,
          ip.installment_months,
          ip.installment_per_month,
          ip.installment_last_payment,
          ip.on_sale_price,
          ip.date as price_date,
          u.username as updated_by
        FROM items i
        LEFT JOIN branches b ON i.branch_id = b.id
        LEFT JOIN item_prices ip ON i.id = ip.item_id
        LEFT JOIN users u ON ip.user_id = u.id
        WHERE i.branch_id IN (?)
          AND (ip.date = (
            SELECT MAX(date) 
            FROM item_prices 
            WHERE item_id = i.id
          )
          OR ip.date IS NULL)
        ORDER BY i.id DESC
      `;

      console.log('Executing query with branch IDs:', branchIds);
      
      db.query(query, [branchIds], (err, items) => {
        if (err) {
          console.error('Database error fetching filtered items:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch items: ' + err.message,
            error: err.message 
          });
        }

        console.log(`Found ${items.length} items for user type ${currentUser.user_type}`);

        // Convert images to base64
        const serializedItems = items.map(item => ({
          ...item,
          item_image: item.item_image ? item.item_image.toString('base64') : null,
          updated_by: item.updated_by || 'System'
        }));
        
        res.json(serializedItems);
      });
    } else {
      // Admin sees all items
      console.log('Admin user, fetching all items...');
      
      Item.getAllWithLatestPrices((err, items) => {
        if (err) {
          console.error('Error fetching items:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch items',
            error: err.message 
          });
        }
        
        // Convert images to base64
        const serializedItems = items.map(item => ({
          ...item,
          item_image: item.item_image ? item.item_image.toString('base64') : null,
          updated_by: item.updated_by || 'System'
        }));
        
        res.json(serializedItems);
      });
    }
  } catch (error) {
    console.error('Unexpected error in GET /items:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error: ' + error.message,
      error: error.message 
    });
  }
});


// GET /api/items/inventory - Get items for worker inventory management
router.get('/inventory', (req, res) => {
  Item.getInventoryItems((err, items) => {
    if (err) {
      console.error('Error fetching inventory items:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory items'
      });
    }
    
    // Convert images to base64 if they exist
    const serializedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      available: item.available,
      item_image: item.item_image ? item.item_image.toString('base64') : null,
      // Include current price for reference (but workers can't edit it)
      price_cash: item.price_cash || 0
    }));
    
    res.json(serializedItems);
  });
});

// POST /api/items/:id/adjust-quantity - Adjust item quantity
router.post('/:id/adjust-quantity', (req, res) => {
  try {
    const itemId = req.params.id;
    const { workerId, changeType, quantity } = req.body;
    
    // Validate required fields
    if (!workerId || !changeType || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: workerId, changeType, quantity'
      });
    }
    
    // Validate changeType
    if (!['add', 'remove'].includes(changeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid changeType. Must be "add" or "remove"'
      });
    }
    
    // Validate quantity
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }
    
    // Check if item exists
    Item.getById(itemId, (err, item) => {
      if (err) {
        console.error('Error checking item:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      
      // For remove operations, check if enough stock exists
      if (changeType === 'remove' && item.quantity < quantityNum) {
        return res.status(400).json({
          success: false,
          message: `Cannot remove ${quantityNum} items. Only ${item.quantity} available.`
        });
      }
      
      // Adjust quantity and create log
      Item.adjustQuantity(itemId, workerId, changeType, quantityNum, (err, result) => {
        if (err) {
          console.error('Error adjusting quantity:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to adjust quantity',
            error: err.message
          });
        }
        
        // Get updated item
        Item.getById(itemId, (err, updatedItem) => {
          if (err) {
            console.error('Error fetching updated item:', err);
            return res.json({
              success: true,
              message: 'Quantity adjusted successfully'
            });
          }
          
          // Convert image if exists
          if (updatedItem.item_image) {
            updatedItem.item_image = updatedItem.item_image.toString('base64');
          }
          
          res.json({
            success: true,
            message: `Successfully ${changeType === 'add' ? 'added' : 'removed'} ${quantityNum} items`,
            item: {
              id: updatedItem.id,
              name: updatedItem.name,
              quantity: updatedItem.quantity,
              available: updatedItem.available
            }
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Error adjusting quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust quantity',
      error: error.message
    });
  }
});

// GET /api/items/:id/inventory-logs - Get inventory logs for an item
router.get('/:id/inventory-logs', (req, res) => {
  const itemId = req.params.id;
  
  Item.getInventoryLogs(itemId, (err, logs) => {
    if (err) {
      console.error('Error fetching inventory logs:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory logs'
      });
    }
    
    res.json(logs);
  });
});

// GET /api/items/:id/prices - Get price history for an item
router.get('/:id/prices', (req, res) => {
  const itemId = req.params.id;
  
  Item.getPriceHistory(itemId, (err, prices) => {
    if (err) {
      console.error('Error fetching price history:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch price history',
        error: err.message 
      });
    }
    
    res.json(prices);
  });
});

// POST /api/items - Create new item with initial price (with branch validation)
router.post('/', upload.single('item_image'), async (req, res) => {
  try {
    // Get user ID from request body
    const userId = req.body.currentUserId || req.body.user_id || 1;
    const branchId = parseInt(req.body.branch_id);
    
    console.log('Creating item with user ID:', userId, 'and branch ID:', branchId);
    console.log('Request body fields:', Object.keys(req.body));
    
    // Get current user for access control
    let currentUser = req.user || { id: userId, user_type: 0 };
    console.log('Current user:', currentUser);
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'price_cash', 'buy_price', 'available', 'installment', 'quantity', 'branch_id'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        console.log(`Missing field: ${field}`);
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }
    
    // If non-admin, check if they have access to the branch
    if (currentUser.user_type !== 0) {
      console.log(`Non-admin user, checking branch access for branch ${branchId}`);
      
      const hasAccess = await new Promise((resolve) => {
        const query = `
          SELECT COUNT(*) as count FROM user_branches 
          WHERE user_id = ? AND branch_id = ?
        `;
        db.query(query, [currentUser.id, branchId], (err, results) => {
          if (err) {
            console.error('Error checking branch access:', err);
            resolve(false);
          } else {
            const hasAccess = results[0].count > 0;
            console.log(`User ${currentUser.id} access to branch ${branchId}: ${hasAccess}`);
            resolve(hasAccess);
          }
        });
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to create items in this branch'
        });
      }
    }

    // Parse form data
    const itemData = {
      name: req.body.name,
      description: req.body.description,
      available: req.body.available === '1' || req.body.available === 'true' || req.body.available === true ? 1 : 0,
      installment: req.body.installment === '1' || req.body.installment === 'true' || req.body.installment === true ? 1 : 0,
      quantity: parseInt(req.body.quantity) || 0,
      item_image: req.file ? req.file.buffer : null,
      branch_id: branchId
    };

    console.log('Item data:', itemData);

    // Parse price data
    const priceData = {
      price_cash: parseFloat(req.body.price_cash) || 0,
      buy_price: parseFloat(req.body.buy_price) || 0,
      price_installment_total: req.body.price_installment_total ? parseFloat(req.body.price_installment_total) : null,
      installment_first_payment: req.body.installment_first_payment ? parseFloat(req.body.installment_first_payment) : null,
      installment_months: req.body.installment_months ? parseInt(req.body.installment_months) : null,
      on_sale_price: req.body.on_sale_price ? parseFloat(req.body.on_sale_price) : null,
      user_id: parseInt(userId)
    };

    console.log('Price data before calculation:', priceData);

    // Calculate installment payments if installment is enabled
    if (itemData.installment && priceData.price_installment_total && 
        priceData.installment_first_payment && priceData.installment_months) {
      const { installment_per_month, installment_last_payment } = 
        calculateInstallmentPayments(
          priceData.price_installment_total,
          priceData.installment_first_payment,
          priceData.installment_months
        );
      
      priceData.installment_per_month = installment_per_month;
      priceData.installment_last_payment = installment_last_payment;
      
      console.log('Installment calculation result:', {
        monthly: priceData.installment_per_month,
        last: priceData.installment_last_payment
      });
    }

    console.log('Price data after calculation:', priceData);

    // Create item and initial price
    Item.createWithPrice(itemData, priceData, (err, result) => {
      if (err) {
        console.error('Error creating item:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to create item',
          error: err.message
        });
      }
      
      // Fetch the created item with price
      Item.getByIdWithLatestPrice(result.itemId, (err, newItem) => {
        if (err) {
          console.error('Error fetching created item:', err);
          // Still return success since item was created
          return res.status(201).json({
            success: true,
            message: 'Item created successfully',
            itemId: result.itemId
          });
        }
        
        // Convert image to base64
        if (newItem && newItem.item_image) {
          newItem.item_image = newItem.item_image.toString('base64');
        }
        
        res.status(201).json({
          success: true,
          message: 'Item created successfully',
          item: newItem || { id: result.itemId }
        });
      });
    });
    
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error.message
    });
  }
});

// PUT /api/items/:id - Edit item (update existing price row) with branch access control
router.put('/:id', upload.single('item_image'), async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.body.currentUserId || req.body.user_id || 1;
    
    console.log('Editing item ID:', itemId, 'by user ID:', userId);
    
    // Get current user for access control
    let currentUser = req.user || { id: userId, user_type: 0 };
    console.log('Current user:', currentUser);
    
    // Check if item exists
    Item.getById(itemId, (err, existingItem) => {
      if (err) {
        console.error('Error checking item:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
      
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      
      // If non-admin, check if they have access to the item's branch
      if (currentUser.user_type !== 0) {
        console.log(`Non-admin user, checking branch access for branch ${existingItem.branch_id}`);
        
        const query = `
          SELECT COUNT(*) as count FROM user_branches 
          WHERE user_id = ? AND branch_id = ?
        `;
        db.query(query, [currentUser.id, existingItem.branch_id], (err, results) => {
          if (err) {
            console.error('Error checking branch access:', err);
            return res.status(500).json({
              success: false,
              message: 'Server error'
            });
          }
          
          const hasAccess = results[0].count > 0;
          if (!hasAccess) {
            console.log(`User ${currentUser.id} does not have access to branch ${existingItem.branch_id}`);
            return res.status(403).json({
              success: false,
              message: 'You do not have access to edit items in this branch'
            });
          }
          
          // Proceed with update
          proceedWithUpdate();
        });
      } else {
        // Admin can edit any item
        proceedWithUpdate();
      }
      
      function proceedWithUpdate() {
        // Parse item data
        const itemData = {
          name: req.body.name || existingItem.name,
          description: req.body.description || existingItem.description,
          available: req.body.available !== undefined 
            ? (req.body.available === '1' || req.body.available === 'true' || req.body.available === true ? 1 : 0)
            : existingItem.available,
          installment: req.body.installment !== undefined
            ? (req.body.installment === '1' || req.body.installment === 'true' || req.body.installment === true ? 1 : 0)
            : existingItem.installment,
          quantity: req.body.quantity !== undefined ? parseInt(req.body.quantity) : existingItem.quantity,
          item_image: req.file ? req.file.buffer : existingItem.item_image,
          branch_id: currentUser.user_type === 0 && req.body.branch_id 
            ? parseInt(req.body.branch_id) 
            : existingItem.branch_id  // Admin can change, others cannot
        };

        // Get latest price
        Item.getLatestPrice(itemId, (err, latestPrice) => {
          if (err) {
            console.error('Error getting latest price:', err);
            return res.status(500).json({
              success: false,
              message: 'Server error'
            });
          }

          // Parse price data (update existing)
          const priceData = {
            price_cash: req.body.price_cash !== undefined ? parseFloat(req.body.price_cash) : latestPrice.price_cash,
            buy_price: req.body.buy_price !== undefined ? parseFloat(req.body.buy_price) : latestPrice.buy_price,
            price_installment_total: req.body.price_installment_total !== undefined 
              ? parseFloat(req.body.price_installment_total) 
              : latestPrice.price_installment_total,
            installment_first_payment: req.body.installment_first_payment !== undefined
              ? parseFloat(req.body.installment_first_payment)
              : latestPrice.installment_first_payment,
            installment_months: req.body.installment_months !== undefined
              ? parseInt(req.body.installment_months)
              : latestPrice.installment_months,
            on_sale_price: req.body.on_sale_price !== undefined
              ? parseFloat(req.body.on_sale_price)
              : latestPrice.on_sale_price,
            user_id: parseInt(userId)
          };

          // Calculate installment payments if needed
          if (priceData.price_installment_total && priceData.installment_first_payment && priceData.installment_months) {
            const { installment_per_month, installment_last_payment } = 
              calculateInstallmentPayments(
                priceData.price_installment_total,
                priceData.installment_first_payment,
                priceData.installment_months
              );
            
            priceData.installment_per_month = installment_per_month;
            priceData.installment_last_payment = installment_last_payment;
            
            console.log('Installment calculation result:', {
              monthly: priceData.installment_per_month,
              last: priceData.installment_last_payment
            });
          }

          // Update item and price
          Item.updateWithPrice(itemId, itemData, priceData, (err) => {
            if (err) {
              console.error('Error updating item:', err);
              return res.status(500).json({
                success: false,
                message: 'Failed to update item',
                error: err.message
              });
            }
            
            // Fetch updated item
            Item.getByIdWithLatestPrice(itemId, (err, updatedItem) => {
              if (err) {
                console.error('Error fetching updated item:', err);
                return res.json({
                  success: true,
                  message: 'Item updated successfully'
                });
              }
              
              // Convert image to base64
              if (updatedItem && updatedItem.item_image) {
                updatedItem.item_image = updatedItem.item_image.toString('base64');
              }
              
              res.json({
                success: true,
                message: 'Item updated successfully',
                item: updatedItem
              });
            });
          });
        });
      }
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message
    });
  }
});

// POST /api/items/:id/update-price - Create new price row (Update button)
router.post('/:id/update-price', upload.single('item_image'), (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.body.currentUserId || req.body.user_id || 1;
    
    console.log('Updating price for item ID:', itemId, 'by user ID:', userId);
    
    // Check if item exists
    Item.getById(itemId, (err, existingItem) => {
      if (err) {
        console.error('Error checking item:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
      
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // Update item info if provided
      if (req.body.name || req.body.description || req.body.quantity !== undefined) {
        const itemData = {
          name: req.body.name || existingItem.name,
          description: req.body.description || existingItem.description,
          available: req.body.available !== undefined 
            ? (req.body.available === '1' || req.body.available === 'true' || req.body.available === true ? 1 : 0)
            : existingItem.available,
          installment: req.body.installment !== undefined
            ? (req.body.installment === '1' || req.body.installment === 'true' || req.body.installment === true ? 1 : 0)
            : existingItem.installment,
          quantity: req.body.quantity !== undefined ? parseInt(req.body.quantity) : existingItem.quantity,
          item_image: req.file ? req.file.buffer : existingItem.item_image
        };
        
        Item.updateBasicInfo(itemId, itemData, (err) => {
          if (err) {
            console.error('Error updating item info:', err);
          }
        });
      }

      // Parse new price data
      const priceData = {
        item_id: parseInt(itemId),
        price_cash: parseFloat(req.body.price_cash) || 0,
        buy_price: parseFloat(req.body.buy_price) || 0,
        price_installment_total: req.body.price_installment_total ? parseFloat(req.body.price_installment_total) : null,
        installment_first_payment: req.body.installment_first_payment ? parseFloat(req.body.installment_first_payment) : null,
        installment_months: req.body.installment_months ? parseInt(req.body.installment_months) : null,
        on_sale_price: req.body.on_sale_price ? parseFloat(req.body.on_sale_price) : null,
        user_id: parseInt(userId)
      };

      // Calculate installment payments
      if (priceData.price_installment_total && priceData.installment_first_payment && priceData.installment_months) {
        const { installment_per_month, installment_last_payment } = 
          calculateInstallmentPayments(
            priceData.price_installment_total,
            priceData.installment_first_payment,
            priceData.installment_months
          );
        
        priceData.installment_per_month = installment_per_month;
        priceData.installment_last_payment = installment_last_payment;
        
        console.log('Installment calculation result:', {
          monthly: priceData.installment_per_month,
          last: priceData.installment_last_payment
        });
      }

      console.log('Creating new price entry:', priceData);

      // Create new price row
      Item.createPrice(priceData, (err) => {
        if (err) {
          console.error('Error updating price:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to update price',
            error: err.message
          });
        }
        
        // Fetch updated item
        Item.getByIdWithLatestPrice(itemId, (err, updatedItem) => {
          if (err) {
            console.error('Error fetching updated item:', err);
            return res.status(201).json({
              success: true,
              message: 'Price updated successfully (new entry created)'
            });
          }
          
          // Convert image to base64
          if (updatedItem && updatedItem.item_image) {
            updatedItem.item_image = updatedItem.item_image.toString('base64');
          }
          
          res.status(201).json({
            success: true,
            message: 'Price updated successfully (new entry created)',
            item: updatedItem
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update price',
      error: error.message
    });
  }
});

// DELETE /api/items/:id - Delete item with branch access control
router.delete('/:id', (req, res) => {
  const itemId = req.params.id;
  const userId = req.body.currentUserId || req.body.user_id || req.query.userId || 1;
  
  // Get current user for access control
  let currentUser = req.user || { id: userId, user_type: 0 };
  console.log('Deleting item, current user:', currentUser);
  
  // Check if item exists
  Item.getById(itemId, (err, existingItem) => {
    if (err) {
      console.error('Error checking item:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
    
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // If non-admin, check if they have access to the item's branch
    if (currentUser.user_type !== 0) {
      console.log(`Non-admin user, checking branch access for branch ${existingItem.branch_id}`);
      
      const query = `
        SELECT COUNT(*) as count FROM user_branches 
        WHERE user_id = ? AND branch_id = ?
      `;
      db.query(query, [currentUser.id, existingItem.branch_id], (err, results) => {
        if (err) {
          console.error('Error checking branch access:', err);
          return res.status(500).json({
            success: false,
            message: 'Server error'
          });
        }
        
        const hasAccess = results[0].count > 0;
        if (!hasAccess) {
          console.log(`User ${currentUser.id} does not have access to branch ${existingItem.branch_id}`);
          return res.status(403).json({
            success: false,
            message: 'You do not have access to delete items in this branch'
          });
        }
        
        // Proceed with delete
        proceedWithDelete();
      });
    } else {
      // Admin can delete any item
      proceedWithDelete();
    }
    
    function proceedWithDelete() {
      // Delete item
      Item.delete(itemId, (err) => {
        if (err) {
          console.error('Error deleting item:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to delete item',
            error: err.message
          });
        }
        
        res.json({
          success: true,
          message: 'Item deleted successfully'
        });
      });
    }
  });
});

// POST /api/items/:id/duplicate - Duplicate item to another branch (ADMIN ONLY)
router.post('/:id/duplicate', upload.single('item_image'), async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.body.currentUserId || req.body.user_id || 1;
    const targetBranchId = req.body.target_branch_id;
    
    console.log('Duplicating item ID:', itemId, 'to branch:', targetBranchId, 'by user ID:', userId);
    
    // Get current user for access control
    let currentUser = req.user || { id: userId, user_type: 0 };
    
    // Check if user is admin
    if (currentUser.user_type !== 0) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can duplicate items'
      });
    }
    
    // Validate target branch ID
    if (!targetBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Target branch ID is required'
      });
    }
    
    // Check if item exists
    Item.getByIdWithLatestPrice(itemId, (err, existingItem) => {
      if (err) {
        console.error('Error checking item:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
      
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      
      // Check if item already exists in target branch
      const checkQuery = `
        SELECT id FROM items 
        WHERE name = ? AND branch_id = ? 
        LIMIT 1
      `;
      db.query(checkQuery, [existingItem.name, targetBranchId], (err, results) => {
        if (err) {
          console.error('Error checking duplicate:', err);
          return res.status(500).json({
            success: false,
            message: 'Server error'
          });
        }
        
        if (results.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'An item with this name already exists in the target branch'
          });
        }
        
        // Proceed with duplication
        proceedWithDuplicate();
      });
      
      function proceedWithDuplicate() {
        // Prepare item data for new item
        const itemData = {
          name: existingItem.name,
          description: existingItem.description,
          available: existingItem.available,
          installment: existingItem.installment,
          quantity: existingItem.quantity,
          item_image: existingItem.item_image,
          branch_id: parseInt(targetBranchId)
        };

        // Prepare price data
        const priceData = {
          price_cash: existingItem.price_cash,
          buy_price: existingItem.buy_price,
          price_installment_total: existingItem.price_installment_total,
          installment_first_payment: existingItem.installment_first_payment,
          installment_months: existingItem.installment_months,
          installment_per_month: existingItem.installment_per_month,
          installment_last_payment: existingItem.installment_last_payment,
          on_sale_price: existingItem.on_sale_price,
          user_id: parseInt(userId)
        };

        // Create new item with same data but different branch
        Item.createWithPrice(itemData, priceData, (err, newItemId) => {
          if (err) {
            console.error('Error duplicating item:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to duplicate item',
              error: err.message
            });
          }
          
          // Fetch the newly created item
          Item.getByIdWithLatestPrice(newItemId, (err, newItem) => {
            if (err) {
              console.error('Error fetching duplicated item:', err);
              return res.json({
                success: true,
                message: 'Item duplicated successfully'
              });
            }
            
            // Convert image to base64
            if (newItem && newItem.item_image) {
              newItem.item_image = newItem.item_image.toString('base64');
            }
            
            res.json({
              success: true,
              message: 'Item duplicated successfully to the selected branch',
              item: newItem
            });
          });
        });
      }
    });
  } catch (error) {
    console.error('Error duplicating item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate item',
      error: error.message
    });
  }
});

module.exports = router;