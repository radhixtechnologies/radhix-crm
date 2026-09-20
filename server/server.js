const express = require('express'); // Force restart - SMTP port fix
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { startReminderCron } = require('./utils/reminderCron');

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',           // Local Vite dev server
  'http://localhost:5174',           // Local Vite dev server (alternative)
  'http://localhost:3000',           // Alternative local port
  'https://crm-1-481e.onrender.com', // Render frontend
  'https://crm.zynextro.com',        // Custom domain (if you have one for frontend)
  // Add more origins as needed
];

// CORS middleware with dynamic origin checking
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Serve static files (uploads) - MUST be before routes
// Use root-level uploads folder, not server/uploads
const uploadsPath = path.join(__dirname, '..', 'uploads');
console.log(`[Server] ==========================================`);
console.log(`[Server] Static Files Configuration:`);
console.log(`[Server] __dirname: ${__dirname}`);
console.log(`[Server] Uploads path: ${uploadsPath}`);
console.log(`[Server] Serving /uploads -> ${uploadsPath}`);
console.log(`[Server] Uploads path exists: ${fs.existsSync(uploadsPath)}`);
console.log(`[Server] ==========================================`);

// Verify uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  console.log(`[Server] Creating uploads directory: ${uploadsPath}`);
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Verify invoices subdirectory exists
const invoicesPath = path.join(uploadsPath, 'invoices');
if (!fs.existsSync(invoicesPath)) {
  console.log(`[Server] Creating invoices directory: ${invoicesPath}`);
  fs.mkdirSync(invoicesPath, { recursive: true });
}

// Verify exit-documents subdirectory exists
const exitDocsPath = path.join(uploadsPath, 'exit-documents');
if (!fs.existsSync(exitDocsPath)) {
  console.log(`[Server] Creating exit-documents directory: ${exitDocsPath}`);
  fs.mkdirSync(exitDocsPath, { recursive: true });
}

// Serve static files with proper headers
// IMPORTANT: This must be before any API routes to avoid conflicts
app.use('/uploads', (req, res, next) => {
  console.log(`[Static Files] Request for: ${req.path}`);
  console.log(`[Static Files] Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  next();
}, express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    console.log(`[Static Files] Serving file: ${filePath}`);
    // Set proper content type for PDFs
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(filePath) + '"');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      console.log(`[Static Files] PDF headers set for: ${path.basename(filePath)}`);
    }
  },
  // Enable directory listing for debugging (disable in production)
  dotfiles: 'ignore',
  index: false,
  fallthrough: true, // Allow fallthrough to next middleware if file not found
}));

// Helper function to serve PDF files
const serveInvoicePDF = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsPath, 'invoices', filename);

  console.log(`[PDF Route] Direct PDF request: ${filename}`);
  console.log(`[PDF Route] Uploads path: ${uploadsPath}`);
  console.log(`[PDF Route] File path: ${filePath}`);
  console.log(`[PDF Route] File exists: ${fs.existsSync(filePath)}`);

  // Try alternative path (root-level uploads) if main path doesn't exist
  const altPath = path.join(__dirname, '..', 'uploads', 'invoices', filename);
  console.log(`[PDF Route] Alternative path: ${altPath}`);
  console.log(`[PDF Route] Alternative path exists: ${fs.existsSync(altPath)}`);

  // Use the path that exists
  const finalPath = fs.existsSync(filePath) ? filePath : (fs.existsSync(altPath) ? altPath : filePath);
  console.log(`[PDF Route] Using path: ${finalPath}`);

  if (fs.existsSync(finalPath)) {
    const stats = fs.statSync(finalPath);
    console.log(`[PDF Route] Serving PDF: ${filename} (${stats.size} bytes)`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.sendFile(path.resolve(finalPath), (err) => {
      if (err) {
        console.error(`[PDF Route] Error sending file:`, err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error serving PDF file',
            error: err.message,
          });
        }
      } else {
        console.log(`[PDF Route] PDF sent successfully: ${filename}`);
      }
    });
  } else {
    console.error(`[PDF Route] File not found at: ${filePath}`);
    console.error(`[PDF Route] Alternative path also not found: ${altPath}`);

    // List files in both possible directories for debugging
    const dirsToCheck = [
      path.join(uploadsPath, 'invoices'),
      path.join(__dirname, '..', 'uploads', 'invoices'),
    ];

    const availableFiles = [];
    dirsToCheck.forEach(dir => {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          console.log(`[PDF Route] Available files in ${dir}:`, files);
          availableFiles.push(...files);
        } catch (dirErr) {
          console.error(`[PDF Route] Error reading directory ${dir}:`, dirErr);
        }
      } else {
        console.log(`[PDF Route] Directory does not exist: ${dir}`);
      }
    });

    res.status(404).json({
      success: false,
      message: 'PDF file not found',
      filename,
      checkedPaths: [filePath, altPath],
      uploadsPath,
      availableFiles: [...new Set(availableFiles)].slice(0, 10),
    });
  }
};

// Direct PDF serving route as fallback (after static middleware)
// This will catch requests if express.static doesn't find the file
app.get('/uploads/invoices/:filename', serveInvoicePDF);

// Also handle /api/uploads/invoices/:filename for API-prefixed requests
app.get('/api/uploads/invoices/:filename', serveInvoicePDF);

// Test route to verify static file serving
app.get('/api/test-pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsPath, 'invoices', filename);
  console.log(`[Server] Test PDF request: ${filename}`);
  console.log(`[Server] File path: ${filePath}`);
  console.log(`[Server] File exists: ${fs.existsSync(filePath)}`);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`[Server] File size: ${stats.size} bytes`);
    res.json({
      success: true,
      filename,
      path: filePath,
      size: stats.size,
      url: `/uploads/invoices/${filename}`,
      accessibleUrl: `http://localhost:5000/uploads/invoices/${filename}`,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'File not found',
      filename,
      path: filePath,
    });
  }
});

// Body parsing middleware - must come before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log requests for debugging
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`${req.method} ${req.path} - Content-Type: ${req.headers['content-type']}`);
  }
  next();
});

// Routes. Keep authentication available even when an optional module is incomplete.
const mountRoute = (path, routeFile) => {
  try {
    app.use(path, require(routeFile));
  } catch (error) {
    console.warn(`[Server] Skipping ${path}: ${error.message}`);
  }
};

mountRoute('/api/auth', './routes/auth');
mountRoute('/api/users', './routes/users');
// Keep profile lookup available while the larger employee module is repaired.
const employeeProfileAuth = require('./middlewares/auth').protect;
const employeeCreateAuth = require('./middlewares/auth');
const employeeProfileController = require('./controllers/employeeProfileController');
const employeeController = require('./controllers/employeeController');
app.get('/api/employees/me', employeeProfileAuth, employeeProfileController.getMyProfile);
app.post(
  '/api/employees',
  employeeCreateAuth.protect,
  employeeCreateAuth.checkModuleAccess('employee'),
  employeeCreateAuth.authorize('super_admin', 'admin'),
  employeeController.createEmployee
);
mountRoute('/api/employees', './routes/employees');
app.get('/api/employees/:id', employeeProfileAuth, employeeProfileController.getEmployeeProfile);
mountRoute('/api/attendance', './routes/attendance');
mountRoute('/api/finance', './routes/finance');
mountRoute('/api/payroll', './routes/payroll');
mountRoute('/api/sales/dashboard', './routes/salesDashboard');
mountRoute('/api/sales', './routes/sales');
mountRoute('/api/hrm', './routes/hrm');
mountRoute('/api/analytics', './routes/analytics');
mountRoute('/api/dashboard', './routes/dashboard');
mountRoute('/api/notifications', './routes/notifications');
mountRoute('/api/reports', './routes/reports');
mountRoute('/api/performance', './routes/performance');
mountRoute('/api/search', './routes/search');
mountRoute('/api/inventory/products', './routes/products');
mountRoute('/api/contacts', './routes/contacts');
mountRoute('/api/campaigns', './routes/campaigns');
mountRoute('/api/marketing', './routes/marketing');
mountRoute('/api/tickets', './routes/tickets');
mountRoute('/api/calendar', './routes/calendar');
mountRoute('/api/activities', './routes/activities');
mountRoute('/api/deals', './routes/deals');
mountRoute('/api/pipeline-stages', './routes/pipelineStages');


// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Zynextro CRM API is running' });
});

// Note: Cron jobs are now started in startServer() function after server starts

// Error handling middleware (must be last)
const errorHandler = require('./utils/errorHandler');
app.use(errorHandler);

// Start server function
const startServer = async () => {
  try {
    // Connect to database first - REQUIRED for the application to work
    console.log('Connecting to database...');
    try {
      await connectDB();
      console.log('✓ Database connected successfully');
    } catch (dbError) {
      console.error('✗ Database connection failed!');
      console.error('   Error:', dbError.message);
      console.error('   The server cannot start without a database connection.');
      console.error('   Please ensure MongoDB is running and MONGODB_URI is correct.');
      console.error('');
      console.error('   To fix this:');
      console.error('   1. Make sure MongoDB is installed and running');
      console.error('   2. Check your .env file has MONGODB_URI set correctly');
      console.error('   3. For local MongoDB: mongodb://localhost:27017/zynextro-crm');
      console.error('   4. For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database');
      console.error('');
      // Exit on DB failure - database is required for the application
      process.exit(1);
    }

    // Get port and host from environment or use defaults
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';

    // Start server
    const server = app.listen(PORT, HOST, () => {
      console.log('========================================');
      console.log('✓ Server started successfully!');
      console.log(`✓ Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
      console.log(`✓ API available at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api`);
      console.log(`✓ Health check: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/health`);
      console.log('========================================');

      // Start reminder cron job
      try {
        if (typeof startReminderCron === 'function') {
          startReminderCron();
          console.log('✓ Reminder cron job started');
        } else {
          console.warn('⚠ Warning: startReminderCron is not available');
        }
      } catch (cronError) {
        console.error('⚠ Warning: Failed to start reminder cron job:', cronError.message);
        console.error('   Server will continue without cron jobs');
      }

      // Start activity reminders cron job
      try {
        const cron = require('node-cron');
        const activityReminders = require('./jobs/activityReminders');

        // Run every minute for faster response
        cron.schedule('* * * * *', activityReminders);
        console.log('✅ Activity reminders cron job started (runs every minute)');
      } catch (cronError) {
        console.error('⚠ Warning: Failed to start activity reminders cron:', cronError.message);
        console.error('   Server will continue without activity reminders');
      }

      // Start cron jobs if enabled
      if (process.env.ENABLE_CRON_JOBS === 'true') {
        try {
          const { leaveAccrualJob, resetLeaveBalancesJob } = require('./jobs/leaveAccrualJob');
          const { documentExpiryJob } = require('./jobs/documentExpiryJob');

          leaveAccrualJob.start();
          resetLeaveBalancesJob.start();
          documentExpiryJob.start();

          console.log('✓ Cron jobs started');
        } catch (cronError) {
          console.error('⚠ Warning: Failed to start cron jobs:', cronError.message);
          console.error('   Server will continue without cron jobs');
        }
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`✗ Error: Port ${PORT} is already in use`);
        console.error(`   Please use a different port or stop the process using port ${PORT}`);
        console.error(`   You can set PORT in .env file to use a different port`);
      } else {
        console.error('✗ Server error:', error);
      }
      process.exit(1);
    });

    // Handle process termination gracefully
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('✗ Failed to start server:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Start the server
startServer();

