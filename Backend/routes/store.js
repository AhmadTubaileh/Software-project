const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/store/items - Get all items for the store with main_img and sub_imgs
router.get('/items', (req, res) => {
  console.log('🏪 Store: Fetching items with images...');
  
  const query = `
    SELECT 
      i.id,
      i.name,
      i.description,
      i.quantity,
      i.category_id,
      i.main_img,
      i.sub_img1,
      i.sub_img2,
      i.sub_img3,
      i.sub_img4,
      ip.price_cash
    FROM items i
    LEFT JOIN item_prices ip ON i.id = ip.item_id
    WHERE ip.date = (
      SELECT MAX(date) 
      FROM item_prices 
      WHERE item_id = i.id
    )
    OR ip.date IS NULL
    ORDER BY i.id DESC
  `;
  
  db.query(query, (err, results) => {
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
        img: processedImgs[0] || null, // First image as main img
        imgs: processedImgs, // All images as array
        description: item.description || '',
        quantity: item.quantity || 0,
        category_id: item.category_id || null
      };
    });
    
    res.json({
      success: true,
      items: storeProducts
    });
  });
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
      i.main_img,
      i.sub_img1,
      i.sub_img2,
      i.sub_img3,
      i.sub_img4,
      ip.price_cash
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
      img: processedImgs[0] || null,
      imgs: processedImgs,
      description: item.description || '',
      quantity: item.quantity || 0,
      category_id: item.category_id || null
    };
    
    res.json({
      success: true,
      item: storeProduct
    });
  });
});

module.exports = router;
