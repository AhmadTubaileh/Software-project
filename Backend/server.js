const express = require('express');
const cors = require('cors');
require('dotenv').config();

const employeeRoutes = require('./routes/employees');
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const posRoutes = require('./routes/pos');
const contractRoutes = require('./routes/contracts');
const customerRoutes = require('./routes/customers');
const paymentRoutes = require('./routes/payments');
const taskRoutes = require('./routes/tasks');
const dutyHoursRoutes = require('./routes/dutyHours'); // NEW

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
app.use('/api/pos', posRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/duty-hours', dutyHoursRoutes); // NEW

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    routes: [
      '/api/employees', 
      '/api/auth', 
      '/api/items', 
      '/api/pos', 
      '/api/contracts', 
      '/api/customers', 
      '/api/payments',
      '/api/tasks',
      '/api/duty-hours' // NEW
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`💰 Payment System: http://localhost:${PORT}/api/payments`);
  console.log(`🕒 Time Tracking: http://localhost:${PORT}/api/duty-hours`); // NEW
  console.log(`✅ All Routes: http://localhost:${PORT}/api/health`);
});