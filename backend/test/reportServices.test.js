import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Transaction } from '../src/models/Transaction.js';
import { getDailyBreakdown, getMonthlyTrends } from '../src/services/transactionService.js';

const userId = '507f1f77bcf86cd799439011';

test('monthly trends include twelve UTC months and fill empty months with zeroes', async () => {
  const originalAggregate = Transaction.aggregate;
  Transaction.aggregate = async (pipeline) => {
    assert.deepEqual(pipeline[0].$match.ownerId.toString(), userId);
    return [{
      year: 2026,
      month: 11,
      income: '2400',
      expense: '900',
      balance: '1500',
    }];
  };

  try {
    const result = await getMonthlyTrends(userId, new Date('2026-11-08T12:00:00Z'));
    assert.equal(result.months.length, 12);
    assert.deepEqual(result.months[0], {
      year: 2025,
      month: 12,
      income: '0',
      expense: '0',
      balance: '0',
    });
    assert.deepEqual(result.months.at(-1), {
      year: 2026,
      month: 11,
      income: '2400',
      expense: '900',
      balance: '1500',
    });
  } finally {
    Transaction.aggregate = originalAggregate;
  }
});

test('daily breakdown includes every day in a leap-year month', async () => {
  const originalAggregate = Transaction.aggregate;
  Transaction.aggregate = async (pipeline) => {
    assert.deepEqual(pipeline[0].$match.ownerId.toString(), userId);
    return [{
      date: '2024-02-29',
      income: '100',
      expense: '20',
      balance: '80',
    }];
  };

  try {
    const result = await getDailyBreakdown(userId, { year: 2024, month: 2 });
    assert.equal(result.days.length, 29);
    assert.equal(result.days[0].date, '2024-02-01');
    assert.equal(result.days[0].income, '0');
    assert.deepEqual(result.days.at(-1), {
      date: '2024-02-29',
      income: '100',
      expense: '20',
      balance: '80',
    });
  } finally {
    Transaction.aggregate = originalAggregate;
  }
});
