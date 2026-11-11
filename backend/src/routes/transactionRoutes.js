import { Router } from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  customRangeQuerySchema,
  monthlySummaryQuerySchema,
  transactionExportQuerySchema,
  transactionIdSchema,
  transactionInputSchema,
  transactionListQuerySchema,
  updateTransactionSchema,
} from '../validation/financeSchemas.js';

const router = Router();

router.use(authenticate);
router.get('/reports/monthly-trends', transactionController.monthlyTrends);
router.get(
  '/reports/daily-breakdown',
  validateRequest(monthlySummaryQuerySchema, 'query'),
  transactionController.dailyBreakdown,
);
router.get(
  '/reports/custom-range',
  validateRequest(customRangeQuerySchema, 'query'),
  transactionController.customRangeSummary,
);
router.get(
  '/export',
  validateRequest(transactionExportQuerySchema, 'query'),
  transactionController.exportCsv,
);
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
