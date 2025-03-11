import { Router } from 'express';
import { audioUpload } from '../../core/storage';
import { SoundscapeController } from '../controllers/soundscape.controller';

const router = Router();

// Route for creating a new recording
router.post(
  '/recordings',
  audioUpload.single('audio'),
  SoundscapeController.createRecording
);

// Route for fetching recordings
router.get(
  '/recordings',
  SoundscapeController.getRecordings
);

// Route for getting a signed upload URL
router.post(
  '/get-upload-url',
  SoundscapeController.getSignedUploadUrl
);

export default router;
