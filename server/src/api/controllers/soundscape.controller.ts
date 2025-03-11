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
      
      // Upload to Backblaze
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
      
      // Provide more specific error messages
      if (error.message.includes('File size exceeds')) {
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

  // Rest of the existing methods remain the same
}
