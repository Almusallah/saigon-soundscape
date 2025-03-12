import multer from 'multer';

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit
  }
});
