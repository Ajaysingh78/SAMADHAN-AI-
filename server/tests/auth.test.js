const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { seedDevelopmentUsers } = require('../src/db/seeds/001_seed_dev_users');

test.before(async () => {
  await seedDevelopmentUsers();
});

test('POST /api/v1/auth/login succeeds with valid credentials for Bureau Officer', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({
      username: 'officer_rb',
      password: 'Password@123'
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(typeof res.body.data.token === 'string');
  assert.strictEqual(res.body.data.user.username, 'officer_rb');
  assert.strictEqual(res.body.data.user.role, 'BUREAU_OFFICER');
  assert.strictEqual(res.body.data.user.primaryBureau, 'REGULATION_BUREAU');
  assert.strictEqual(res.body.data.user.password_hash, undefined); // Password hash never exposed
});

test('POST /api/v1/auth/login fails with invalid password', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({
      username: 'officer_rb',
      password: 'WrongPassword'
    });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'INVALID_CREDENTIALS');
  assert.strictEqual(res.body.error.message, 'Invalid username or password.');
});

test('POST /api/v1/auth/login fails with nonexistent user without username enumeration', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({
      username: 'nonexistent_officer_xyz',
      password: 'Password@123'
    });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'INVALID_CREDENTIALS');
  assert.strictEqual(res.body.error.message, 'Invalid username or password.');
});

test('POST /api/v1/auth/login rejects disabled accounts with 403 Forbidden', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({
      username: 'officer_disabled',
      password: 'Password@123'
    });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'ACCOUNT_DISABLED');
  assert.ok(res.body.error.message.includes('deactivated'));
});

test('GET /api/v1/auth/me returns current user session profile with valid token', async () => {
  // First login
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'officer_rb', password: 'Password@123' });

  const token = loginRes.body.data.token;

  const meRes = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.body.success, true);
  assert.strictEqual(meRes.body.data.user.username, 'officer_rb');
  assert.strictEqual(meRes.body.data.user.fullName, 'Rajesh Kumar (RB Officer)');
});

test('GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
  const res = await request(app).get('/api/v1/auth/me');

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'UNAUTHENTICATED');
});

test('GET /api/v1/auth/me rejects malformed or tampered token with 401', async () => {
  const res = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', 'Bearer invalid.token.payload');

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'INVALID_TOKEN');
});

test('POST /api/v1/auth/logout revokes token on backend preventing subsequent requests', async () => {
  // Login
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'official_senior', password: 'Password@123' });

  const token = loginRes.body.data.token;

  // Request before logout works
  const preRes = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(preRes.status, 200);

  // Logout
  const logoutRes = await request(app)
    .post('/api/v1/auth/logout')
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(logoutRes.status, 200);
  assert.strictEqual(logoutRes.body.success, true);

  // Request after logout fails with TOKEN_REVOKED
  const postRes = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(postRes.status, 401);
  assert.strictEqual(postRes.body.error.code, 'TOKEN_REVOKED');
});
