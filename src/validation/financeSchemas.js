import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const dateTimeSchema = z.iso.datetime({ offset: true });

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  type: z.enum(['income', 'expense']),
}).strict();

export const transactionInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.string()
    .regex(/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/)
    .refine((value) => Number(value) > 0, 'Amount must be greater than zero'),
  type: z.enum(['income', 'expense']),
  categoryId: objectIdSchema,
  date: dateTimeSchema,
}).strict();

export const updateTransactionSchema = transactionInputSchema.partial()
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required');

export const transactionIdSchema = z.object({
  id: objectIdSchema,
});

export const transactionListQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  categoryId: objectIdSchema.optional(),
  from: dateTimeSchema.optional(),
  to: dateTimeSchema.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict().refine(
  (query) => !query.from || !query.to || new Date(query.from) <= new Date(query.to),
  'from must not be later than to',
);

export const monthlySummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
}).strict();
