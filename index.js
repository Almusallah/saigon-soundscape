const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const B2 = require('backblaze-b2');

// Initialize express app
const app = express();

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Backblaze B2 configuration
const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID || 'your_key_id',
  applicationKey: process.env.B2_APPLICATION_KEY || 'your_application_key'
});

// Initialize Backblaze
async function setupB2() {
  try {
    await b2.authorize();
    console.log('Backblaze B2 authorized successfully');
  } catch (error) {
    console.error('Backblaze B2 authorization error:', error);
  }
}
setupB2();

// Upload file to Backblaze B2
async function uploadToB2(filePath, fileName, mimeType) {
  try {
    // Get upload URL
    const bucketId = process.env.B2_BUCKET_ID || 'ef79192b1a1865094580d1b';
    const bucketName = process.env.B2_BUCKET_NAME || 'saigon-soundscape-audio';
    
    const { data: { uploadUrl, authorizationToken } } = await b2.getUploadUrl({
      bucketId: bucketId
    });

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload file
    const { data } = await b2.uploadFile({
      uploadUrl: uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName: fileName,
      data: fileBuffer,
      contentType: mimeType
    });

    // Delete temporary file
    fs.unlinkSync(filePath);

    // Return file info
    return {
      fileId: data.fileId,
      fileName: data.fileName,
      contentType: mimeType,
      bucketId: bucketId,
      url: `https://f004.backblazeb2.com/file/${bucketName}/${fileName}`
    };
  } catch (error) {
    console.error('Backblaze upload error:', error);
    throw error;
  }
}

// In-memory storage for recordings (replace with database in production)
const recordings = [];

// Middleware for logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Saigon Soundscape API is running',
    endpoints: ['/api/health', '/api/recordings']
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString()
  });
});

// File upload endpoint
app.post('/api/recordings', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file uploaded'
      });
    }

    // Log file details
    console.log('File received:', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    try {
      // Upload to Backblaze B2
      const fileName = `recordings/${uuidv4()}${path.extname(req.file.originalname)}`;
      const uploadResult = await uploadToB2(
        req.file.path,
        fileName,
        req.file.mimetype
      );

      // Create recording entry
      const recordingId = uuidv4();
      const newRecording = {
        id: recordingId,
        fileId: uploadResult.fileId,
        fileName: uploadResult.fileName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        description: req.body.description || '',
        fileUrl: uploadResult.url,
        location: {
          lat: parseFloat(req.body.lat),
          lng: parseFloat(req.body.lng)
        },
        uploadedAt: new Date().toISOString()
      };

      // Store recording in memory (would be database in production)
      recordings.push(newRecording);

      // Success response
      res.status(201).json({
        success: true,
        message: 'Recording uploaded successfully',
        data: newRecording
      });
    } catch (uploadError) {
      console.error('Backblaze upload error:', uploadError);
      
      // Clean up temporary file if it exists
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error uploading to cloud storage',
        error: uploadError.message
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message
    });
  }
});

// Get all recordings
app.get('/api/recordings', (req, res) => {
  res.json({
    success: true,
    count: recordings.length,
    data: recordings
  });
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
