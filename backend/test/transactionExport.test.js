import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { Transaction } from '../src/models/Transaction.js';
import { exportCsv } from '../src/controllers/transactionController.js';

test('CSV export quotes fields and neutralizes spreadsheet formulas', async () => {
  const originalFind = Transaction.find;
  const rows = [{
    date: new Date('2026-11-08T12:00:00Z'),
    title: '=HYPERLINK("https://example.test")',
    type: 'expense',
    categoryId: { name: '+dangerous' },
    amount: { toString: () => '12.50' },
  }];
  const cursor = {
    async *[Symbol.asyncIterator]() {
      yield* rows;
    },
  };
  let queryFilter;
  Transaction.find = (filter) => {
    queryFilter = filter;
    return {
      sort() { return this; },
      populate() { return this; },
      cursor() { return cursor; },
    };
  };
  const headers = {};
  const output = [];
  const response = new Writable({
    write(chunk, _encoding, callback) {
      output.push(chunk.toString());
      callback();
    },
  });
  response.set = (values) => Object.assign(headers, values);
  let error;

  try {
    await exportCsv({
      user: { id: '507f1f77bcf86cd799439011' },
      validatedQuery: {},
    }, response, (receivedError) => { error = receivedError; });
  } finally {
    Transaction.find = originalFind;
  }

  assert.equal(error, undefined);
  assert.deepEqual(queryFilter, { ownerId: '507f1f77bcf86cd799439011' });
  assert.equal(response.writableEnded, true);
  assert.equal(headers['Content-Type'], 'text/csv; charset=utf-8');
  assert.match(output.join(''), /"'=HYPERLINK\(""https:\/\/example\.test""\)"/);
  assert.match(output.join(''), /"'\+dangerous"/);
});
