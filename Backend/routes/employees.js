const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const upload = require('../middleware/upload');

// Get all employees
router.get('/', (req, res) => {
  Employee.getAll((err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }
    
    // Convert card_image buffer to base64 for frontend
    const employees = results.map(employee => ({
      ...employee,
      card_image: employee.card_image ? employee.card_image.toString('base64') : null
    }));
    
    res.json(employees);
  });
});

// Get employee by ID
router.get('/:id', (req, res) => {
  const employeeId = req.params.id;
  
  Employee.getById(employeeId, (err, results) => {
    if (err) {
      console.error('Error fetching employee:', err);
      return res.status(500).json({ error: 'Failed to fetch employee' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const employee = results[0];
    // Convert card_image buffer to base64
    employee.card_image = employee.card_image ? employee.card_image.toString('base64') : null;
    
    res.json(employee);
  });
});

// Create new employee
router.post('/', upload.single('card_image'), async (req, res) => {
  try {
    const { username, email, phone, password, user_type } = req.body;
    const card_image = req.file ? req.file.buffer : null;

    // DEBUG: Log received data
    console.log('Received employee data:', {
      username,
      email,
      phone,
      user_type,
      user_type_type: typeof user_type,
      hasPassword: !!password,
      hasImage: !!card_image
    });

    // Validate required fields
    if (!username || !email || !phone || !password || user_type === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Parse user_type to integer (remove the || 5 default)
    const parsedUserType = parseInt(user_type);

    // Check if email already exists
    Employee.checkEmailExists(email, (err, emailResults) => {
      if (err) {
        console.error('Error checking email:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (emailResults.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Check if username already exists
      Employee.checkUsernameExists(username, (err, usernameResults) => {
        if (err) {
          console.error('Error checking username:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        if (usernameResults.length > 0) {
          return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ error: 'Server error' });
          }

          // Create employee with hashed password - USE THE PROVIDED user_type
          const employeeData = {
            username,
            email,
            phone,
            card_image,
            password: hashedPassword,
            user_type: parsedUserType // Use the parsed value without default
          };

          console.log('Creating employee with data:', employeeData);

          Employee.create(employeeData, (err, results) => {
            if (err) {
              console.error('Error creating employee:', err);
              return res.status(500).json({ error: 'Failed to create employee' });
            }

            res.status(201).json({
              message: 'Employee created successfully',
              employeeId: results.insertId
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in employee creation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update employee
router.put('/:id', upload.single('card_image'), async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { username, email, phone, password, user_type } = req.body;
    const card_image = req.file ? req.file.buffer : undefined;

    // DEBUG: Log received data
    console.log('Updating employee data:', {
      id: employeeId,
      username,
      email,
      phone,
      user_type,
      user_type_type: typeof user_type,
      hasPassword: !!password,
      hasImage: !!card_image
    });

    // Validate required fields
    if (!username || !email || !phone || user_type === undefined) {
      return res.status(400).json({ error: 'All fields except password are required' });
    }

    // Parse user_type to integer (remove the || 5 default)
    const parsedUserType = parseInt(user_type);

    // Check if employee exists
    Employee.getById(employeeId, (err, results) => {
      if (err) {
        console.error('Error checking employee:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const currentEmployee = results[0];

      // Check if email exists for other users
      Employee.checkEmailExistsForOtherUsers(email, employeeId, (err, emailResults) => {
        if (err) {
          console.error('Error checking email:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        if (emailResults.length > 0) {
          return res.status(400).json({ error: 'Email already exists for another user' });
        }

        // Check if username exists for other users
        Employee.checkUsernameExistsForOtherUsers(username, employeeId, (err, usernameResults) => {
          if (err) {
            console.error('Error checking username:', err);
            return res.status(500).json({ error: 'Server error' });
          }

          if (usernameResults.length > 0) {
            return res.status(400).json({ error: 'Username already exists for another user' });
          }

          const employeeData = {
            username,
            email,
            phone,
            card_image: card_image !== undefined ? card_image : currentEmployee.card_image,
            user_type: parsedUserType // Use the parsed value without default
          };

          console.log('Updating employee with data:', employeeData);

          // If password is provided, hash it and include in update
          if (password) {
            bcrypt.hash(password, 10, (err, hashedPassword) => {
              if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ error: 'Server error' });
              }

              employeeData.password = hashedPassword;

              Employee.update(employeeId, employeeData, (err, results) => {
                if (err) {
                  console.error('Error updating employee:', err);
                  return res.status(500).json({ error: 'Failed to update employee' });
                }

                res.json({ message: 'Employee updated successfully' });
              });
            });
          } else {
            // Update without password
            Employee.update(employeeId, employeeData, (err, results) => {
              if (err) {
                console.error('Error updating employee:', err);
                return res.status(500).json({ error: 'Failed to update employee' });
              }

              res.json({ message: 'Employee updated successfully' });
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in employee update:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete employee
router.delete('/:id', (req, res) => {
  const employeeId = req.params.id;

  Employee.delete(employeeId, (err, results) => {
    if (err) {
      console.error('Error deleting employee:', err);
      return res.status(500).json({ error: 'Failed to delete employee' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  });
});

module.exports = router;