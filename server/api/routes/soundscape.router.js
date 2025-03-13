const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed'), false);
    }
    cb(null, true);
  }
});

// In-memory storage for recordings (replace with database in production)
let recordings = [];

// GET all recordings
router.get('/recordings', (req, res) => {
  console.log('GET /recordings - Returning', recordings.length, 'recordings');
  res.json({ recordings });
});

// POST new recording
router.post('/upload', upload.single('audioFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { title, description, latitude, longitude } = req.body;
    
    if (!title || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, just store the file path (would be B2 URL in production)
    const filePath = req.file.path;
    const fileName = req.file.filename;
    
    // Create a recording record
    const newRecording = {
      id: uuidv4(),
      title,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date().toISOString(),
      audioUrl: `/api/audio/${fileName}`, // URL to access the audio file
      fileName
    };
    
    // Add to our in-memory storage
    recordings.push(newRecording);
    
    console.log('New recording added:', newRecording);
    res.status(201).json(newRecording);
    
  } catch (error) {
    console.error('Error in /upload:', error);
    res.status(500).json({ error: 'Server error processing upload' });
  }
});

// GET audio file by filename
router.get('/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../../uploads', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }
  
  res.sendFile(filePath);
});

module.exports = router;
