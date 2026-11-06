import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { createCategorySchema } from '../validation/financeSchemas.js';

const router = Router();

router.use(authenticate);
router.get('/', categoryController.list);
router.post('/', validateBody(createCategorySchema), categoryController.create);

export default router;
