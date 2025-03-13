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

// Backblaze integration
let b2;
let useLocalStorage = true; // Default to local storage
let setupComplete = false;

try {
  // Check if we have the module and credentials
  if (process.env.B2_APPLICATION_KEY_ID && process.env.B2_APPLICATION_KEY) {
    const B2 = require('backblaze-b2');
    
    b2 = new B2({
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY
    });
    
    console.log('Backblaze B2 module loaded successfully, will attempt authorization');
    
    // We'll attempt to use Backblaze
    useLocalStorage = false;
  } else {
    console.log('Backblaze credentials not found, using local storage');
  }
} catch (moduleError) {
  console.error('Backblaze B2 module not available:', moduleError);
}

// Initialize Backblaze if available
async function setupB2() {
  if (useLocalStorage || setupComplete) return;
  
  try {
    await b2.authorize();
    console.log('Backblaze B2 authorized successfully');
    setupComplete = true;
  } catch (error) {
    console.error('Backblaze B2 authorization error:', error);
    console.log('Falling back to local storage');
    useLocalStorage = true;
    setupComplete = true;
  }
}

// Upload file to storage (either Backblaze B2 or local)
async function uploadFile(filePath, fileName, mimeType) {
  // Make sure setup is complete
  if (!setupComplete) {
    await setupB2();
  }
  
  if (useLocalStorage) {
    // Local storage
    const destPath = path.join(uploadsDir, path.basename(filePath));
    fs.copyFileSync(filePath, destPath);
    
    // Create public URL
    const baseUrl = process.env.BASE_URL || 'https://saigon-soundscape-production.up.railway.app';
    return {
      fileName: path.basename(filePath),
      contentType: mimeType,
      url: `${baseUrl}/api/uploads/${path.basename(filePath)}`
    };
  } else {
    try {
      // Upload to Backblaze B2
      const bucketId = process.env.B2_BUCKET_ID || 'ef791392b1a1865094580d1b';
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
      
      // Fall back to local storage on error
      useLocalStorage = true;
      return await uploadFile(filePath, fileName, mimeType);
    }
  }
}

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
    endpoints: ['server/health_endpoint.txt', '/api/recordings', '/api/uploads/:filename'],
    storageType: useLocalStorage ? 'local' : 'Backblaze B2'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    storageType: useLocalStorage ? 'local' : 'Backblaze B2',
    recordingsCount: recordings.length,
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
      
      // Generate a unique filename for storage
      const storageFileName = `recordings/${uuidv4()}${path.extname(req.file.originalname)}`;
      
      // Upload to storage (Backblaze or local)
      const uploadResult = await uploadFile(
        req.file.path,
        storageFileName,
        req.file.mimetype
      );
      
      // Clean up temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }
      
      // Create recording entry
      const newRecording = {
        id: uuidv4(),
        fileName: uploadResult.fileName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        description: req.body.description || '',
        fileUrl: uploadResult.url,
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

// Serve uploaded files (for local storage)
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

// Add a sample recording for testing
const addSampleRecording = () => {
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
  
  // Initialize Backblaze in the background
  if (!useLocalStorage && !setupComplete) {
    setupB2().catch(error => {
      console.error('Failed to set up Backblaze:', error);
    });
  }
  
  // Add sample recording
  addSampleRecording();
});

// Add endpoint to delete recordings
app.delete('/api/recordings/:id', (req, res) => {
  const recordingId = req.params.id;
  
  // Find the recording by ID
  const recordingIndex = recordings.findIndex(r => r.id === recordingId);
  
  if (recordingIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Recording not found'
    });
  }
  
  // Remove the recording from memory
  const removedRecording = recordings.splice(recordingIndex, 1)[0];
  
  console.log(`Removed recording: ${removedRecording.id}`);
  
  // Success response
  res.status(200).json({
    success: true,
    message: 'Recording removed successfully'
  });
});

// Add endpoint to delete recordings
app.delete('/api/recordings/:id', (req, res) => {
  const recordingId = req.params.id;
  
  // Find the recording by ID
  const recordingIndex = recordings.findIndex(r => r.id === recordingId);
  
  if (recordingIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Recording not found'
    });
  }
  
  // Remove the recording from memory
  const removedRecording = recordings.splice(recordingIndex, 1)[0];
  
  console.log(`Removed recording: ${removedRecording.id}`);
  
  // Success response
  res.status(200).json({
    success: true,
    message: 'Recording removed successfully'
  });
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
