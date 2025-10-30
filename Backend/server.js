const express = require('express');
const cors = require('cors');
require('dotenv').config();

const employeeRoutes = require('./routes/employees');
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const posRoutes = require('./routes/pos'); // ✅ POS routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/pos', posRoutes); // ✅ POS routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    routes: ['/api/employees', '/api/auth', '/api/items', '/api/pos']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🛒 POS System: http://localhost:${PORT}/api/pos/items`);
});