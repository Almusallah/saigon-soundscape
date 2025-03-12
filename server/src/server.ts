import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './core/database/connection';
import soundscapeRouter from './api/routes/soundscape.router';
import { errorHandler } from './api/middlewares/error.middleware';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Database connection
try {
  console.log('Attempting to connect to database...');
  connectDB();
  console.log('Database connection successful');
} catch (error) {
  console.error('Database connection failed:', error);
}

// Simple CORS configuration - allow all origins for testing
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Detailed logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Basic route to test if server is running
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api', soundscapeRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;
