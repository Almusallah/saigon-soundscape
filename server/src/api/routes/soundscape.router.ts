import { Router } from 'express';
import { audioUpload } from '../../core/storage';
import { SoundscapeController } from '../controllers/soundscape.controller';

const router = Router();

router.post(
  '/recordings',
  audioUpload.single('audio'),
  SoundscapeController.createRecording
);

router.get(
  '/recordings',
  SoundscapeController.getRecordings
);

router.post(
  '/get-upload-url',
  SoundscapeController.getSignedUploadUrl
);

export default router;
