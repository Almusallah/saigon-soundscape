require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const multer   = require('multer');
const mongoose = require('mongoose');

const Recording = require('./models/Recording');
const { syncB2ToMongo, uploadRecording, cleanupOrphans } = require('./utils/b2');

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------
let cache     = [];
let cacheTime = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

async function refreshCache() {
  cache = await Recording.find().sort({ createdAt: -1 }).lean();
  cacheTime = Date.now();
  return cache;
}

function cacheIsFresh() {
  return cacheTime && (Date.now() - cacheTime < CACHE_TTL);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
    recordings: cache.length,
    uptime: process.uptime(),
  });
});

// Get all recordings
app.get('/api/recordings', async (req, res) => {
  try {
    const recordings = cacheIsFresh() ? cache : await refreshCache();
    res.json({ recordings });
  } catch (err) {
    console.error('[GET /recordings]', err.message);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// Search recordings
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const results = await Recording.find({
      $or: [
        { title:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ]
    }).sort({ createdAt: -1 }).lean();
    res.json({ recordings: results });
  } catch (err) {
    console.error('[GET /search]', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Upload a new recording
app.post('/api/upload', upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file provided' });
    }

    const lat = parseFloat(req.body.latitude);
    const lng = parseFloat(req.body.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    const recording = await uploadRecording(req.file.buffer, req.file.mimetype, {
      title:            req.body.title,
      description:      req.body.description,
      category:         req.body.category,
      latitude:         lat,
      longitude:        lng,
      originalFilename: req.file.originalname,
    });

    // Prepend to cache
    cache = [recording.toObject(), ...cache];
    cacheTime = Date.now();

    res.json({ success: true, recording });
  } catch (err) {
    console.error('[POST /upload]', err.message);
    res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

// Manual resync — discovers ALL audio files in B2 bucket
app.get('/api/resync', async (req, res) => {
  try {
    const result = await syncB2ToMongo();
    await refreshCache();
    res.json({ success: true, ...result, message: `Synced. ${result.added} new, ${result.total} total.` });
  } catch (err) {
    console.error('[GET /resync]', err.message);
    res.status(500).json({ success: false, message: 'Resync failed', error: err.message });
  }
});

// Cleanup orphaned DB records whose B2 files are gone
app.get('/api/cleanup', async (req, res) => {
  try {
    const removed = await cleanupOrphans();
    await refreshCache();
    res.json({ success: true, removed });
  } catch (err) {
    console.error('[GET /cleanup]', err.message);
    res.status(500).json({ success: false, message: 'Cleanup failed', error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Static files (production — serves the client SPA)
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, '../client')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function start() {
  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Start listening
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // Background: sync B2 bucket and populate cache
  try {
    await syncB2ToMongo();
    await refreshCache();
    console.log(`Cache loaded: ${cache.length} recordings`);
  } catch (err) {
    console.error('Initial B2 sync failed (non-fatal):', err.message);
    await refreshCache(); // still load whatever Mongo has
  }
}

start();

module.exports = app;
