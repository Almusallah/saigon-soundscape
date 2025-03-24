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

// Backblaze integration - with fallback for local storage
let b2;
let useLocalStorage = false;
let setupComplete = false;

try {
  // First check if the module exists
  require.resolve('backblaze-b2');
  
  // If it doesn't throw an error, load it
  const B2 = require('backblaze-b2');
  
  b2 = new B2({
    applicationKeyId: process.env.B2_APPLICATION_KEY_ID || 'your_key_id',
    applicationKey: process.env.B2_APPLICATION_KEY || 'your_application_key'
  });
  
  console.log('Backblaze B2 module loaded successfully', {
    keyId: process.env.B2_APPLICATION_KEY_ID ? 'Set' : 'Not set',
    appKey: process.env.B2_APPLICATION_KEY ? 'Set' : 'Not set',
    bucketId: process.env.B2_BUCKET_ID ? 'Set' : 'Not set',
    bucketName: process.env.B2_BUCKET_NAME ? 'Set' : 'Not set'
  });
} catch (error) {
  console.error('Failed to load Backblaze B2 module:', error.message);
  console.log('Falling back to local storage');
  useLocalStorage = true;
  setupComplete = true;
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

// Upload file to Backblaze B2
async function uploadToB2(filePath, fileName, mimeType) {
  // Make sure setup is complete
  if (!setupComplete) {
    await setupB2();
  }

  if (useLocalStorage) {
    // Local storage fallback
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const destPath = path.join(uploadsDir, fileName);
    fs.copyFileSync(filePath, destPath);
    
    return {
      fileName: fileName,
      contentType: mimeType,
      url: `/api/uploads/${fileName}`
    };
  } else {
    try {
      // Get upload URL
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
      return await uploadToB2(filePath, fileName, mimeType);
    }
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
    endpoints: ['/api/health', '/api/recordings'],
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
  
  // Use a try-catch to prevent uncaught exceptions
  try {
    upload.single('audio')(req, res, function(err) {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // Continue with handling the upload
      handleFileUpload(req, res, next);
    });
  } catch (error) {
    console.error('Upload middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in upload middleware',
      error: error.message
    });
  }
});

// Separate function to handle the file after upload
async function handleFileUpload(req, res, next) {
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
      mimetype: req.file.mimetype,
      path: req.file.path
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

      // Clean up temporary file if it exists
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

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
    
    // Clean up temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up temp file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message
    });
  }
}

// Get all recordings
app.get('/api/recordings', (req, res) => {
  res.json({
    success: true,
    count: recordings.length,
    data: recordings
  });
});

// Serve local files if using local storage
app.get('/api/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  
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
  
  // Initialize Backblaze in the background
  if (!useLocalStorage && !setupComplete) {
    setupB2().catch(error => {
      console.error('Failed to set up Backblaze:', error);
    });
  }
});
