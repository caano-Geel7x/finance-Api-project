import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as uploadController from '../controllers/uploadController.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadProfileImage } from '../middleware/profileImageUpload.js';

const router = Router();

const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many upload attempts; try again later' },
});

router.post(
  '/profile-picture',
  authenticate,
  uploadRateLimit,
  uploadProfileImage,
  uploadController.profilePicture,
);

export default router;
