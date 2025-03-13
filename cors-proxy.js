const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://saigon-soundscape-officinegap.vercel.app',
      'https://saigon-soundscape.vercel.app',
      'http://localhost:3000',
      undefined // Allow requests with no origin (like mobile apps)
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      // For development, still allow all origins
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    storage: {
      storageClass: 'Backblaze B2',
      working: true,
      availableSpace: 'Unlimited',
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Recordings endpoint - mock for testing
app.get('/api/recordings', (req, res) => {
  res.json({
    recordings: [
      // Sample recordings - will be empty in production until users add content
    ]
  });
});

// Upload endpoint
app.post('/api/upload', express.json(), (req, res) => {
  // For testing client uploads
  res.status(201).json({ success: true, message: 'Recording received' });
});

// Start the server
app.listen(port, () => {
  console.log(`CORS proxy server running on port ${port}`);
});
