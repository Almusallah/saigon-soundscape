import { Request, Response } from 'express';
import { AudioMarker } from '../../core/database/models';
import { BackblazeStorage } from '../../core/storage/providers/backblaze';

export class SoundscapeController {
  static async createRecording(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No audio file uploaded or file is too large. Maximum file size is 30MB.'
        });
      }
      
      const { url, key } = await BackblazeStorage.uploadAudio(req.file);
      
      const recording = await AudioMarker.create({
        location: {
          type: 'Point',
          coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
        },
        description: req.body.description,
        audioPath: url,
        audioKey: key,
        metadata: {
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });

      res.status(201).json({
        success: true,
        data: recording,
        message: 'Recording archived successfully'
      });
    } catch (error) {
      console.error('Error creating recording:', error);
      
      if (error instanceof Error && error.message.includes('File size exceeds')) {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the maximum limit of 30MB'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error while processing recording'
      });
    }
  }

  static async getRecordings(req: Request, res: Response) {
    try {
      const recordings = await AudioMarker.find();
      res.status(200).json({
        success: true,
        data: recordings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Could not retrieve recordings'
      });
    }
  }

  static async getSignedUploadUrl(req: Request, res: Response) {
    try {
      res.status(200).json({
        success: true,
        uploadUrl: 'https://example.com/upload',
        expiresAt: new Date(Date.now() + 3600000)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Could not generate upload URL'
      });
    }
  }
}
