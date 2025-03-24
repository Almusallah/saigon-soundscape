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
