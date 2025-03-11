import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { BackblazeStorage } from '../../core/storage/providers/backblaze';

const router = Router();

router.post('/login', AdminController.login);
router.delete('/recordings/:id', authMiddleware, AdminController.deleteRecording);

// Add storage usage endpoint
router.get('/storage-usage', async (req, res) => {
  try {
    const storageInfo = await BackblazeStorage.getStorageUsage();
    res.status(200).json({
      success: true,
      data: storageInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not retrieve storage information'
    });
  }
});

export default router;
