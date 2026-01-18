const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, name, slug
      FROM categories
      ORDER BY name ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch categories',
          error: err.message
        });
      }
      
      res.json({
        success: true,
        categories: results
      });
    });
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/categories - Create a new category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    // Generate slug from name (lowercase, replace spaces with hyphens, remove special chars)
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special characters
      .replace(/\s+/g, '-')       // Replace spaces with hyphens
      .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
      .trim();
    
    // Check if category name or slug already exists
    const checkQuery = `
      SELECT id FROM categories 
      WHERE name = ? OR slug = ?
    `;
    
    db.query(checkQuery, [name.trim(), slug], (err, existing) => {
      if (err) {
        console.error('Error checking existing category:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to check existing category',
          error: err.message
        });
      }
      
      if (existing && existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
      
      // Insert new category
      const insertQuery = `
        INSERT INTO categories (name, slug)
        VALUES (?, ?)
      `;
      
      db.query(insertQuery, [name.trim(), slug], (err, result) => {
        if (err) {
          console.error('Error creating category:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: err.message
          });
        }
        
        res.status(201).json({
          success: true,
          message: 'Category created successfully',
          category: {
            id: result.insertId,
            name: name.trim(),
            slug: slug
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in POST /categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/categories/:id - Delete a category (optional)
router.delete('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if category is being used by any items
    const checkItemsQuery = `
      SELECT COUNT(*) as count FROM items WHERE category_id = ?
    `;
    
    db.query(checkItemsQuery, [categoryId], (err, results) => {
      if (err) {
        console.error('Error checking category usage:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to check category usage'
        });
      }
      
      const itemCount = results[0].count;
      
      if (itemCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category. It is being used by ${itemCount} item(s)`
        });
      }
      
      // Delete the category
      const deleteQuery = `DELETE FROM categories WHERE id = ?`;
      
      db.query(deleteQuery, [categoryId], (err, result) => {
        if (err) {
          console.error('Error deleting category:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to delete category'
          });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Category not found'
          });
        }
        
        res.json({
          success: true,
          message: 'Category deleted successfully'
        });
      });
    });
  } catch (error) {
    console.error('Error in DELETE /categories/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
