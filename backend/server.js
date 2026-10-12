import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Student Attendance & Performance Monitoring System API (MERN Backend)',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: {
      auth: '/api/auth/login, /api/auth/health, /api/auth/me',
      admin: '/api/admin/stats, /api/admin/students, /api/admin/faculty, /api/admin/classes, /api/admin/subjects, /api/admin/attendance-report, /api/admin/performance-report',
      faculty: '/api/faculty/assigned, /api/faculty/students, /api/faculty/attendance, /api/faculty/marks',
      student: '/api/student/dashboard',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
  });
});

// Start Server
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 MERN Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 Ready to handle Student ERP requests`);
    console.log(`=======================================================`);
  });
}

startServer();
