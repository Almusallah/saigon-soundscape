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
  exposedHeaders: ['Content-Disposition'],
  credentials: true
}));

// Add preflight OPTIONS handling
app.options('*', cors());

// Set up directories
const tempDir = path.join(__dirname, 'temp');
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure directories exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    cb(null, uuidv4() + path.extname(file.originalname));
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
let recordings = [];

// Middleware for logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Saigon Soundscape API is running',
    endpoints: ['/api/health', '/api/recordings', '/api/uploads/:filename']
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    recordingsCount: recordings.length,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    cors: {
      allowedOrigins: ['https://saigon-soundscape-officinegap.vercel.app', 'http://localhost:3000']
    }
  });
});

// File upload endpoint
app.post('/api/recordings', (req, res) => {
  upload.single('audio')(req, res, async function(err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No audio file uploaded'
        });
      }

      console.log('File received:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
      // Move file from temp to uploads directory
      const uploadedFile = path.join(uploadsDir, req.file.filename);
      fs.copyFileSync(req.file.path, uploadedFile);
      
      // Clean up temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }
      
      // Create public URL
      const baseUrl = process.env.BASE_URL || 'https://saigon-soundscape-production.up.railway.app';
      const fileUrl = `${baseUrl}/api/uploads/${req.file.filename}`;
      
      // Create recording entry
      const newRecording = {
        id: uuidv4(),
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        description: req.body.description || '',
        fileUrl: fileUrl,
        location: {
          lat: parseFloat(req.body.lat || 0),
          lng: parseFloat(req.body.lng || 0)
        },
        uploadedAt: new Date().toISOString()
      };
      
      // Add to recordings array
      recordings.push(newRecording);
      console.log(`Added recording: ${newRecording.id}, total count: ${recordings.length}`);
      
      // Success response
      res.status(201).json({
        success: true,
        message: 'Recording uploaded successfully',
        data: newRecording
      });
      
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during upload',
        error: error.message
      });
    }
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
  console.log(`Attempting to serve file: ${filePath}`);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm',
      '.m4a': 'audio/mp4'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  } else {
    console.log(`File not found: ${filePath}`);
    res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
});

// Add some sample recordings for testing
const addSampleRecordings = () => {
  if (recordings.length === 0) {
    recordings.push({
      id: 'sample-1',
      fileName: 'sample-recording.mp3',
      originalName: 'test-recording.mp3',
      mimeType: 'audio/mpeg',
      size: 700000,
      description: 'A sample recording of street sounds',
      fileUrl: 'https://file-examples.com/storage/fe9278ad7097ab2d7c89164/2017/11/file_example_MP3_700KB.mp3',
      location: {
        lat: 10.7719,
        lng: 106.6953
      },
      uploadedAt: new Date().toISOString()
    });
    console.log('Added sample recording');
  }
};

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  addSampleRecordings();
});
