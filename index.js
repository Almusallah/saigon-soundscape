const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Initialize express app
const app = express();

// Configure CORS properly
app.use(cors({
  origin: ['https://saigon-soundscape-officinegap.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add preflight OPTIONS handling
app.options('*', cors());

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
  fileFilter: function (req, file, cb) {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// In-memory storage for recordings
const recordings = [];

// Create uploads directory for local files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Handle file upload
async function handleFileUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file uploaded'
      });
    }

    console.log('File received:', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Generate a unique filename
    const fileName = `recordings/${uuidv4()}${path.extname(req.file.originalname)}`;
    
    // Create file URL (local for now)
    const fileUrl = `/api/uploads/${req.file.filename}`;
    
    // Copy to uploads directory
    fs.copyFileSync(req.file.path, path.join(uploadsDir, req.file.filename));

    // Create recording entry
    const recordingId = uuidv4();
    const newRecording = {
      id: recordingId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      description: req.body.description || '',
      fileUrl: fileUrl,
      location: {
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng)
      },
      uploadedAt: new Date().toISOString()
    };

    // Store recording in memory
    recordings.push(newRecording);

    // Clean up temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkErr) {
      console.error('Failed to remove temp file:', unlinkErr);
    }

    // Return success
    res.status(201).json({
      success: true,
      message: 'Recording uploaded successfully',
      data: newRecording
    });
  } catch (error) {
    console.error('Upload handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing upload',
      error: error.message
    });
  }
}

// Middleware for logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Saigon Soundscape API is running',
    endpoints: ['/api/health', '/api/recordings'],
    storageType: 'local' // Always use local storage for now
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    storageType: 'local',
    environment: {
      hasB2KeyId: !!process.env.B2_APPLICATION_KEY_ID,
      hasB2AppKey: !!process.env.B2_APPLICATION_KEY,
      hasB2BucketId: !!process.env.B2_BUCKET_ID,
      hasB2BucketName: !!process.env.B2_BUCKET_NAME,
      nodeEnv: process.env.NODE_ENV
    },
    cors: {
      allowedOrigins: ['https://saigon-soundscape-officinegap.vercel.app', 'http://localhost:3000']
    }
  });
});

// File upload endpoint
app.post('/api/recordings', (req, res, next) => {
  console.log('Received upload request');
  upload.single('audio')(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    handleFileUpload(req, res).catch(next);
  });
});

// Get all recordings
app.get('/api/recordings', (req, res) => {
  res.json({
    success: true,
    count: recordings.length,
    data: recordings
  });
});

// Serve uploaded files
app.get('/api/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
