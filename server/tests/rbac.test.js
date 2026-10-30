const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { seedDevelopmentUsers } = require('../src/db/seeds/001_seed_dev_users');

let adminToken = '';
let rbToken = '';
let pgrcToken = '';
let regionalToken = '';
let seniorToken = '';

test.before(async () => {
  await seedDevelopmentUsers();

  const adminLogin = await request(app).post('/api/v1/auth/login').send({ username: 'admin_sys', password: 'Password@123' });
  adminToken = adminLogin.body.data.token;

  const rbLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_rb', password: 'Password@123' });
  rbToken = rbLogin.body.data.token;

  const pgrcLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_pgrc', password: 'Password@123' });
  pgrcToken = pgrcLogin.body.data.token;

  const regLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_regional', password: 'Password@123' });
  regionalToken = regLogin.body.data.token;

  const seniorLogin = await request(app).post('/api/v1/auth/login').send({ username: 'official_senior', password: 'Password@123' });
  seniorToken = seniorLogin.body.data.token;
});

test('RBAC: Bureau Officer is denied access to Admin user management with 403', async () => {
  const res = await request(app)
    .get('/api/v1/admin/users')
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_ROLE');
});

test('RBAC: System Admin can view user list with 200 OK', async () => {
  const res = await request(app)
    .get('/api/v1/admin/users')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 5);
});

test('Bureau Scoping: RB Officer can access RB-scoped records with 200 OK', async () => {
  const res = await request(app)
    .get('/api/v1/cases/rb-scoped')
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.bureau, 'REGULATION_BUREAU');
});

test('Bureau Scoping: RB Officer is denied access to PGRC-scoped records with 403 Forbidden', async () => {
  const res = await request(app)
    .get('/api/v1/cases/pgrc-scoped')
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_BUREAU_SCOPE');
  assert.ok(res.body.error.message.includes('REGULATION_BUREAU'));
});

test('Bureau Scoping: PGRC Officer can access PGRC-scoped records with 200 OK', async () => {
  const res = await request(app)
    .get('/api/v1/cases/pgrc-scoped')
    .set('Authorization', `Bearer ${pgrcToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.bureau, 'PGRC');
});

test('Oversight: Senior Official can access cross-bureau oversight records with 200 OK', async () => {
  const res = await request(app)
    .get('/api/v1/cases/oversight')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.accessLevel, 'CROSS_BUREAU_OVERSIGHT');
});

test('Oversight: Bureau Officer is denied cross-bureau oversight records with 403', async () => {
  const res = await request(app)
    .get('/api/v1/cases/oversight')
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_ROLE');
});

test('Admin Provisioning: Admin can provision a new officer account with 201 Created', async () => {
  const uniqueUser = `officer_new_${Date.now()}`;
  const res = await request(app)
    .post('/api/v1/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      username: uniqueUser,
      email: `${uniqueUser}@samadhanX.aicte.gov.in`,
      password: 'Password@123',
      fullName: 'New Scrutiny Officer',
      role: 'BUREAU_OFFICER',
      primaryBureau: 'REGULATION_BUREAU',
      region: 'ALL'
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.username, uniqueUser);
  assert.strictEqual(res.body.data.role, 'BUREAU_OFFICER');
  assert.strictEqual(res.body.data.password_hash, undefined);
});

test('Admin Provisioning: Non-admin is rejected from creating users with 403', async () => {
  const res = await request(app)
    .post('/api/v1/admin/users')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      username: 'hacker_user',
      email: 'hacker@test.com',
      password: 'Password@123',
      fullName: 'Fake Officer',
      role: 'ADMIN'
    });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_ROLE');
});

test('Admin Audit: Admin can retrieve security audit trail with 200 OK', async () => {
  const res = await request(app)
    .get('/api/v1/admin/audit-logs')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length > 0);
  assert.ok(res.body.data.some(log => log.event_type.startsWith('AUTH_') || log.event_type.startsWith('ADMIN_')));
});
