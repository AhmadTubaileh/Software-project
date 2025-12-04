const db = require('../config/database');

class Customer {
  // Enhanced verification that searches contract_customers, contract_sponsors, and users
  static checkByIdCard(idCardNumber, targetType = 'customer') {
    return new Promise((resolve, reject) => {
      const query = `
        -- Search in contract_customers
        SELECT 
          'contract_customer' as type,
          id,
          full_name,
          phone,
          id_card_number,
          email,
          address,
          id_card_image,
          'contract_customers' as source_table
        FROM contract_customers 
        WHERE id_card_number = ?
        
        UNION ALL
        
        -- Search in contract_sponsors  
        SELECT 
          'contract_sponsor' as type,
          id,
          full_name,
          phone,
          id_card_number,
          NULL as email,
          address,
          id_card_image,
          'contract_sponsors' as source_table
        FROM contract_sponsors 
        WHERE id_card_number = ?
        
        UNION ALL
        
        -- Search in users
        SELECT 
          'user' as type,
          id,
          username as full_name,
          phone,
          id_card as id_card_number,
          email,
          NULL as address,
          card_image as id_card_image,
          'users' as source_table
        FROM users 
        WHERE id_card = ?
      `;
      
      db.query(query, [idCardNumber, idCardNumber, idCardNumber], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (results.length > 0) {
          // Convert BLOB image to base64 if it exists
          const customer = results[0];
          if (customer.id_card_image) {
            try {
              customer.id_card_image = Buffer.from(customer.id_card_image).toString('base64');
            } catch (error) {
              console.error('Error serializing existing customer image:', error);
              customer.id_card_image = null;
            }
          }
          resolve(customer);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Create or update customer in contract_customers table (original functionality)
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