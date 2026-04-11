const path = require('path');
const fs = require('fs');
const Recording = require('../models/Recording');

// Legacy storage path for migration
const storagePath = path.join(__dirname, '../data/recordings.json');

// Load recordings from MongoDB
async function loadRecordings() {
  try {
    const recordings = await Recording.find().sort({ uploadDate: -1 }).lean();
    console.log(`Loaded ${recordings.length} recordings from MongoDB`);
    return recordings;
  } catch (err) {
    console.error('Error loading recordings from MongoDB:', err);
    return [];
  }
}

// Save a recording to MongoDB
async function saveRecording(recording) {
  try {
    // Check if recording already exists
    const existingRecording = await Recording.findOne({ id: recording.id });
    
    if (existingRecording) {
      // Update existing recording
      const updated = await Recording.findOneAndUpdate(
        { id: recording.id },
        recording,
        { new: true }
      );
      console.log(`Updated recording ${recording.id} in MongoDB`);
      return updated;
    } else {
      // Create new recording
      const newRecording = new Recording(recording);
      await newRecording.save();
      console.log(`Saved new recording ${recording.id} to MongoDB`);
      return newRecording;
    }
  } catch (err) {
    console.error('Error saving recording to MongoDB:', err);
    throw err;
  }
}

// Extract metadata from filename if available
function extractMetadataFromFilename(filename) {
  try {
    // Check if filename follows our convention: id_lat_long.ext
        const withoutExt = filename.replace(/\.[^_.]+$/, '');
        const parts = withoutExt.split('_');
    if (parts.length >= 3) {
      const id = parts[0];
      const latitude = parseFloat(parts[1]);
            const longitude = parseFloat(parts[parts.length - 1]);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { id, latitude, longitude };
      }
    }
    return null;
  } catch (err) {
    console.error('Error extracting metadata from filename:', err);
    return null;
  }
}

// Sync B2 bucket with MongoDB
async function syncWithB2Bucket(s3, bucketName) {
  try {
    console.log('Syncing B2 bucket with MongoDB...');
    
 // STEP 1: Clean up any recordings with missing audio files
    const removedCount = await cleanupMissingRecordings(s3, bucketName);
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} recordings with missing audio files`);
    }

// STEP 2: Get all existing recordings from MongoDB after cleanup
    const existingRecordingsArray = await Recording.find({}, 'audioUrl').lean();
    
    // Create a set of existing audio URLs for quick lookup
    const existingAudioUrls = new Set(existingRecordingsArray.map(r => r.audioUrl));
    
    // List all objects in the recordings folder
    const listParams = {
      Bucket: bucketName,
      Prefix: 'recordings/'
    };
    
    const listedObjects = await s3.listObjectsV2(listParams).promise()
          .then(data => {
            console.log('=== B2 UPLOAD SUCCESS ===', new Date().toISOString());
            console.log('Upload response:', data);
            return data;
          })
          .catch(err => {
            console.error('=== B2 UPLOAD ERROR ===', new Date().toISOString());
            console.error('Error:', err);
            throw err;
          });
    
    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log('No recordings found in B2 bucket');
      return [];
    }
    
    console.log(`Found ${listedObjects.Contents.length} objects in B2 bucket`);
    
    // Track new recordings added during this sync
    const newRecordings = [];
    
    // Process each object
    for (const obj of listedObjects.Contents) {
      // Skip folders
      if (obj.Key.endsWith('/')) continue;
      
      // Create the audio URL
      const audioUrl = `https://${process.env.B2_ENDPOINT}/${bucketName}/${obj.Key}`;
      
      // Skip if we already have this recording
      if (existingAudioUrls.has(audioUrl)) continue;
      
      // Extract the filename
      const filename = obj.Key.split('/').pop();
      const id = filename.split('.')[0].split('_')[0]; // Get first part before any underscores or dots
      
      // Try to extract metadata from filename
      const metadata = extractMetadataFromFilename(filename);
      
      // Default coordinates for Ho Chi Minh City if no metadata found
      let latitude = 10.776;
      let longitude = 106.701;
      
      if (metadata) {
        // Use coordinates from filename
        latitude = metadata.latitude;
        longitude = metadata.longitude;
      } else {
        // If no metadata, use a deterministic but distributed position based on the ID
        // This ensures the same recording always gets the same coordinates
        const idSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const seedRandom = (seed) => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };
        
        // Add small offsets to spread recordings around the city (± ~0.02 degrees)
        latitude = latitude + (seedRandom(idSum) - 0.5) * 0.04;
        longitude = longitude + (seedRandom(idSum + 1) - 0.5) * 0.04;
      }
      
      // Create a new recording object
      const newRecording = {
        id: id,
        title: `Recording ${id.substring(0, 8)}`,
        description: 'Auto-discovered recording',
        latitude: latitude,
        longitude: longitude,
        audioUrl: audioUrl,
        uploadDate: new Date(obj.LastModified),
        metadata: {
          source: 'b2-sync',
          size: obj.Size,
          lastModified: obj.LastModified
        }
      };
      
      // Save to MongoDB
      await saveRecording(newRecording);
      newRecordings.push(newRecording);
    }
    
    console.log(`Added ${newRecordings.length} new recordings from B2 to MongoDB`);
    
    // Return all recordings after sync
    return await loadRecordings();
  } catch (err) {
    console.error('Error syncing with B2 bucket:', err);
    return await loadRecordings(); // Fall back to loading from MongoDB
  }
}

// Upload a recording to B2 and store its metadata
async function uploadRecordingToB2(s3, bucketName, fileBuffer, mimeType, metadata) {
  try {
    // Generate a unique ID for this recording if not provided
    const recordingId = metadata.id || require('uuid').v4();
    
    // Format for filename: id_latitude_longitude.extension
    // This embeds the coordinates in the filename itself
    const fileExtension = metadata.fileExtension || 'mp3';
    const latitude = parseFloat(metadata.latitude);
    const longitude = parseFloat(metadata.longitude);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid coordinates for recording');
    }
    
    const filename = `${recordingId}_${latitude}_${longitude}.${fileExtension}`;
    
    // Upload to B2 bucket
    const uploadParams = {
      Bucket: bucketName,
      Key: `recordings/${filename}`,
      Body: fileBuffer,
      ContentType: mimeType
    };
    
    console.log('Uploading to B2...', {
      bucket: bucketName,
      key: `recordings/${filename}`
    });
    
    // Perform the upload
    const uploadResult = await s3.upload(uploadParams).promise()
          .then(data => {
            console.log('=== B2 UPLOAD SUCCESS ===', new Date().toISOString());
            console.log('Upload response:', data);
            return data;
          })
          .catch(err => {
            console.error('=== B2 UPLOAD ERROR ===', new Date().toISOString());
            console.error('Error:', err);
            throw err;
          });
    
    // Construct the audio URL from the upload result
    const audioUrl = uploadResult.Location || 
        `https://${process.env.B2_ENDPOINT}/${bucketName}/recordings/${filename}`;
    
    // Create a recording object
    const recording = {
      id: recordingId,
      title: metadata.title || 'New Recording',
      description: metadata.description || 'Recorded audio',
      latitude: latitude,
      longitude: longitude,
      audioUrl: audioUrl,
      uploadDate: new Date(),
      metadata: {
        source: 'user-upload',
        originalFilename: metadata.originalFilename,
        fileSize: fileBuffer.length,
        mimeType: mimeType
      }
    };
    
    // Save to MongoDB
    await saveRecording(recording);
    
    return recording;
  } catch (error) {
    console.error('Error uploading to B2:', error);
    throw error;
  }
}

// Migrate data from JSON file to MongoDB (one-time operation)
async function migrateJsonToMongoDB() {
  try {
    // Check if the JSON file exists
    if (!fs.existsSync(storagePath)) {
      console.log('No JSON file found for migration');
      return { migrated: 0 };
    }
    
    // Read the JSON file
    const data = fs.readFileSync(storagePath, 'utf8');
    const recordings = JSON.parse(data);
    
    if (!recordings || !recordings.length) {
      console.log('No recordings found in JSON file');
      return { migrated: 0 };
    }
    
    console.log(`Migrating ${recordings.length} recordings from JSON to MongoDB...`);
    
    // Track successful migrations
    let migratedCount = 0;
    
    // Process each recording
    for (const recording of recordings) {
      try {
        // Convert date string to actual Date object if needed
        if (typeof recording.uploadDate === 'string') {
          recording.uploadDate = new Date(recording.uploadDate);
        }
        
        // Save to MongoDB
        await saveRecording(recording);
        migratedCount++;
      } catch (migrationError) {
        console.error(`Error migrating recording ${recording.id}:`, migrationError);
      }
    }
    
    console.log(`Successfully migrated ${migratedCount} of ${recordings.length} recordings to MongoDB`);
    
    // Create a backup of the original JSON file
    const backupPath = storagePath + `.backup-${Date.now()}`;
    fs.copyFileSync(storagePath, backupPath);
    console.log(`Created backup of JSON file at ${backupPath}`);
    
    return { migrated: migratedCount, total: recordings.length };
  } catch (err) {
    console.error('Error migrating JSON to MongoDB:', err);
    return { migrated: 0, error: err.message };
  }
}

// Get recordings by page (for pagination)
async function getRecordingsByPage(page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await Recording.countDocuments();
    
    // Get paginated results
    const recordings = await Recording.find()
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    return {
      recordings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (err) {
    console.error('Error getting recordings by page:', err);
    throw err;
  }
}

// Search recordings
async function searchRecordings(query, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    let searchCriteria = {};
    
    if (query) {
      // Text search on title and description
      searchCriteria = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };
    }
    
    // Get total count
    const total = await Recording.countDocuments(searchCriteria);
    
    // Get search results
    const recordings = await Recording.find(searchCriteria)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    return {
      recordings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (err) {
    console.error('Error searching recordings:', err);
    throw err;
  }
}

module.exports = {
  loadRecordings,
  saveRecording,
  syncWithB2Bucket,
  uploadRecordingToB2,
  migrateJsonToMongoDB,
  getRecordingsByPage,
  searchRecordings
};

/**
 * Check if audio files exist in B2 bucket and remove recordings with missing files
 * @param {AWS.S3} s3 - Configured S3 client
 * @param {string} bucketName - B2 bucket name
 * @returns {Promise<number>} - Number of removed recordings
 */
async function cleanupMissingRecordings(s3, bucketName) {
  try {
    console.log('Starting cleanup of recordings with missing audio files...');
    
    // Get all recordings from MongoDB
    const allRecordings = await Recording.find().lean();
    console.log(`Checking ${allRecordings.length} recordings for missing audio files`);
    
    // Track recordings to remove
    const recordingsToRemove = [];
    
    // Check each recording's audio file
    for (const recording of allRecordings) {
      try {
        // Extract the object key from the URL
        // Example: https://s3.us-west-004.backblazeb2.com/saigon-soundscape-audio/recordings/file.webm
        const audioUrl = recording.audioUrl;
        const urlParts = audioUrl.split('/');
        const objectKey = urlParts.slice(4).join('/'); // Get everything after the bucket name
        
        // Check if the file exists
        try {
          await s3.headObject({
            Bucket: bucketName,
            Key: objectKey
          }).promise()
          .then(data => {
            console.log('=== B2 UPLOAD SUCCESS ===', new Date().toISOString());
            console.log('Upload response:', data);
            return data;
          })
          .catch(err => {
            console.error('=== B2 UPLOAD ERROR ===', new Date().toISOString());
            console.error('Error:', err);
            throw err;
          });
          
          // File exists, no action needed
        } catch (headError) {
          if (headError.code === 'NotFound') {
            // File doesn't exist in B2, add to removal list
            console.log(`Audio file not found for recording ${recording.id}: ${objectKey}`);
            recordingsToRemove.push(recording._id);
          } else {
            // Other error occurred
            console.error(`Error checking file ${objectKey}:`, headError);
          }
        }
      } catch (error) {
        console.error(`Error processing recording ${recording.id}:`, error);
      }
    }
    
    // Remove recordings with missing files
    if (recordingsToRemove.length > 0) {
      const deleteResult = await Recording.deleteMany({ _id: { $in: recordingsToRemove } });
      console.log(`Removed ${deleteResult.deletedCount} recordings with missing audio files`);
      return deleteResult.deletedCount;
    } else {
      console.log('No recordings with missing audio files found');
      return 0;
    }
  } catch (error) {
    console.error('Error cleaning up missing recordings:', error);
    return 0;
  }
}
