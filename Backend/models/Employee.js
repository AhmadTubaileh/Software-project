const db = require('../config/database');

class Employee {
  // Get accessible branches for user
  static getAccessibleBranches(userId, callback) {
    console.log(`Getting accessible branches for user ${userId}`);
    
    const query = `
      SELECT DISTINCT b.id, b.name 
      FROM branches b
      INNER JOIN user_branches ub ON b.id = ub.branch_id
      WHERE ub.user_id = ?
      ORDER BY b.name
    `;
    
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Database error in getAccessibleBranches:', err);
        callback(err, null);
      } else {
        console.log(`User ${userId} has access to ${results.length} branches`);
        callback(null, results);
      }
    });
  }

  // Get employee by ID
  static getById(id, callback) {
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
    db.query(query, [id], callback);
  }

  // Create new employee with branches
  static createWithBranches(employeeData, branchIds, callback) {
    const { username, email, phone, id_card, card_image, password, user_type, primary_branch_id } = employeeData;
    
    console.log('Starting transaction to create employee');
    
    db.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting database connection:', err);
        return callback(err);
      }
      
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error('Error starting transaction:', err);
          return callback(err);
        }
        
        // 1. Create user
        const userQuery = `
          INSERT INTO users (username, email, phone, id_card, card_image, password, user_type, primary_branch_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        console.log('Creating user with primary branch:', primary_branch_id);
        
        connection.query(userQuery, 
          [username, email, phone, id_card, card_image, password, user_type, primary_branch_id], 
          (err, result) => {
            if (err) {
              console.error('Error creating user:', err);
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }
            
            const userId = result.insertId;
            console.log(`Created user with ID: ${userId}`);
            
            // 2. Add to user_branches
            if (branchIds && branchIds.length > 0) {
              console.log(`Adding ${branchIds.length} branches to user_branches`);
              
              const branchValues = branchIds.map(branchId => [userId, branchId]);
              const branchQuery = 'INSERT INTO user_branches (user_id, branch_id) VALUES ?';
              
              connection.query(branchQuery, [branchValues], (err) => {
                if (err) {
                  console.error('Error adding user branches:', err);
                  return connection.rollback(() => {
                    connection.release();
                    callback(err);
                  });
                }
                
                connection.commit((err) => {
                  if (err) {
                    console.error('Error committing transaction:', err);
                    return connection.rollback(() => {
                      connection.release();
                      callback(err);
                    });
                  }
                  connection.release();
                  console.log('Transaction committed successfully');
                  callback(null, { insertId: userId });
                });
              });
            } else {
              connection.commit((err) => {
                if (err) {
                  console.error('Error committing transaction:', err);
                  return connection.rollback(() => {
                    connection.release();
                    callback(err);
                  });
                }
                connection.release();
                console.log('Transaction committed successfully (no branches)');
                callback(null, { insertId: userId });
              });
            }
          }
        );
      });
    });
  }

  // Update employee with branches
  static updateWithBranches(id, employeeData, branchIds, callback) {
    const { username, email, phone, id_card, card_image, user_type, primary_branch_id } = employeeData;
    
    console.log(`Starting transaction to update employee ${id}`);
    
    db.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting database connection:', err);
        return callback(err);
      }
      
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error('Error starting transaction:', err);
          return callback(err);
        }
        
        // 1. Update user
        const userQuery = `
          UPDATE users 
          SET username = ?, email = ?, phone = ?, id_card = ?, 
              card_image = ?, user_type = ?, primary_branch_id = ?
          WHERE id = ?
        `;
        const params = [username, email, phone, id_card, card_image, user_type, primary_branch_id, id];
        
        console.log('Updating user with new primary branch:', primary_branch_id);
        
        connection.query(userQuery, params, (err) => {
          if (err) {
            console.error('Error updating user:', err);
            return connection.rollback(() => {
              connection.release();
              callback(err);
            });
          }
          
          console.log(`Updated user ${id}`);
          
          // 2. Update user_branches
          const deleteQuery = 'DELETE FROM user_branches WHERE user_id = ?';
          connection.query(deleteQuery, [id], (err) => {
            if (err) {
              console.error('Error deleting old branches:', err);
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }
            
            if (branchIds && branchIds.length > 0) {
              console.log(`Adding ${branchIds.length} new branches to user_branches`);
              
              const branchValues = branchIds.map(branchId => [id, branchId]);
              const insertQuery = 'INSERT INTO user_branches (user_id, branch_id) VALUES ?';
              
              connection.query(insertQuery, [branchValues], (err) => {
                if (err) {
                  console.error('Error inserting new branches:', err);
                  return connection.rollback(() => {
                    connection.release();
                    callback(err);
                  });
                }
                
                connection.commit((err) => {
                  if (err) {
                    console.error('Error committing transaction:', err);
                    return connection.rollback(() => {
                      connection.release();
                      callback(err);
                    });
                  }
                  connection.release();
                  console.log('Update transaction committed successfully');
                  callback(null);
                });
              });
            } else {
              connection.commit((err) => {
                if (err) {
                  console.error('Error committing transaction:', err);
                  return connection.rollback(() => {
                    connection.release();
                    callback(err);
                  });
                }
                connection.release();
                console.log('Update transaction committed successfully (no branches)');
                callback(null);
              });
            }
          });
        });
      });
    });
  }

  // Update password
  static updatePassword(id, password, callback) {
    const query = 'UPDATE users SET password = ? WHERE id = ?';
    console.log(`Updating password for user ${id}`);
    db.query(query, [password, id], callback);
  }

  // Delete employee
  static delete(id, callback) {
    console.log(`Starting transaction to delete employee ${id}`);
    
    db.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting database connection:', err);
        return callback(err);
      }
      
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error('Error starting transaction:', err);
          return callback(err);
        }
        
        // 1. Delete from user_branches
        const deleteBranchesQuery = 'DELETE FROM user_branches WHERE user_id = ?';
        connection.query(deleteBranchesQuery, [id], (err) => {
          if (err) {
            console.error('Error deleting user branches:', err);
            return connection.rollback(() => {
              connection.release();
              callback(err);
            });
          }
          
          // 2. Delete from users
          const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
          connection.query(deleteUserQuery, [id], (err, results) => {
            if (err) {
              console.error('Error deleting user:', err);
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }
            
            connection.commit((err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                return connection.rollback(() => {
                  connection.release();
                  callback(err);
                });
              }
              connection.release();
              console.log('Delete transaction committed successfully');
              callback(null, results);
            });
          });
        });
      });
    });
  }

  // Check if email already exists
  static checkEmailExists(email, callback) {
    const query = 'SELECT id FROM users WHERE email = ?';
    db.query(query, [email], callback);
  }

  // Check if username already exists
  static checkUsernameExists(username, callback) {
    const query = 'SELECT id FROM users WHERE username = ?';
    db.query(query, [username], callback);
  }

  // Check if ID card already exists
  static checkIdCardExists(id_card, callback) {
    const query = 'SELECT id FROM users WHERE id_card = ?';
    db.query(query, [id_card], callback);
  }

  // Check if email exists for other users
  static checkEmailExistsForOtherUsers(email, userId, callback) {
    const query = 'SELECT id FROM users WHERE email = ? AND id != ?';
    db.query(query, [email, userId], callback);
  }

  // Check if username exists for other users
  static checkUsernameExistsForOtherUsers(username, userId, callback) {
    const query = 'SELECT id FROM users WHERE username = ? AND id != ?';
    db.query(query, [username, userId], callback);
  }

  // Check if ID card exists for other users
  static checkIdCardExistsForOtherUsers(id_card, userId, callback) {
    const query = 'SELECT id FROM users WHERE id_card = ? AND id != ?';
    db.query(query, [id_card, userId], callback);
  }

  // Check if user can assign user type
  static canAssignUserType(currentUserType, targetUserType) {
    console.log(`Checking if user type ${currentUserType} can assign type ${targetUserType}`);
    
    if (currentUserType === 0) {
      console.log('Admin can assign any type');
      return true;
    }
    
    // Senior Manager (1) can assign 2-10
    if (currentUserType === 1) {
      const canAssign = targetUserType >= 2 && targetUserType <= 10;
      console.log(`Senior Manager can assign 2-10: ${canAssign}`);
      return canAssign;
    }
    
    // Manager (2) can assign 3-10
    if (currentUserType === 2) {
      const canAssign = targetUserType >= 3 && targetUserType <= 10;
      console.log(`Manager can assign 3-10: ${canAssign}`);
      return canAssign;
    }
    
    console.log(`User type ${currentUserType} cannot assign any types`);
    return false;
  }

  // Check if user can assign branches
  static canAssignBranches(currentUserId, branchIds, callback) {
    if (branchIds.length === 0) {
      console.log('No branches to assign, access granted');
      return callback(null, true);
    }
    
    console.log(`Checking if user ${currentUserId} can assign branches: ${branchIds}`);
    
    const query = `
      SELECT COUNT(DISTINCT branch_id) as count
      FROM user_branches
      WHERE user_id = ? AND branch_id IN (?)
    `;
    
    db.query(query, [currentUserId, branchIds], (err, results) => {
      if (err) {
        console.error('Error checking branch assignment:', err);
        return callback(err, false);
      }
      
      const uniqueBranchCount = new Set(branchIds).size;
      const canAssign = results[0].count === uniqueBranchCount;
      
      console.log(`Branch assignment check: ${canAssign} (${results[0].count}/${uniqueBranchCount} branches accessible)`);
      callback(null, canAssign);
    });
  }
}

module.exports = Employee;