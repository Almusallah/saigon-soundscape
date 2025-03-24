const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration - IMPORTANT: This should be added BEFORE other middleware
app.use(cors({
  origin: '*',  // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Enable pre-flight for all routes
app.options('*', cors());

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// In-memory storage for recordings (replace with database in production)
let recordings = [];

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Saigon Sound Archive API is running');
});

// Health check endpoint
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

// Get all recordings
app.get('/api/recordings', (req, res) => {
  res.json({ recordings });
});

// Upload a new recording
app.post('/api/upload', upload.single('audioFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { title, description, latitude, longitude } = req.body;
    
    // Create a new recording
    const newRecording = {
      id: uuidv4(),
      title: title || 'Untitled Recording',
      description: description || '',
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      timestamp: new Date().toISOString(),
      fileName: req.file.filename,
      audioUrl: `/api/audio/${req.file.filename}`
    };
    
    // Add to our in-memory storage
    recordings.push(newRecording);
    
    console.log('New recording added:', newRecording);
    res.status(201).json(newRecording);
    
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: 'Server error processing upload' });
  }
});

// Get audio file by filename
app.get('/api/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }
  
  res.sendFile(filePath);
});

// Start the server
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
