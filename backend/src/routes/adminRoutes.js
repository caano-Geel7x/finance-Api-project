import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const router = Router();

router.get('/overview', authenticate, requireAdmin, adminController.overview);

export default router;
