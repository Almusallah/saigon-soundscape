/**
 * Backblaze B2 utilities — listing, uploading, and syncing with MongoDB.
 *
 * Uses AWS SDK v3 (S3-compatible) to talk to B2.
 * Key design decisions:
 *   - Scans the ENTIRE bucket (no prefix filter) so we catch recordings
 *     that were uploaded under different path conventions over time.
 *   - Paginates with ContinuationToken so we never silently miss files.
 *   - Coordinates are embedded in filenames: {uuid}_{lat}_{lng}.{ext}
 */

const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { v4: uuidv4 } = require('uuid');
const Recording = require('../models/Recording');

// Audio file extensions we recognise
const AUDIO_EXTENSIONS = new Set(['webm', 'mp3', 'mp4', 'm4a', 'ogg', 'wav', 'aac', 'flac']);

// ---------------------------------------------------------------------------
// S3 client singleton
// ---------------------------------------------------------------------------
let _s3 = null;

function getS3() {
  if (!_s3) {
    _s3 = new S3Client({
      endpoint:        `https://${process.env.B2_ENDPOINT}`,
      region:          process.env.B2_REGION || 'us-west-004',
      credentials: {
        accessKeyId:     process.env.B2_APPLICATION_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
      },
      forcePathStyle: true,
    });
  }
  return _s3;
}

function getBucket() {
  return process.env.B2_BUCKET_NAME;
}

// ---------------------------------------------------------------------------
// Filename helpers
// ---------------------------------------------------------------------------

/** Build a B2 key for a new upload. Always uses recordings/ prefix going forward. */
function buildKey(id, lat, lng, ext) {
  return `recordings/${id}_${lat}_${lng}.${ext}`;
}

/** Build a full public URL from a B2 object key. */
function keyToUrl(key) {
  return `https://${process.env.B2_ENDPOINT}/${getBucket()}/${key}`;
}

/**
 * Extract {id, latitude, longitude} from a filename like:
 *   09e7c302-8f29-48e8-ba9d-edb900fc51e4_10.757142_106.692507.webm
 *
 * Steps:
 *   1. Strip the file extension (everything after the last dot that isn't
 *      part of a decimal number — we look for a non-numeric segment).
 *   2. Split by underscore.
 *   3. Longitude = last part, latitude = second-to-last, id = everything before.
 */
function parseFilename(filename) {
  try {
    const withoutExt = filename.replace(/\.[^_.]+$/, '');
    const parts = withoutExt.split('_');
    if (parts.length < 3) return null;

    const lng = parseFloat(parts[parts.length - 1]);
    const lat = parseFloat(parts[parts.length - 2]);
    const id  = parts.slice(0, parts.length - 2).join('_');

    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    return { id, latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

/** Return the lowercase file extension, or null. */
function fileExtension(key) {
  const dot = key.lastIndexOf('.');
  if (dot === -1) return null;
  return key.slice(dot + 1).toLowerCase();
}

// ---------------------------------------------------------------------------
// List ALL audio files in the bucket (paginated)
// ---------------------------------------------------------------------------

/**
 * Returns an array of { key, size, lastModified } for every audio file
 * in the bucket, regardless of prefix.
 */
async function listAllAudioFiles() {
  const s3 = getS3();
  const files = [];
  let continuationToken = undefined;

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: getBucket(),
      ContinuationToken: continuationToken,
    });
    const res = await s3.send(cmd);

    for (const obj of (res.Contents || [])) {
      if (obj.Key.endsWith('/')) continue;           // skip "folders"
      const ext = fileExtension(obj.Key);
      if (!ext || !AUDIO_EXTENSIONS.has(ext)) continue; // skip non-audio

      files.push({
        key:          obj.Key,
        size:         obj.Size,
        lastModified: obj.LastModified,
      });
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return files;
}

// ---------------------------------------------------------------------------
// Sync B2 → MongoDB
// ---------------------------------------------------------------------------

/**
 * Discover every audio file in B2 and ensure it has a matching MongoDB document.
 * Returns { added, total }.
 */
async function syncB2ToMongo() {
  console.log('[sync] Starting full bucket scan...');
  const files = await listAllAudioFiles();
  console.log(`[sync] Found ${files.length} audio files in B2`);

  // Build a set of audio URLs already in Mongo
  const existing = await Recording.find({}, 'audioUrl').lean();
  const existingUrls = new Set(existing.map(r => r.audioUrl));

  let added = 0;

  for (const file of files) {
    const url = keyToUrl(file.key);
    if (existingUrls.has(url)) continue;

    const filename = file.key.split('/').pop();
    const meta = parseFilename(filename);

    if (!meta) {
      console.log(`[sync] Skipping file with unparseable name: ${file.key}`);
      continue;
    }

    const doc = new Recording({
      id:          meta.id,
      title:       `Recording ${meta.id.substring(0, 8)}`,
      description: 'Auto-discovered recording',
      category:    'Others',
      audioUrl:    url,
      latitude:    meta.latitude,
      longitude:   meta.longitude,
      source:      'b2-sync',
      fileSize:    file.size,
    });

    try {
      await doc.save();
      added++;
    } catch (err) {
      // Duplicate key is expected if the id already exists
      if (err.code === 11000) {
        console.log(`[sync] Duplicate id, updating URL: ${meta.id}`);
        await Recording.updateOne({ id: meta.id }, { audioUrl: url });
      } else {
        console.error(`[sync] Error saving ${meta.id}:`, err.message);
      }
    }
  }

  const total = await Recording.countDocuments();
  console.log(`[sync] Done. Added ${added} new recordings. Total in DB: ${total}`);
  return { added, total };
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Upload an audio buffer to B2 and create a MongoDB document.
 * Returns the saved Recording document.
 */
async function uploadRecording(fileBuffer, mimeType, { title, description, category, latitude, longitude, originalFilename }) {
  const id  = uuidv4();
  const ext = (originalFilename || '').split('.').pop() || 'webm';
  const key = buildKey(id, latitude, longitude, ext);

  console.log(`[upload] Uploading ${key} (${fileBuffer.length} bytes)`);

  const upload = new Upload({
    client: getS3(),
    params: {
      Bucket:      getBucket(),
      Key:         key,
      Body:        fileBuffer,
      ContentType: mimeType,
    },
  });

  await upload.done();

  const doc = new Recording({
    id,
    title:       title || 'New Recording',
    description: description || '',
    category:    category || 'Others',
    audioUrl:    keyToUrl(key),
    latitude:    parseFloat(latitude),
    longitude:   parseFloat(longitude),
    source:      'upload',
    fileSize:    fileBuffer.length,
  });

  await doc.save();
  console.log(`[upload] Saved recording ${id}`);
  return doc;
}

// ---------------------------------------------------------------------------
// Cleanup — remove Mongo docs whose audio file no longer exists in B2
// ---------------------------------------------------------------------------

async function cleanupOrphans() {
  const s3 = getS3();
  const all = await Recording.find({}, 'audioUrl').lean();
  const toRemove = [];

  for (const rec of all) {
    const key = rec.audioUrl.split(`${getBucket()}/`)[1];
    if (!key) { toRemove.push(rec._id); continue; }

    try {
      await s3.send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        toRemove.push(rec._id);
      }
    }
  }

  if (toRemove.length > 0) {
    await Recording.deleteMany({ _id: { $in: toRemove } });
    console.log(`[cleanup] Removed ${toRemove.length} orphaned recordings`);
  }
  return toRemove.length;
}

module.exports = {
  getS3,
  getBucket,
  parseFilename,
  listAllAudioFiles,
  syncB2ToMongo,
  uploadRecording,
  cleanupOrphans,
};
