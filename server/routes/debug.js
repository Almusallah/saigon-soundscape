const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Debug config endpoint
router.get('/config', (req, res) => {
  res.json({
    apiUrl: process.env.API_URL || 'Not set',
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || 'Not available',
    corsHeaders: req.headers,
    clientOrigin: req.headers.origin || 'Not set',
    mongoConnection: mongoose.connection ? {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    } : 'Not connected',
    b2Config: {
      bucketName: process.env.B2_BUCKET_NAME || 'Not set',
      endpoint: process.env.B2_ENDPOINT || 'Not set',
      region: process.env.B2_REGION || 'Not set'
    }
  });
});

// DB test endpoint
router.get('/db-test', async (req, res) => {
  try {
    // Check MongoDB connection
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.json({
        connected: false,
        readyState: mongoose.connection ? mongoose.connection.readyState : 'No connection',
        message: 'Database not connected'
      });
    }
    
    // List available models
    const models = Object.keys(mongoose.models);
    
    res.json({
      connected: true,
      readyState: mongoose.connection.readyState,
      models: models,
      message: 'Database connected'
    });
  } catch (error) {
    console.error('Error in DB test:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

module.exports = router;
