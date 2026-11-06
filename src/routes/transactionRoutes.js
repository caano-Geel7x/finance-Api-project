import { Router } from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  monthlySummaryQuerySchema,
  transactionIdSchema,
  transactionInputSchema,
  transactionListQuerySchema,
  updateTransactionSchema,
} from '../validation/financeSchemas.js';

const router = Router();

router.use(authenticate);
router.post('/', validateBody(transactionInputSchema), transactionController.create);
router.get('/', validateRequest(transactionListQuerySchema, 'query'), transactionController.list);
router.get(
  '/monthly-summary',
  validateRequest(monthlySummaryQuerySchema, 'query'),
  transactionController.monthlySummary,
);
router.put(
  '/:id',
  validateRequest(transactionIdSchema, 'params'),
  validateBody(updateTransactionSchema),
  transactionController.update,
);
router.delete(
  '/:id',
  validateRequest(transactionIdSchema, 'params'),
  transactionController.remove,
);

export default router;
