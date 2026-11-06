import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAllowedImageMimeType } from '../src/middleware/profileImageUpload.js';
import { detectSupportedImage } from '../src/services/uploadService.js';
import { requireAdmin } from '../src/middleware/authenticate.js';

test('image content is accepted based on recognized file signatures', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', 'base64');
  const detected = await detectSupportedImage(png);

  assert.equal(detected.mime, 'image/png');
});

test('unsupported or unrecognized file contents are rejected', async () => {
  await assert.rejects(
    detectSupportedImage(Buffer.from('not actually an image')),
    { status: 415 },
  );
  await assert.rejects(
    detectSupportedImage(Buffer.from('R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', 'base64')),
    { status: 415 },
  );
});

test('upload MIME allowlist blocks SVG and other unsupported types', () => {
  assert.equal(isAllowedImageMimeType('image/jpeg'), true);
  assert.equal(isAllowedImageMimeType('image/png'), true);
  assert.equal(isAllowedImageMimeType('image/webp'), true);
  assert.equal(isAllowedImageMimeType('image/svg+xml'), false);
  assert.equal(isAllowedImageMimeType('application/octet-stream'), false);
});

test('admin role middleware rejects regular users', () => {
  let receivedError;
  requireAdmin({ user: { role: 'user' } }, {}, (error) => {
    receivedError = error;
  });

  assert.equal(receivedError.status, 403);
});
