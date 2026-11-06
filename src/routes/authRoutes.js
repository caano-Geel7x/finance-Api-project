import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validation/authSchemas.js';

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts; try again later' },
});

router.post('/register', authRateLimit, validateBody(registerSchema), authController.register);
router.post('/login', authRateLimit, validateBody(loginSchema), authController.login);
router.get('/profile', authenticate, authController.profile);

export default router;
