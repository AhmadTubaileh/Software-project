const db = require('../config/database');

class Customer {
  // Check if customer exists by ID card (in users or contract_customers)
  static checkByIdCard(idCardNumber) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          'user' as type,
          id,
          username as full_name,
          phone,
          id_card as id_card_number,
          email,
          NULL as address
        FROM users 
        WHERE id_card = ?
        
        UNION ALL
        
        SELECT 
          'contract_customer' as type,
          id,
          full_name,
          phone,
          id_card_number,
          email,
          address
        FROM contract_customers 
        WHERE id_card_number = ?
      `;
      
      db.query(query, [idCardNumber, idCardNumber], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (results.length > 0) {
          // Return the first match (users take precedence over contract_customers)
          resolve(results[0]);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Create or update customer in contract_customers table
  static createOrUpdate(customerData) {
    return new Promise((resolve, reject) => {
      // First, check if customer already exists
      const checkQuery = 'SELECT id FROM contract_customers WHERE id_card_number = ?';
      
      db.query(checkQuery, [customerData.id_card_number], (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (results.length > 0) {
          // Update existing customer
          const updateQuery = `
            UPDATE contract_customers 
            SET full_name = ?, phone = ?, address = ?, email = ?, id_card_image = ?
            WHERE id_card_number = ?
          `;
          
          db.query(updateQuery, [
            customerData.full_name,
            customerData.phone,
            customerData.address,
            customerData.email,
            customerData.id_card_image,
            customerData.id_card_number
          ], (err, result) => {
            if (err) {
              reject(err);
              return;
            }
            
            resolve({
              customerId: results[0].id,
              message: 'Customer information updated successfully'
            });
          });
        } else {
          // Create new customer
          const insertQuery = `
            INSERT INTO contract_customers 
            (full_name, phone, id_card_number, address, email, id_card_image) 
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          db.query(insertQuery, [
            customerData.full_name,
            customerData.phone,
            customerData.id_card_number,
            customerData.address,
            customerData.email,
            customerData.id_card_image
          ], (err, result) => {
            if (err) {
              reject(err);
              return;
            }
            
            resolve({
              customerId: result.insertId,
              message: 'Customer created successfully'
            });
          });
        }
      });
    });
  }

  // Get customer by ID
  static getById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM contract_customers WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results[0] || null);
      });
    });
  }
}

module.exports = Customer;