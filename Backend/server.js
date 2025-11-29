const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const employeeRoutes = require('./routes/employees');
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const posRoutes = require('./routes/pos');
const contractRoutes = require('./routes/contracts');
const customerRoutes = require('./routes/customers');
const paymentRoutes = require('./routes/payments');
const taskRoutes = require('./routes/tasks');
const dutyHoursRoutes = require('./routes/dutyHours');
const projectRoutes = require('./routes/projects');
const chatRoutes = require('./routes/chats');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Ensure tasks subdirectory exists
const tasksUploadsDir = path.join(__dirname, 'uploads/tasks');
if (!fs.existsSync(tasksUploadsDir)) {
  fs.mkdirSync(tasksUploadsDir, { recursive: true });
  console.log('📁 Created uploads/tasks directory');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (for task attachments) - FIXED PATH
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/duty-hours', dutyHoursRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chats', chatRoutes);

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
      '/api/duty-hours',
      '/api/projects',
      '/api/chats'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`💰 Payment System: http://localhost:${PORT}/api/payments`);
  console.log(`🕒 Time Tracking: http://localhost:${PORT}/api/duty-hours`);
  console.log(`📁 Project Management: http://localhost:${PORT}/api/projects`);
  console.log(`💬 Chat System: http://localhost:${PORT}/api/chats`);
  console.log(`📁 File Uploads: http://localhost:${PORT}/uploads`);
  console.log(`✅ All Routes: http://localhost:${PORT}/api/health`);
});