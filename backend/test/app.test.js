import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';

const hasBuiltFrontend = existsSync(fileURLToPath(
  new URL('../../frontend/dist/index.html', import.meta.url),
));
let server;
let baseUrl;

before(async () => {
  process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-123456';
  process.env.FRONTEND_ORIGINS = 'http://localhost:5173';
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
    ['/auth/refresh', 'post', false],
    ['/auth/logout', 'post', false],
    ['/auth/profile', 'get', true],
    ['/categories', 'get', true],
    ['/categories', 'post', true],
    ['/transactions', 'get', true],
    ['/transactions', 'post', true],
    ['/transactions/monthly-summary', 'get', true],
    ['/transactions/reports/monthly-trends', 'get', true],
    ['/transactions/reports/daily-breakdown', 'get', true],
    ['/transactions/reports/custom-range', 'get', true],
    ['/transactions/export', 'get', true],
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

test('Express serves the built frontend for browser entry routes', {
  skip: !hasBuiltFrontend,
}, async () => {
  for (const path of ['/login', '/register', '/app/dashboard', '/app/reports']) {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { accept: 'text/html' },
    });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /Ledgerly/);
  }
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

test('refresh rejects missing cookies and logout clears the refresh cookie', async () => {
  const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST' });
  assert.equal(refreshResponse.status, 401);
  assert.match(refreshResponse.headers.get('set-cookie'), /refreshToken=;/);
  assert.match(refreshResponse.headers.get('set-cookie'), /HttpOnly/i);

  const logoutResponse = await fetch(`${baseUrl}/auth/logout`, { method: 'POST' });
  assert.equal(logoutResponse.status, 204);
  assert.match(logoutResponse.headers.get('set-cookie'), /refreshToken=;/);
});

test('same-origin browser API requests are not blocked by the cross-origin allowlist', async () => {
  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { origin: baseUrl },
  });

  assert.equal(response.status, 401);
});

test('only configured cross-origin browser clients are allowed', async () => {
  const allowedResponse = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { origin: 'http://localhost:5173' },
  });
  assert.equal(allowedResponse.status, 401);
  assert.equal(allowedResponse.headers.get('access-control-allow-origin'), 'http://localhost:5173');

  const deniedResponse = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { origin: 'http://untrusted.example' },
  });
  assert.equal(deniedResponse.status, 403);
  assert.deepEqual(await deniedResponse.json(), { error: 'Request origin is not allowed' });
});

test('transaction and category routes require authentication', async () => {
  const protectedRequests = [
    { path: '/transactions', method: 'GET' },
    { path: '/transactions/monthly-summary?year=2026&month=11', method: 'GET' },
    { path: '/transactions/reports/monthly-trends', method: 'GET' },
    { path: '/transactions/reports/daily-breakdown?year=2026&month=11', method: 'GET' },
    { path: '/transactions/reports/custom-range?from=2026-11-01T00%3A00%3A00Z&to=2026-11-30T23%3A59%3A59Z', method: 'GET' },
    { path: '/transactions/export', method: 'GET' },
    { path: '/categories', method: 'GET' },
    { path: '/upload/profile-picture', method: 'POST' },
    { path: '/admin/overview', method: 'GET' },
  ];

  for (const { path, method } of protectedRequests) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    assert.equal(response.status, 401, path);
  }
});
