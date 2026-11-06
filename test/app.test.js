import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

let server;
let baseUrl;

before(async () => {
  process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-123456';
  const { default: app } = await import('../src/app.js');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('health endpoint responds with a minimal status', async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
  assert.ok(response.headers.has('x-content-type-options'));
});

test('Swagger UI and OpenAPI JSON are available without exposing configuration secrets', async () => {
  const uiResponse = await fetch(`${baseUrl}/docs/`);
  assert.equal(uiResponse.status, 200);
  assert.match(await uiResponse.text(), /swagger-ui/);

  const specResponse = await fetch(`${baseUrl}/docs/openapi.json`);
  assert.equal(specResponse.status, 200);
  const spec = await specResponse.json();
  assert.equal(spec.openapi, '3.0.3');
  assert.equal(spec.components.securitySchemes.bearerAuth.scheme, 'bearer');
  const expectedOperations = [
    ['/health', 'get', false],
    ['/auth/register', 'post', false],
    ['/auth/login', 'post', false],
    ['/auth/profile', 'get', true],
    ['/categories', 'get', true],
    ['/categories', 'post', true],
    ['/transactions', 'get', true],
    ['/transactions', 'post', true],
    ['/transactions/monthly-summary', 'get', true],
    ['/transactions/{id}', 'put', true],
    ['/transactions/{id}', 'delete', true],
    ['/upload/profile-picture', 'post', true],
    ['/admin/overview', 'get', true],
  ];

  for (const [path, method, protectedRoute] of expectedOperations) {
    const operation = spec.paths[path][method];
    assert.ok(operation.summary, `${method.toUpperCase()} ${path} should have a summary`);
    assert.ok(operation.responses, `${method.toUpperCase()} ${path} should document responses`);
    if (protectedRoute) assert.ok(operation.security, `${method.toUpperCase()} ${path} should require bearer auth`);
  }

  assert.ok(spec.paths['/transactions/{id}'].put.parameters.some((parameter) => parameter.name === 'id'));
  assert.ok(spec.paths['/transactions/{id}'].delete.parameters.some((parameter) => parameter.name === 'id'));
  assert.equal(JSON.stringify(spec).includes(process.env.JWT_SECRET), false);
  assert.match(spec.servers[0].url, /^http:\/\/localhost:/);
});

test('unknown endpoints return a JSON 404', async () => {
  const response = await fetch(`${baseUrl}/not-found`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Not found' });
});

test('malformed JSON is rejected with a safe 400 response', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid JSON body' });
});

test('registration rejects invalid and unexpected fields before database access', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
      role: 'admin',
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid request body' });
});

test('profile rejects missing and invalid bearer tokens', async () => {
  const missingTokenResponse = await fetch(`${baseUrl}/auth/profile`);
  assert.equal(missingTokenResponse.status, 401);

  const invalidTokenResponse = await fetch(`${baseUrl}/auth/profile`, {
    headers: { authorization: 'Bearer not-a-valid-token' },
  });
  assert.equal(invalidTokenResponse.status, 401);
});

test('transaction and category routes require authentication', async () => {
  const protectedRequests = [
    { path: '/transactions', method: 'GET' },
    { path: '/transactions/monthly-summary?year=2026&month=11', method: 'GET' },
    { path: '/categories', method: 'GET' },
    { path: '/upload/profile-picture', method: 'POST' },
    { path: '/admin/overview', method: 'GET' },
  ];

  for (const { path, method } of protectedRequests) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    assert.equal(response.status, 401, path);
  }
});
