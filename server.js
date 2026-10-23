require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Connect to MongoDB asynchronously without crashing if starting up
connectDB().catch(err => console.error('Initial DB connection attempt:', err.message));

const app = express();

// Ensure DB is connected for incoming API requests
app.use(async (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/auth') || req.url.startsWith('/feedback') || req.url.startsWith('/issues') || req.url.startsWith('/menu') || req.url.startsWith('/admin')) {
    try {
      await connectDB();
    } catch (e) {}
  }
  next();
});

// Middlewares
app.use(cors({
  origin: '*', // Allow frontend from any local origin (e.g., file://, localhost:3000, 127.0.0.1:5500)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const path = require('path');
const fs = require('fs');

// Serve static frontend assets from public/ folder (Full-Stack Deployment Support)
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// API Root Info Route
app.get('/api', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'VGU Mess Review, Feedback & Quality Analytics Backend API',
    university: 'Vivekananda Global University (VGU), Jaipur',
    database: 'MongoDB (Mongoose)',
    accreditation: "NAAC Grade 'A+' Accredited",
    messCommitteeHead: 'Sujeet Kumar (sujeetsinghaniajournalist@gmail.com)',
    endpoints: {
      health: 'GET /api/health',
      menu: 'GET /api/menu',
      feedback: 'GET|POST /api/feedback',
      issues: 'GET|POST /api/issues',
      auth: 'POST /api/auth/login, POST /api/auth/reset-password',
      adminStats: 'GET /api/admin/stats',
      adminRecords: 'GET /api/admin/records',
    },
    operatingHours: {
      breakfast: '7:30 AM – 8:15 AM',
      lunch: '12:00 PM – 1:50 PM',
      eveningSnacks: '4:30 PM – 5:20 PM',
      dinner: '7:00 PM – 8:30 PM',
    }
  });
});

// Root Route: Serve Portal UI if available, else API info
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.redirect('/api');
});

app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  res.json({
    status: 'OK',
    serverTime: new Date().toISOString(),
    mongoDb: {
      status: states[dbState] || 'Unknown',
      connected: dbState === 1,
      databaseName: mongoose.connection.name || 'vgu_mess_db',
    }
  });
});

// Mount Modular API Routes (Supports both standard express and Vercel serverless rewrites)
app.use(['/api/auth', '/auth'], require('./routes/authRoutes'));
app.use(['/api/feedback', '/feedback'], require('./routes/feedbackRoutes'));
app.use(['/api/issues', '/issues'], require('./routes/issueRoutes'));
app.use(['/api/menu', '/menu'], require('./routes/menuRoutes'));
app.use(['/api/admin', '/admin'], require('./routes/adminRoutes'));

// SPA fallback for HTML frontend (All non-API routes serve index.html)
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/auth') || req.url.startsWith('/feedback') || req.url.startsWith('/issues') || req.url.startsWith('/menu') || req.url.startsWith('/admin')) return next();
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// 404 Route Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found on VGU Mess Backend.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[UNCAUGHT ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error on VGU Mess Backend.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` VGU MESS REVIEW & FEEDBACK PORTAL — MONGODB BACKEND SERVER    `);
    console.log(` Vivekananda Global University, Jaipur (NAAC Grade 'A+')        `);
    console.log(` Running on: http://localhost:${PORT}                             `);
    console.log(` Authorized Head: Sujeet Kumar (sujeetsinghaniajournalist@gmail.com) `);
    console.log(`================================================================`);
  });
}

module.exports = app;
