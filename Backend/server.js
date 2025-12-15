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
const overdueRoutes = require('./routes/overdue');
const branchRoutes = require('./routes/branchRoutes');

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

// ⭐ UPDATED: CORS Configuration
// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Vite default port (desktop)
  'http://localhost:5174', // Mobile app port
  'http://localhost:3000', // Create React App default
  'http://localhost:8080', // Alternative port
  'http://127.0.0.1:5173', // Localhost alternative (desktop)
  'http://127.0.0.1:5174', // Localhost alternative (mobile)
  'http://127.0.0.1:3000',
  // Add production URLs here when deploying
  // 'https://yourdomain.com',
];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Cache-Control',
    'X-Auth-Token'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Content-Disposition',
    'X-Total-Count'
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ⭐ UPDATED: Increased body size limits for FormData with multiple sponsors
// Middleware
app.use(express.json({ limit: '50mb' })); // ⭐ Increase JSON body limit
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb', // ⭐ Increase URL-encoded body limit
  parameterLimit: 100000 // ⭐ Increase parameter limit
}));

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
app.use('/api/overdue', overdueRoutes);
app.use('/api/branches', branchRoutes);

// Health check with CORS headers explicitly
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    cors: 'Configured for credentials',
    timestamp: new Date().toISOString(),
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
      '/api/chats',
      '/api/overdue',
      '/api/branches'
    ]
  });
});

// Add CORS headers manually for all routes (backup)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS Error', 
      message: 'Origin not allowed',
      allowedOrigins: allowedOrigins,
      yourOrigin: req.headers.origin
    });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// DAILY OVERDUE PAYMENTS CHECK (Option 2)
// ============================================
const db = require('./config/database');

// ⭐ ADDED: Database connection error handler
db.on('error', (err) => {
  console.error('Database connection error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed. Attempting to reconnect...');
  } else {
    throw err;
  }
});

function checkOverduePayments() {
  const now = new Date();
  console.log(`[${now.toLocaleString()}] 🔄 Checking overdue payments...`);
  
  const updateQuery = `
    UPDATE installment_payments 
    SET is_overdue = 1 
    WHERE 
      month_number >= 1
      AND due_date IS NOT NULL 
      AND due_date < CURDATE()
      AND amount_due > amount_paid
      AND is_overdue = 0
  `;
  
  db.query(updateQuery, (err, result) => {
    if (err) {
      console.error('❌ Error updating overdue payments:', err.message);
    } else {
      console.log(`[${new Date().toLocaleString()}] ✅ Check completed. ${result.affectedRows} payments marked overdue`);
    }
  });
}

// Calculate time until next 2:00 AM
function getTimeUntil2AM() {
  const now = new Date();
  const twoAM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    2, 0, 0, 0 // 2:00:00.000 AM
  );
  
  // If it's already past 2 AM today, schedule for 2 AM tomorrow
  if (now > twoAM) {
    twoAM.setDate(twoAM.getDate() + 1);
  }
  
  return twoAM.getTime() - now.getTime();
}

// Run at 2:00 AM daily
function scheduleDailyCheck() {
  const timeUntil2AM = getTimeUntil2AM();
  const nextCheck = new Date(Date.now() + timeUntil2AM);
  
  console.log(`⏰ Next overdue check at: ${nextCheck.toLocaleString()} (in ${Math.round(timeUntil2AM / 1000 / 60)} minutes)`);
  
  // Schedule first run at 2:00 AM
  setTimeout(() => {
    checkOverduePayments();
    // Then run every 24 hours
    setInterval(checkOverduePayments, 24 * 60 * 60 * 1000);
  }, timeUntil2AM);
}

// ============================================
// Start server
// ============================================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`💰 Payment System: http://localhost:${PORT}/api/payments`);
  console.log(`🕒 Time Tracking: http://localhost:${PORT}/api/duty-hours`);
  console.log(`📁 Project Management: http://localhost:${PORT}/api/projects`);
  console.log(`💬 Chat System: http://localhost:${PORT}/api/chats`);
  console.log(`📁 File Uploads: http://localhost:${PORT}/uploads`);
  console.log(`✅ All Routes: http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS configured for: ${allowedOrigins.join(', ')}`);
  console.log(`🔐 Credentials allowed: Yes`);
  
  // Start the daily overdue check scheduler
  console.log('\n🔔 Starting automated overdue payments check system...');
  scheduleDailyCheck();
  
  // Also run a check immediately on server start (optional)
  console.log('🔄 Running initial overdue check on server start...');
  checkOverduePayments();
});