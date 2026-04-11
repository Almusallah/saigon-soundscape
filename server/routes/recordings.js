const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define schema if not already defined
let Recording;
try {
  Recording = mongoose.model('Recording');
  console.log('Using existing Recording model');
} catch (err) {
  console.log('Creating new Recording model');
  const recordingSchema = new mongoose.Schema({
    title: String,
    description: String,
    latitude: Number,
    longitude: Number,
    audioUrl: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  });
  
  Recording = mongoose.model('Recording', recordingSchema);
}

// Get all recordings
router.get('/recordings', async (req, res) => {
  try {
    console.log('GET /api/recordings endpoint called');
    
    // Return mock data for testing
    res.json({ 
      recordings: [
        {
          title: "Test Recording 1",
          description: "This is a test recording",
          latitude: 10.7765,
          longitude: 106.7012,
          audioUrl: "https://s3.us-west-004.backblazeb2.com/saigon-soundscape-audio/test-recording.mp3",
          uploadDate: new Date()
        }
      ] 
    });
  } catch (error) {
    console.error('Error in /recordings endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Recordings route is working' });
});

module.exports = router;
