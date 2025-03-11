import { Request, Response } from 'express';
import { AudioMarker } from '../../core/database/models';
import { BackblazeStorage } from '../../core/storage/providers/backblaze';

export class SoundscapeController {
  /**
   * Create a new sound recording
   * @param req Express request object
   * @param res Express response object
   */
  static async createRecording(req: Request, res: Response) {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No audio file uploaded'
        });
      }
      
      // Validate location coordinates
      const { lat, lng, description } = req.body;
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Location coordinates are required'
        });
      }

      // Upload to Backblaze
      const { url, key } = await BackblazeStorage.uploadAudio(req.file);
      
      // Create database record
      const recording = await AudioMarker.create({
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        description: description || 'Unnamed recording',
        audioPath: url,
        audioKey: key,
        metadata: {
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });

      // Respond with success
      res.status(201).json({
        success: true,
        data: recording,
        message: 'Recording archived successfully'
      });
    } catch (error) {
      console.error('Error creating recording:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing recording'
      });
    }
  }

  /**
   * Retrieve sound recordings, with optional bounding box filter
   * @param req Express request object
   * @param res Express response object
   */
  static async getRecordings(req: Request, res: Response) {
    try {
      const { bbox, limit = 100, offset = 0 } = req.query;
      let query = {};
      
      // Implement bounding box filtering for geospatial queries
      if (bbox) {
        const [west, south, east, north] = (bbox as string).split(',').map(Number);
        
        query = {
          location: {
            $geoWithin: {
              $box: [
cat > server/src/api/controllers/soundscape.controller.ts << 'EOF'
import { Request, Response } from 'express';
import { AudioMarker } from '../../core/database/models';
import { BackblazeStorage } from '../../core/storage/providers/backblaze';

export class SoundscapeController {
  /**
   * Create a new sound recording
   * @param req Express request object
   * @param res Express response object
   */
  static async createRecording(req: Request, res: Response) {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No audio file uploaded'
        });
      }
      
      // Validate location coordinates
      const { lat, lng, description } = req.body;
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Location coordinates are required'
        });
      }

      // Upload to Backblaze
      const { url, key } = await BackblazeStorage.uploadAudio(req.file);
      
      // Create database record
      const recording = await AudioMarker.create({
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        description: description || 'Unnamed recording',
        audioPath: url,
        audioKey: key,
        metadata: {
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });

      // Respond with success
      res.status(201).json({
        success: true,
        data: recording,
        message: 'Recording archived successfully'
      });
    } catch (error) {
      console.error('Error creating recording:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing recording'
      });
    }
  }

  /**
   * Retrieve sound recordings, with optional bounding box filter
   * @param req Express request object
   * @param res Express response object
   */
  static async getRecordings(req: Request, res: Response) {
    try {
      const { bbox, limit = 100, offset = 0 } = req.query;
      let query = {};
      
      // Implement bounding box filtering for geospatial queries
      if (bbox) {
        const [west, south, east, north] = (bbox as string).split(',').map(Number);
        
        query = {
          location: {
            $geoWithin: {
              $box: [
                [west, south],
                [east, north]
              ]
            }
          }
        };
      }

      // Fetch recordings with pagination and sorting
      const recordings = await AudioMarker.find(query)
        .sort('-createdAt')
        .skip(Number(offset))
        .limit(Number(limit));

      // Count total matching records
      const total = await AudioMarker.countDocuments(query);

      // Respond with paginated results
      res.status(200).json({
        success: true,
        count: recordings.length,
        total,
        data: recordings,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching recordings:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching recordings'
      });
    }
  }

  /**
   * Generate a signed URL for direct uploads
   * @param req Express request object
   * @param res Express response object
   */
  static async getSignedUploadUrl(req: Request, res: Response) {
    try {
      const { filename, contentType } = req.body;
      
      // Validate input
      if (!filename || !contentType) {
        return res.status(400).json({
          success: false,
          message: 'Filename and content type are required'
        });
      }
      
      // Generate signed URL
      const { url, key } = await BackblazeStorage.getSignedUploadUrl(filename, contentType);
      
      res.status(200).json({
        success: true,
        data: { url, key }
      });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while generating upload URL'
      });
    }
  }
}
