const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const upload = require('../middleware/upload');

// Login endpoint - USES DATABASE
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Login attempt for username:', username);

    // Query the database for the user
    const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
    
    db.execute(query, [username, username], async (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      console.log('Found users:', results.length);

      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const user = results[0];

      // Debug: Log what we found
      console.log('User found:', {
        id: user.id,
        username: user.username,
        hasPassword: !!user.password,
        user_type: user.user_type
      });

      // Check if user has a password
      if (!user.password) {
        console.error('User has no password in database');
        return res.status(500).json({ error: 'Account configuration error' });
      }

      // Compare the provided password with the hashed password from database
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Password comparison error:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        console.log('Password match:', isMatch);

        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Determine role based on user_type
        let role;
        if (user.user_type === 0) {
          role = 'admin';
        } else if (user.user_type >= 1 && user.user_type <= 9) {
          role = 'employee';
        } else {
          role = 'customer';
        }

        // Return user data without password
        const userResponse = {
          id: user.id,
          username: user.username,
          email: user.email,
          user_type: user.user_type,
          role: role
        };

        console.log('Login successful for:', userResponse.username);
        
        res.json({
          message: 'Login successful',
          user: userResponse
        });
      });
    });

  } catch (error) {
    console.error('Unexpected error in login:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ENABLED: Signup endpoint for customers
router.post('/signup', upload.single('card_image'), async (req, res) => {
  try {
    const { username, email, phone, password, user_type = '10' } = req.body;
    const card_image = req.file ? req.file.buffer : null;

    console.log('Received signup data:', {
      username,
      email,
      phone,
      user_type,
      hasPassword: !!password,
      hasImage: !!card_image
    });

    // Validate required fields
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Parse user_type to integer (default to 10 for customers)
    const parsedUserType = parseInt(user_type);

    // Check if email already exists
    const emailCheckQuery = 'SELECT id FROM users WHERE email = ?';
    db.execute(emailCheckQuery, [email], (emailErr, emailResults) => {
      if (emailErr) {
        console.error('Error checking email:', emailErr);
        return res.status(500).json({ error: 'Server error' });
      }

      if (emailResults.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Check if username already exists
      const usernameCheckQuery = 'SELECT id FROM users WHERE username = ?';
      db.execute(usernameCheckQuery, [username], (usernameErr, usernameResults) => {
        if (usernameErr) {
          console.error('Error checking username:', usernameErr);
          return res.status(500).json({ error: 'Server error' });
        }

        if (usernameResults.length > 0) {
          return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password using bcrypt (same as employee route)
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error('Error hashing password:', hashErr);
            return res.status(500).json({ error: 'Server error' });
          }

          // Create user with hashed password - always user_type 10 for signup
          const userData = {
            username,
            email,
            phone,
            card_image,
            password: hashedPassword,
            user_type: parsedUserType
          };

          // First, get the first available branch ID (or use 1 as default)
          const getBranchQuery = 'SELECT id FROM branches ORDER BY id LIMIT 1';
          db.execute(getBranchQuery, [], (branchErr, branchResults) => {
            if (branchErr) {
              console.error('Error getting branch:', branchErr);
              return res.status(500).json({ error: 'Server error' });
            }

            // Use the first branch ID if available, otherwise default to 1
            const defaultBranchId = branchResults.length > 0 ? branchResults[0].id : 1;
            console.log('Creating customer account with encrypted password, using branch_id:', defaultBranchId);

            // Insert into database - customers get assigned to default branch
            const insertQuery = 'INSERT INTO users (username, email, phone, card_image, password, user_type, primary_branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.execute(insertQuery, 
              [username, email, phone, card_image, hashedPassword, parsedUserType, defaultBranchId], 
              (insertErr, results) => {
                if (insertErr) {
                  console.error('Error creating user:', insertErr);
                  return res.status(500).json({ error: 'Failed to create account' });
                }

                // Return user data without password
                const userResponse = {
                  id: results.insertId,
                  username: username,
                  email: email,
                  phone: phone,
                  user_type: parsedUserType,
                  role: 'customer'
                };

                res.status(201).json({
                  message: 'Account created successfully',
                  user: userResponse
                });
              }
            );
          });
        });
      });
    });

  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (for debugging)
router.get('/users', (req, res) => {
  const query = 'SELECT id, username, email, user_type FROM users';
  
  db.execute(query, (error, results) => {
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('Total users in database:', results.length);
    res.json(results);
  });
});

// PUT /api/auth/update-id-card - Update user's ID card (for customers)
router.put('/update-id-card', upload.single('card_image'), async (req, res) => {
  try {
    const { userId, id_card } = req.body;
    const card_image = req.file ? req.file.buffer : null;

    if (!userId || !id_card) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID and ID card number are required' 
      });
    }

    // Update user's ID card
    const updateQuery = 'UPDATE users SET id_card = ?, card_image = COALESCE(?, card_image) WHERE id = ?';
    
    db.query(updateQuery, [id_card, card_image, userId], (err, result) => {
      if (err) {
        console.error('Error updating ID card:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to update ID card' 
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'ID card updated successfully'
      });
    });
  } catch (error) {
    console.error('Error in update-id-card:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// Health check
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

module.exports = router;