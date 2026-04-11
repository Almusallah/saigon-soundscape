const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure S3 client for B2
const s3 = new AWS.S3({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY
  },
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
  region: process.env.B2_REGION
});

// Create upload middleware
const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.B2_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      const extension = path.extname(file.originalname);
      const filename = `recordings/${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`;
      cb(null, filename);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
});

// Function to create public URL
function createPublicUrl(filename) {
  return `https://${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${filename}`;
}

module.exports = {
  s3,
  upload: uploadMiddleware,
  createPublicUrl
};
