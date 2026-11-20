require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { runAutomatedExpiryCheck } = require('./services/membershipService');
const { processDailyReminders } = require('./services/reminderService');
const seed = require('./seeds/seedData');
const { User, Student } = require('./models');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for uploaded student photos
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Samurai Attendance & Fee Management System',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Serve frontend static build if built
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  // Auto-seed if database is fresh
  try {
    const userCount = await User.countDocuments();
    const studentCount = await Student.countDocuments();
    if (userCount === 0 || studentCount === 0) {
      console.log('⚡ [Startup] Database is empty. Running initial high-fidelity seed...');
      await seed();
    }
  } catch (err) {
    console.error('Error during auto-seed check:', err.message);
  }

  // Schedule automated background jobs
  cron.schedule('5 0 * * *', async () => {
    console.log('⏰ [Cron] Running automated midnight membership expiry check & reminders...');
    try {
      await runAutomatedExpiryCheck();
      await processDailyReminders();
    } catch (cronErr) {
      console.error('[Cron] Error during scheduled job:', cronErr.message);
    }
  });

  // Also run expiry check once on server startup
  setTimeout(async () => {
    try {
      await runAutomatedExpiryCheck();
      await processDailyReminders();
    } catch (e) {
      console.warn('Startup reminder check warning:', e.message);
    }
  }, 2000);

  const server = app.listen(PORT, () => {
    console.log(`🥋 Samurai Attendance & Fee API is running on http://localhost:${PORT}`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
