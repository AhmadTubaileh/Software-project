const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const upload = require('../middleware/upload');

// Helper: convert item image buffer to base64 (if exists)
function serializeItem(item) {
  if (item && item.item_image) {
    try {
      item.item_image = Buffer.from(item.item_image).toString('base64');
    } catch (error) {
      console.error('Error serializing image:', error);
      item.item_image = null;
    }
  }
  return item;
}

// GET /api/items
router.get('/', (req, res) => {
  console.log('GET /api/items - Fetching all items');
  
  Item.getAll((err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch items',
        error: err.message 
      });
    }
    
    console.log(`Found ${results.length} items`);
    const items = results.map(serializeItem);
    res.json(items);
  });
});

// POST /api/items
router.post('/', upload.single('item_image'), (req, res) => {
  console.log('POST /api/items - Creating new item');
  
  try {
    // Check if we have the required fields
    if (!req.body.name || !req.body.description || req.body.price_cash === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price_cash'
      });
    }

    const data = req.body;
    console.log('Received form data:', data);
    console.log('Received file:', req.file ? `Yes - ${req.file.originalname}` : 'No');

    // Parse form data - handle checkboxes properly
    const available = data.available === '1' || data.available === 'true' || data.available === true || data.available === 'on';
    const installment = data.installment === '1' || data.installment === 'true' || data.installment === true || data.installment === 'on';

    const itemData = {
      name: data.name || '',
      description: data.description || '',
      price_cash: parseFloat(data.price_cash) || 0,
      price_installment_total: data.price_installment_total ? parseFloat(data.price_installment_total) : null,
      installment_months: data.installment_months ? parseInt(data.installment_months) : null,
      installment_per_month: data.installment_per_month ? parseFloat(data.installment_per_month) : null,
      available: available ? 1 : 0,
      quantity: parseInt(data.quantity) || 0,
      installment: installment ? 1 : 0,
      item_image: req.file ? req.file.buffer : null
    };

    console.log('Processed item data:', itemData);

    Item.create(itemData, (err, result) => {
      if (err) {
        console.error('Database insert error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to add item to database',
          error: err.message
        });
      }

      if (!result || !result.insertId) {
        console.error('No insert ID returned');
        return res.status(500).json({
          success: false,
          message: 'Insert failed - no insert ID returned'
        });
      }

      console.log('Item created with ID:', result.insertId);

      // Fetch the newly created item
      Item.getById(result.insertId, (err2, results) => {
        if (err2) {
          console.error('Error fetching created item:', err2);
          // Still return success since item was created
          return res.status(201).json({
            success: true,
            message: 'Item created successfully',
            itemId: result.insertId
          });
        }

        if (!results || results.length === 0) {
          console.log('Item created but not found in fetch');
          return res.status(201).json({
            success: true,
            message: 'Item created successfully',
            itemId: result.insertId
          });
        }

        const newItem = serializeItem(results[0]);
        console.log('Successfully created item:', newItem.name);
        
        res.status(201).json({
          success: true,
          message: 'Item created successfully',
          item: newItem
        });
      });
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing request',
      error: error.message
    });
  }
});

// PUT /api/items/:id
router.put('/:id', upload.single('item_image'), (req, res) => {
  console.log(`PUT /api/items/${req.params.id} - Updating item`);
  
  try {
    if (!req.body.name || !req.body.description || req.body.price_cash === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const data = req.body;
    const available = data.available === '1' || data.available === 'true' || data.available === true || data.available === 'on';
    const installment = data.installment === '1' || data.installment === 'true' || data.installment === true || data.installment === 'on';

    const itemData = {
      name: data.name,
      description: data.description,
      price_cash: parseFloat(data.price_cash),
      price_installment_total: data.price_installment_total ? parseFloat(data.price_installment_total) : null,
      installment_months: data.installment_months ? parseInt(data.installment_months) : null,
      installment_per_month: data.installment_per_month ? parseFloat(data.installment_per_month) : null,
      available: available ? 1 : 0,
      quantity: parseInt(data.quantity) || 0,
      installment: installment ? 1 : 0,
      item_image: req.file ? req.file.buffer : undefined
    };

    Item.update(req.params.id, itemData, (err) => {
      if (err) {
        console.error('Database update error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to update item',
          error: err.message
        });
      }

      Item.getById(req.params.id, (err2, results) => {
        if (err2) {
          console.error('Error fetching updated item:', err2);
          return res.status(200).json({
            success: true,
            message: 'Item updated successfully'
          });
        }

        if (!results || results.length === 0) {
          return res.status(200).json({
            success: true,
            message: 'Item updated successfully'
          });
        }

        const updatedItem = serializeItem(results[0]);
        res.json({
          success: true,
          message: 'Item updated successfully',
          item: updatedItem
        });
      });
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating item',
      error: error.message
    });
  }
});

// DELETE /api/items/:id
router.delete('/:id', (req, res) => {
  console.log(`DELETE /api/items/${req.params.id}`);
  
  Item.delete(req.params.id, (err) => {
    if (err) {
      console.error('Database delete error:', err);
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
});

module.exports = router;