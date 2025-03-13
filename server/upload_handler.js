const B2 = require('backblaze-b2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configure upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max file size
  fileFilter: function (req, file, cb) {
    // Check if file is audio
    const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/ogg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Initialize B2 client
let b2;
function getB2Client() {
  if (!b2) {
    b2 = new B2({
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY
    });
  }
  return b2;
}

// Upload file to B2
async function uploadToB2(filePath, fileName) {
  try {
    const b2Client = getB2Client();
    
    // Authorize with B2
    await b2Client.authorize();
    
    // Get upload URL
    const { data: uploadUrlData } = await b2Client.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID
    });
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Get file content type
    const contentType = path.extname(fileName).toLowerCase() === '.mp3' 
      ? 'audio/mpeg' 
      : path.extname(fileName).toLowerCase() === '.wav'
        ? 'audio/wav'
        : 'application/octet-stream';
    
    // Upload file to B2
    const response = await b2Client.uploadFile({
      uploadUrl: uploadUrlData.uploadUrl,
      uploadAuthToken: uploadUrlData.authorizationToken,
      fileName: fileName,
      data: fileBuffer,
      contentType: contentType
    });
    
    // Clean up temporary file
    fs.unlinkSync(filePath);
    
    return {
      fileId: response.data.fileId,
      fileName: response.data.fileName,
      fileUrl: `https://f001.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${response.data.fileName}`
    };
  } catch (error) {
    console.error('Error uploading to B2:', error);
    throw error;
  }
}

module.exports = {
  upload,
  uploadToB2
};
