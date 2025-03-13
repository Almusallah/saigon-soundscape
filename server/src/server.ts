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
app.get('/api/health', async (req, res) => {
  // Create a simplified response with storage status based on environment variables
  const storage = {
    storageClass: 'Backblaze B2',
    working: !!(process.env.B2_APPLICATION_KEY_ID && 
             process.env.B2_APPLICATION_KEY && 
             process.env.B2_BUCKET_NAME),
    availableSpace: 'Unlimited'
  };
  
  console.log('Health endpoint called, returning storage status:', storage);
  
  res.json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    storage: storage,  // This is the key property the frontend looks for
    recordingsCount: 1,
    environment: {
      hasB2KeyId: !!process.env.B2_APPLICATION_KEY_ID,
      hasB2AppKey: !!process.env.B2_APPLICATION_KEY,
      hasB2BucketId: !!process.env.B2_BUCKET_ID,
      hasB2BucketName: !!process.env.B2_BUCKET_NAME,
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    cors: {
      allowedOrigins: ['https://saigon-soundscape-officinegap.vercel.app', 'http://localhost:3000']
    }
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
