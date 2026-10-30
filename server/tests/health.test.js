const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

test('GET / returns API service information', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.service, 'samadhanX Case Intelligence Platform API');
  assert.strictEqual(res.body.version, '1.0.0');
});

test('GET /api/v1/health returns healthy status and standard contract envelope', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.status, 'healthy');
  assert.strictEqual(res.body.data.service, 'samadhanX-api');
  assert.ok(typeof res.body.data.uptimeSeconds === 'number');
  assert.ok(res.body.data.database !== undefined);
});

test('GET /api/v1/non-existent-route returns standard 404 envelope', async () => {
  const res = await request(app).get('/api/v1/non-existent-route');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'ROUTE_NOT_FOUND');
  assert.ok(res.body.error.message.includes('not found'));
});
