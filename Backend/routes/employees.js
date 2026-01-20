const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const upload = require('../middleware/upload');
const db = require('../config/database');

// Get all employees (with access control) - EXCLUDING CUSTOMERS (user_type = 10)
router.get('/', async (req, res) => {
  try {
    console.log('GET /employees called');
    
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
    
    // For non-admin users, filter by accessible branches
    if (currentUser.user_type !== 0) {
      console.log(`Non-admin user type ${currentUser.user_type}, filtering by accessible branches...`);
      
      // Get accessible branches for current user
      const accessibleBranches = await new Promise((resolve, reject) => {
        Employee.getAccessibleBranches(currentUser.id, (err, results) => {
          if (err) {
            console.error('Error fetching accessible branches:', err);
            reject(err);
          } else {
            console.log(`Found ${results ? results.length : 0} accessible branches`);
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
      
      // Calculate minimum user type they can see
      // Users can only see employees at their level or lower (higher number)
      const minUserType = parseInt(currentUser.user_type) + 1;
      console.log(`User type ${currentUser.user_type} can see employees type >= ${minUserType}`);

      // Query to get employees in accessible branches - EXCLUDING CUSTOMERS (user_type = 10)
      const query = `
        SELECT DISTINCT
          u.id, u.username, u.email, u.phone, u.id_card, 
          u.card_image, u.user_type, u.date_joined,
          u.primary_branch_id,
          b.name as primary_branch_name,
          COALESCE(GROUP_CONCAT(DISTINCT ub.branch_id), '') as accessible_branches
        FROM users u
        LEFT JOIN branches b ON u.primary_branch_id = b.id
        LEFT JOIN user_branches ub ON u.id = ub.user_id
        WHERE (u.primary_branch_id IN (?) OR ub.branch_id IN (?))
          AND u.user_type >= ?
          AND u.user_type < 10  -- EXCLUDE CUSTOMERS (type 10)
          AND u.id != ?  -- Don't include self
        GROUP BY u.id
        ORDER BY u.user_type, u.username
      `;

      console.log('Executing query with params:', [branchIds, branchIds, minUserType, currentUser.id]);
      
      db.query(query, [branchIds, branchIds, minUserType, currentUser.id], (err, results) => {
        if (err) {
          console.error('Database error fetching filtered employees:', err);
          return res.status(500).json({ error: 'Failed to fetch employees: ' + err.message });
        }

        console.log(`Found ${results.length} employees (excluding customers) for user type ${currentUser.user_type}`);

        // Process results
        const employees = results.map(employee => {
          const emp = {
            ...employee,
            accessible_branches: employee.accessible_branches && employee.accessible_branches !== '' 
              ? employee.accessible_branches.split(',').map(Number).filter(id => !isNaN(id))
              : [],
            card_image: employee.card_image ? employee.card_image.toString('base64') : null
          };
          return emp;
        });

        res.json(employees);
      });
    } else {
      // Admin sees all employees - BUT EXCLUDING CUSTOMERS (user_type = 10)
      console.log('Admin user, fetching all employees (excluding customers)...');
      
      const query = `
        SELECT 
          u.id, u.username, u.email, u.phone, u.id_card, 
          u.card_image, u.user_type, u.date_joined,
          u.primary_branch_id,
          b.name as primary_branch_name,
          COALESCE(GROUP_CONCAT(DISTINCT ub.branch_id ORDER BY ub.branch_id), '') as accessible_branches
        FROM users u
        LEFT JOIN branches b ON u.primary_branch_id = b.id
        LEFT JOIN user_branches ub ON u.id = ub.user_id
        WHERE u.user_type < 10  -- EXCLUDE CUSTOMERS (type 10)
        GROUP BY u.id
        ORDER BY u.user_type, u.username
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          console.error('Error fetching all employees:', err);
          return res.status(500).json({ error: 'Failed to fetch employees: ' + err.message });
        }

        console.log(`Admin found ${results.length} employees (excluding customers)`);

        const employees = results.map(employee => ({
          ...employee,
          accessible_branches: employee.accessible_branches && employee.accessible_branches !== '' 
            ? employee.accessible_branches.split(',').map(Number).filter(id => !isNaN(id))
            : [],
          card_image: employee.card_image ? employee.card_image.toString('base64') : null
        }));

        res.json(employees);
      });
    }
  } catch (error) {
    console.error('Unexpected error in GET /employees:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Debug route
router.get('/debug/user', (req, res) => {
  console.log('Debug user info:');
  console.log('- req.user:', req.user);
  console.log('- req.session:', req.session);
  console.log('- req.headers:', req.headers);
  
  res.json({
    user: req.user || 'No user in session',
    sessionId: req.sessionID,
    headers: req.headers
  });
});

// Get accessible branches for current user
router.get('/branches/accessible', async (req, res) => {
  try {
    const userId = req.query.userId || (req.user ? req.user.id : 1);
    
    console.log('Fetching accessible branches for user:', userId);
    
    // First, check if user exists
    const userCheck = await new Promise((resolve) => {
      db.query('SELECT id, user_type FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
          console.error('Error checking user:', err);
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
    
    if (!userCheck) {
      console.log('User not found, returning empty array');
      return res.json([]);
    }
    
    // If admin, return all branches
    if (userCheck.user_type === 0) {
      console.log('Admin user, returning all branches');
      db.query('SELECT id, name FROM branches ORDER BY name', (err, results) => {
        if (err) {
          console.error('Error fetching all branches:', err);
          return res.status(500).json({ error: 'Failed to fetch branches' });
        }
        res.json(results);
      });
    } else {
      // Get accessible branches
      Employee.getAccessibleBranches(userId, (err, results) => {
        if (err) {
          console.error('Error fetching accessible branches:', err);
          return res.status(500).json({ error: 'Failed to fetch branches' });
        }
        
        console.log(`Found ${results.length} accessible branches for user ${userId}`);
        res.json(results || []);
      });
    }
  } catch (error) {
    console.error('Error in accessible branches route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all branches (for admin filter)
router.get('/branches/all', (req, res) => {
  console.log('Fetching all branches');
  db.query('SELECT id, name FROM branches ORDER BY name', (err, results) => {
    if (err) {
      console.error('Error fetching branches:', err);
      return res.status(500).json({ error: 'Failed to fetch branches' });
    }
    console.log(`Found ${results.length} branches`);
    res.json(results);
  });
});

// Get employee by ID - Still accessible even if customer, but employees page won't show them
router.get('/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    console.log(`Fetching employee ${employeeId}`);
    
    const query = `
      SELECT 
        u.*,
        b.name as primary_branch_name,
        COALESCE(GROUP_CONCAT(DISTINCT ub.branch_id), '') as accessible_branches
      FROM users u
      LEFT JOIN branches b ON u.primary_branch_id = b.id
      LEFT JOIN user_branches ub ON u.id = ub.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    
    db.query(query, [employeeId], (err, results) => {
      if (err) {
        console.error('Error fetching employee:', err);
        return res.status(500).json({ error: 'Failed to fetch employee' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      const employee = results[0];
      employee.card_image = employee.card_image ? employee.card_image.toString('base64') : null;
      employee.accessible_branches = employee.accessible_branches && employee.accessible_branches !== '' 
        ? employee.accessible_branches.split(',').map(Number).filter(id => !isNaN(id))
        : [];
      
      res.json(employee);
    });
  } catch (error) {
    console.error('Error in GET /:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new employee
router.post('/', upload.single('card_image'), async (req, res) => {
  try {
    console.log('=== CREATE EMPLOYEE REQUEST ===');
    console.log('Body:', req.body);
    console.log('File:', req.file ? `Uploaded ${req.file.originalname}` : 'No file');
    
    const { 
      username, email, phone, id_card, password, user_type, 
      primary_branch_id, branch_ids, currentUserId 
    } = req.body;
    
    const card_image = req.file ? req.file.buffer : null;
    
    // Use currentUserId from request or default to admin
    const currentUser = {
      id: currentUserId || 1,
      user_type: 0 // Default to admin for now
    };
    
    console.log('Current user:', currentUser);

    // Validate required fields
    const missingFields = [];
    if (!username) missingFields.push('username');
    if (!email) missingFields.push('email');
    if (!phone) missingFields.push('phone');
    if (!id_card) missingFields.push('id_card');
    if (!password) missingFields.push('password');
    if (user_type === undefined) missingFields.push('user_type');
    if (!primary_branch_id) missingFields.push('primary_branch_id');
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing: missingFields
      });
    }

    // Parse data
    const parsedUserType = parseInt(user_type);
    const parsedPrimaryBranch = parseInt(primary_branch_id);
    
    // Parse branch_ids
    let parsedBranchIds = [];
    if (branch_ids && branch_ids !== '') {
      parsedBranchIds = branch_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

    // Prevent creating customers (user_type = 10) from employees page
    if (parsedUserType === 10) {
      return res.status(400).json({ 
        error: 'Cannot create customers on employees page. Use customer management instead.'
      });
    }

    // Check user type assignment (for non-admin)
    if (currentUser.user_type !== 0) {
      if (!Employee.canAssignUserType(currentUser.user_type, parsedUserType)) {
        return res.status(403).json({ 
          error: `You cannot assign user type ${parsedUserType}. ` +
                 `Your level (${currentUser.user_type}) can only assign types ` +
                 `${currentUser.user_type === 1 ? '2-10' : '3-10'}`
        });
      }
      
      // Check branch access for non-admin
      const canAssignBranches = await new Promise((resolve) => {
        const allBranchIds = [...new Set([parsedPrimaryBranch, ...parsedBranchIds])];
        Employee.canAssignBranches(currentUser.id, allBranchIds, (err, canAssign) => {
          if (err) {
            console.error('Error checking branch access:', err);
            resolve(false);
          } else {
            resolve(canAssign);
          }
        });
      });
      
      if (!canAssignBranches) {
        return res.status(403).json({ error: 'Cannot assign branches you don\'t have access to' });
      }
    }

    // Ensure primary branch is in accessible branches
    if (!parsedBranchIds.includes(parsedPrimaryBranch)) {
      parsedBranchIds.push(parsedPrimaryBranch);
    }

    // Check for duplicates
    const checkPromises = [
      new Promise(resolve => Employee.checkIdCardExists(id_card, (err, r) => resolve(err ? [] : r))),
      new Promise(resolve => Employee.checkEmailExists(email, (err, r) => resolve(err ? [] : r))),
      new Promise(resolve => Employee.checkUsernameExists(username, (err, r) => resolve(err ? [] : r)))
    ];
    
    const [idCardResults, emailResults, usernameResults] = await Promise.all(checkPromises);
    
    if (idCardResults.length > 0) {
      return res.status(400).json({ error: 'ID Card already exists' });
    }
    if (emailResults.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (usernameResults.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create employee
    const employeeData = {
      username,
      email,
      phone,
      id_card,
      card_image,
      password: hashedPassword,
      user_type: parsedUserType,
      primary_branch_id: parsedPrimaryBranch
    };

    console.log('Creating employee with:', {
      ...employeeData,
      password: '***HIDDEN***',
      branch_ids: parsedBranchIds
    });

    Employee.createWithBranches(employeeData, parsedBranchIds, (err, results) => {
      if (err) {
        console.error('Error creating employee:', err);
        return res.status(500).json({ error: 'Failed to create employee: ' + err.message });
      }

      console.log('Employee created successfully with ID:', results.insertId);
      res.status(201).json({
        message: 'Employee created successfully',
        employeeId: results.insertId
      });
    });

  } catch (error) {
    console.error('Error in employee creation:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update employee
router.put('/:id', upload.single('card_image'), async (req, res) => {
  try {
    const employeeId = req.params.id;
    console.log(`=== UPDATE EMPLOYEE ${employeeId} ===`);
    
    const { 
      username, email, phone, id_card, password, user_type,
      primary_branch_id, branch_ids, currentUserId 
    } = req.body;
    
    const card_image = req.file ? req.file.buffer : undefined;
    
    // Parse data
    const parsedUserType = parseInt(user_type);
    const parsedPrimaryBranch = parseInt(primary_branch_id);
    
    // Parse branch_ids
    let parsedBranchIds = [];
    if (branch_ids && branch_ids !== '') {
      parsedBranchIds = branch_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

    // Prevent changing to customer (user_type = 10) from employees page
    if (parsedUserType === 10) {
      return res.status(400).json({ 
        error: 'Cannot update employee to customer on employees page. Use customer management instead.'
      });
    }

    // Get current employee
    const currentEmployee = await new Promise((resolve) => {
      Employee.getById(employeeId, (err, results) => {
        if (err || results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });

    if (!currentEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // For non-admin, check branch access
    const currentUser = {
      id: currentUserId || 1,
      user_type: 0
    };
    
    if (currentUser.user_type !== 0) {
      const canAssignBranches = await new Promise((resolve) => {
        const allBranchIds = [...new Set([parsedPrimaryBranch, ...parsedBranchIds])];
        Employee.canAssignBranches(currentUser.id, allBranchIds, (err, canAssign) => {
          if (err) {
            console.error('Error checking branch access:', err);
            resolve(false);
          } else {
            resolve(canAssign);
          }
        });
      });
      
      if (!canAssignBranches) {
        return res.status(403).json({ error: 'Cannot assign branches you don\'t have access to' });
      }
    }

    // Ensure primary branch is in accessible branches
    if (!parsedBranchIds.includes(parsedPrimaryBranch)) {
      parsedBranchIds.push(parsedPrimaryBranch);
    }

    // Check for duplicates (other users)
    const checkPromises = [
      new Promise(resolve => Employee.checkIdCardExistsForOtherUsers(id_card, employeeId, (err, r) => resolve(err ? [] : r))),
      new Promise(resolve => Employee.checkEmailExistsForOtherUsers(email, employeeId, (err, r) => resolve(err ? [] : r))),
      new Promise(resolve => Employee.checkUsernameExistsForOtherUsers(username, employeeId, (err, r) => resolve(err ? [] : r)))
    ];
    
    const [idCardResults, emailResults, usernameResults] = await Promise.all(checkPromises);
    
    if (idCardResults.length > 0) {
      return res.status(400).json({ error: 'ID Card already exists for another user' });
    }
    if (emailResults.length > 0) {
      return res.status(400).json({ error: 'Email already exists for another user' });
    }
    if (usernameResults.length > 0) {
      return res.status(400).json({ error: 'Username already exists for another user' });
    }

    // Build update data
    const employeeData = {
      username,
      email,
      phone,
      id_card,
      card_image: card_image !== undefined ? card_image : currentEmployee.card_image,
      user_type: parsedUserType,
      primary_branch_id: parsedPrimaryBranch
    };

    console.log('Updating employee with:', {
      ...employeeData,
      card_image: card_image ? '***NEW IMAGE***' : '***KEEP EXISTING***',
      branch_ids: parsedBranchIds
    });

    // Update with branches
    Employee.updateWithBranches(employeeId, employeeData, parsedBranchIds, async (err) => {
      if (err) {
        console.error('Error updating employee:', err);
        return res.status(500).json({ error: 'Failed to update employee' });
      }

      // Update password if provided
      if (password) {
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          await new Promise((resolve, reject) => {
            Employee.updatePassword(employeeId, hashedPassword, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ error: 'Failed to update password' });
        }
      }

      console.log('Employee updated successfully');
      res.json({ message: 'Employee updated successfully' });
    });

  } catch (error) {
    console.error('Error in employee update:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    console.log(`Deleting employee ${employeeId}...`);

    // First check if employee exists
    const employeeExists = await new Promise((resolve) => {
      db.query('SELECT id FROM users WHERE id = ?', [employeeId], (err, results) => {
        if (err) {
          console.error('Error checking employee:', err);
          resolve(false);
        } else {
          resolve(results.length > 0);
        }
      });
    });

    if (!employeeExists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    Employee.delete(employeeId, (err, results) => {
      if (err) {
        console.error('Error deleting employee:', err);
        return res.status(500).json({ error: 'Failed to delete employee' });
      }

      console.log('Employee deleted successfully');
      res.json({ message: 'Employee deleted successfully' });
    });
  } catch (error) {
    console.error('Error in DELETE /:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;