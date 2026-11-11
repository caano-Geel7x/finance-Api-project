import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

test('refresh consumes the old token and stores only a hash for the rotated token', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-123456';
  const [{ RefreshToken }, { User }, authService] = await Promise.all([
    import('../src/models/RefreshToken.js'),
    import('../src/models/User.js'),
    import('../src/services/authService.js'),
  ]);
  const originalFindOneAndDelete = RefreshToken.findOneAndDelete;
  const originalCreate = RefreshToken.create;
  const originalFindById = User.findById;
  const oldToken = 'previous-refresh-secret';
  const oldHash = createHash('sha256').update(oldToken).digest('hex');
  let consumedQuery;
  let storedToken;

  RefreshToken.findOneAndDelete = async (query) => {
    consumedQuery = query;
    return { userId: '507f1f77bcf86cd799439011' };
  };
  RefreshToken.create = async (record) => {
    storedToken = record;
    return record;
  };
  User.findById = async (id) => ({
    id: id.toString(),
    name: 'Taylor',
    email: 'taylor@example.com',
    role: 'user',
    profilePictureUrl: null,
  });

  try {
    const session = await authService.refreshSession(oldToken);
    const expectedNewHash = createHash('sha256').update(session.refreshToken).digest('hex');

    assert.equal(consumedQuery.tokenHash, oldHash);
    assert.ok(consumedQuery.expiresAt.$gt instanceof Date);
    assert.equal(session.user.email, 'taylor@example.com');
    assert.match(session.accessToken, /^ey/);
    assert.notEqual(session.refreshToken, oldToken);
    assert.equal(storedToken.tokenHash, expectedNewHash);
    assert.notEqual(storedToken.tokenHash, session.refreshToken);
    assert.ok(storedToken.expiresAt instanceof Date);
  } finally {
    RefreshToken.findOneAndDelete = originalFindOneAndDelete;
    RefreshToken.create = originalCreate;
    User.findById = originalFindById;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});
