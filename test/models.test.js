import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Category } from '../src/models/Category.js';
import { Transaction } from '../src/models/Transaction.js';
import { User } from '../src/models/User.js';

test('user rejects unsupported fields and invalid roles', () => {
  const invalidRole = new User({
    name: 'Taylor',
    email: 'taylor@example.com',
    passwordHash: 'already-hashed',
    role: 'owner',
  });

  assert.equal(invalidRole.validateSync().errors.role.kind, 'enum');

  assert.throws(() => new User({
    name: 'Taylor',
    email: 'taylor@example.com',
    passwordHash: 'already-hashed',
    isAdmin: true,
  }), /isAdmin/);
});

test('transaction requires an owner and positive amount', () => {
  const transaction = new Transaction({
    title: 'Coffee',
    amount: '-1.00',
    type: 'expense',
    categoryId: '507f1f77bcf86cd799439011',
    date: new Date(),
  });
  const errors = transaction.validateSync().errors;

  assert.ok(errors.ownerId);
  assert.match(errors.amount.message, /greater than zero/);
});

test('category only accepts supported transaction types', () => {
  const category = new Category({
    name: 'Salary',
    normalizedName: 'salary',
    type: 'transfer',
  });

  assert.equal(category.validateSync().errors.type.kind, 'enum');
});
