import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginSchema, registerSchema } from '../src/validation/authSchemas.js';

test('registration normalizes email and rejects role mass assignment', () => {
  const result = registerSchema.safeParse({
    name: '  Taylor  ',
    email: 'TAYLOR@example.com',
    password: 'correct horse battery',
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    name: 'Taylor',
    email: 'taylor@example.com',
    password: 'correct horse battery',
  });

  assert.equal(registerSchema.safeParse({
    name: 'Taylor',
    email: 'taylor@example.com',
    password: 'correct horse battery',
    role: 'admin',
  }).success, false);
});

test('registration rejects passwords over bcrypt byte limit', () => {
  const result = registerSchema.safeParse({
    name: 'Taylor',
    email: 'taylor@example.com',
    password: 'é'.repeat(37),
  });

  assert.equal(result.success, false);
});

test('login rejects malformed email and oversized UTF-8 passwords', () => {
  assert.equal(loginSchema.safeParse({
    email: 'invalid',
    password: 'whatever',
  }).success, false);

  assert.equal(loginSchema.safeParse({
    email: 'taylor@example.com',
    password: 'é'.repeat(37),
  }).success, false);
});
