import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createCategorySchema,
  customRangeQuerySchema,
  monthlySummaryQuerySchema,
  transactionInputSchema,
  transactionListQuerySchema,
  transactionExportQuerySchema,
  updateTransactionSchema,
} from '../src/validation/financeSchemas.js';
import { buildOwnedTransactionFilter } from '../src/services/transactionService.js';

const validTransaction = {
  title: 'Coffee',
  amount: '4.50',
  type: 'expense',
  categoryId: '507f1f77bcf86cd799439011',
  date: '2026-11-06T12:30:00Z',
};

test('transaction input validates decimal amounts, dates and rejects mass assignment', () => {
  assert.equal(transactionInputSchema.safeParse(validTransaction).success, true);
  assert.equal(transactionInputSchema.safeParse({
    ...validTransaction,
    amount: '1.999',
  }).success, false);
  assert.equal(transactionInputSchema.safeParse({
    ...validTransaction,
    amount: '0',
  }).success, false);
  assert.equal(transactionInputSchema.safeParse({
    ...validTransaction,
    ownerId: '507f1f77bcf86cd799439012',
  }).success, false);
});

test('transaction updates must include at least one valid field', () => {
  assert.equal(updateTransactionSchema.safeParse({}).success, false);
  assert.equal(updateTransactionSchema.safeParse({ title: 'Updated title' }).success, true);
  assert.equal(updateTransactionSchema.safeParse({ ownerId: '507f1f77bcf86cd799439012' }).success, false);
});

test('category and query schemas reject unsupported input', () => {
  assert.equal(createCategorySchema.safeParse({ name: 'Rent', type: 'expense' }).success, true);
  assert.equal(createCategorySchema.safeParse({ name: 'Rent', type: 'expense', ownerId: 'x' }).success, false);
  assert.equal(monthlySummaryQuerySchema.safeParse({ year: '2026', month: '11' }).success, true);
  assert.equal(monthlySummaryQuerySchema.safeParse({ year: '2026', month: '13' }).success, false);
  assert.equal(transactionListQuerySchema.safeParse({ from: '2026-11-20T00:00:00Z', to: '2026-11-01T00:00:00Z' }).success, false);
});

test('report and export query schemas validate filters and date ordering', () => {
  assert.equal(customRangeQuerySchema.safeParse({
    from: '2026-11-01T00:00:00Z',
    to: '2026-11-30T23:59:59Z',
  }).success, true);
  assert.equal(customRangeQuerySchema.safeParse({
    from: '2026-11-30T00:00:00Z',
    to: '2026-11-01T00:00:00Z',
  }).success, false);
  assert.equal(transactionExportQuerySchema.safeParse({
    type: 'expense',
    from: '2026-11-01T00:00:00Z',
    to: '2026-11-30T23:59:59Z',
  }).success, true);
  assert.equal(transactionExportQuerySchema.safeParse({ ownerId: 'not-allowed' }).success, false);
});

test('transaction lookup filters always bind both transaction and owner ids', () => {
  const filter = buildOwnedTransactionFilter('owner-id', 'transaction-id');
  assert.deepEqual(filter, { _id: 'transaction-id', ownerId: 'owner-id' });
});
