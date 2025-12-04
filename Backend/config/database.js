const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool instead of single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_system',
  port: process.env.DB_PORT || 3306,
  
  // Pool configuration
  waitForConnections: true,
  connectionLimit: 20, // Increased from default 10
  queueLimit: 0,
  
  // Keep connection alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // Timeout settings
  connectTimeout: 60000, // 60 seconds
  acquireTimeout: 60000, // 60 seconds
  timeout: 60000, // 60 seconds
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error getting connection from pool:', err);
    return;
  }
  
  console.log('Connected to MySQL database via pool');
  
  // Test query
  connection.ping((pingErr) => {
    if (pingErr) {
      console.error('Error pinging database:', pingErr);
    } else {
      console.log('Database ping successful');
    }
    
    // Release connection back to pool
    connection.release();
  });
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('MySQL Pool Error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

// Export the pool
module.exports = pool;