import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AudioMarker } from '../../core/database/models';
import AWS from 'aws-sdk';

export class AdminController {
  static async login(req: Request, res: Response) {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
      
      res.status(200).json({
        success: true,
        token,
        message: 'Admin login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  }

  static async deleteRecording(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const recording = await AudioMarker.findById(id);
      
      if (!recording) {
        return res.status(404).json({
          success: false,
          message: 'Recording not found'
        });
      }

      const s3 = new AWS.S3({
        endpoint: process.env.B2_ENDPOINT,
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
        region: process.env.B2_REGION,
        s3ForcePathStyle: true
      });

      await s3.deleteObject({
        Bucket: process.env.B2_BUCKET!,
        Key: recording.audioKey
      }).promise();

      await AudioMarker.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Recording deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting recording:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting recording'
      });
    }
  }
}
