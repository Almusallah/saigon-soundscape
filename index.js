const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const soundscapeRouter = require('./server/api/routes/soundscape.router');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Configure CORS
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://saigon-soundscape-officinegap.vercel.app',
      'https://saigon-soundscape-production.up.railway.app',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      callback(null, true); // Allow for now during development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));

// Basic route to test if server is running
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Create a simplified response with storage status
  const storage = {
    storageClass: 'Backblaze B2',
    working: !!(process.env.B2_APPLICATION_KEY_ID && 
             process.env.B2_APPLICATION_KEY && 
             process.env.B2_BUCKET_NAME),
    availableSpace: 'Unlimited'
  };
  
  console.log('Health endpoint called');
  
  res.json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    storage: storage,
    recordingsCount: 0,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// API routes
app.use('/api', soundscapeRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
