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
connectDB();

// Enhanced CORS Configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'https://saigon-soundscape-officinegap.vercel.app',
      'http://localhost:3000',
      process.env.CORS_ORIGIN
    ].filter(Boolean); // Remove any undefined values

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    allowedOrigins: [
      'https://saigon-soundscape-officinegap.vercel.app',
      'http://localhost:3000'
    ]
  });
});

// Routes
app.use('/api', soundscapeRouter);

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
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
