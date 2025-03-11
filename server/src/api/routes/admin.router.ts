import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', AdminController.login);
router.delete('/recordings/:id', authMiddleware, AdminController.deleteRecording);

export default router;
