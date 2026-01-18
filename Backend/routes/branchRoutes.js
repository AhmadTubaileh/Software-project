const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');

// REMOVED: Admin middleware - access control is handled in frontend

// Get all branches
router.get('/', (req, res) => {
  Branch.getAll((err, results) => {
    if (err) {
      console.error('Error fetching branches:', err);
      return res.status(500).json({ error: 'Failed to fetch branches' });
    }
    res.json(results);
  });
});

// Get branch by ID
router.get('/:id', (req, res) => {
  const branchId = req.params.id;
  
  Branch.getById(branchId, (err, results) => {
    if (err) {
      console.error('Error fetching branch:', err);
      return res.status(500).json({ error: 'Failed to fetch branch' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(results[0]);
  });
});

// Create new branch
router.post('/', (req, res) => {
  try {
    const { name, address, phone, branch_img } = req.body;

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Branch name must be at least 2 characters' });
    }

    // Check if branch name already exists
    Branch.checkNameExists(name.trim(), (err, results) => {
      if (err) {
        console.error('Error checking branch name:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'Branch name already exists' });
      }

      // Create branch
      const branchData = {
        name: name.trim(),
        address: address ? address.trim() : null,
        phone: phone ? phone.trim() : null,
        branch_img: branch_img ? branch_img.trim() : ''
      };

      Branch.create(branchData, (err, results) => {
        if (err) {
          console.error('Error creating branch:', err);
          return res.status(500).json({ error: 'Failed to create branch' });
        }

        res.status(201).json({
          message: 'Branch created successfully',
          branchId: results.insertId
        });
      });
    });
  } catch (error) {
    console.error('Error in branch creation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update branch
router.put('/:id', (req, res) => {
  try {
    const branchId = req.params.id;
    const { name, address, phone, branch_img } = req.body;

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    // Check if branch exists
    Branch.getById(branchId, (err, results) => {
      if (err) {
        console.error('Error checking branch:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Branch not found' });
      }

      // Check if branch name exists for other branches
      Branch.checkNameExistsForOtherBranches(name.trim(), branchId, (err, nameResults) => {
        if (err) {
          console.error('Error checking branch name:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        if (nameResults.length > 0) {
          return res.status(400).json({ error: 'Branch name already exists for another branch' });
        }

        // Update branch
        const branchData = {
          name: name.trim(),
          address: address ? address.trim() : null,
          phone: phone ? phone.trim() : null,
          branch_img: branch_img ? branch_img.trim() : ''
        };

        Branch.update(branchId, branchData, (err, results) => {
          if (err) {
            console.error('Error updating branch:', err);
            return res.status(500).json({ error: 'Failed to update branch' });
          }

          res.json({ message: 'Branch updated successfully' });
        });
      });
    });
  } catch (error) {
    console.error('Error in branch update:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete branch
router.delete('/:id', (req, res) => {
  const branchId = req.params.id;

  Branch.delete(branchId, (err, results) => {
    if (err) {
      console.error('Error deleting branch:', err);
      return res.status(500).json({ error: 'Failed to delete branch' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({ message: 'Branch deleted successfully' });
  });
});

module.exports = router;