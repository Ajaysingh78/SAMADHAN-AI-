const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { seedDevelopmentUsers } = require('../src/db/seeds/001_seed_dev_users');
const { seedInstitutionsAndComplaints } = require('../src/db/seeds/002_seed_dev_institutions_and_complaints');

let rbToken = '';
let adminToken = '';

test.before(async () => {
  await seedDevelopmentUsers();
  await seedInstitutionsAndComplaints();

  const rbLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_rb', password: 'Password@123' });
  rbToken = rbLogin.body.data.token;

  const adminLogin = await request(app).post('/api/v1/auth/login').send({ username: 'admin_sys', password: 'Password@123' });
  adminToken = adminLogin.body.data.token;
});

test('Institutions: GET /api/v1/institutions lists technical institutions with pagination', async () => {
  const res = await request(app)
    .get('/api/v1/institutions')
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 4);
});

test('Institutions: GET /api/v1/institutions/:id returns 360-degree dossier with complaint history', async () => {
  const res = await request(app)
    .get('/api/v1/institutions/inst-syn-001')
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.institution.name, 'Apex Institute of Technology & Management');
  assert.strictEqual(res.body.data.institution.aicte_permanent_id, '1-109283741');
  assert.ok(Array.isArray(res.body.data.complaintHistory));
  assert.ok(res.body.data.metrics.totalComplaints >= 2);
  assert.ok(res.body.data.metrics.bureauBreakdown.REGULATION_BUREAU >= 1);
  assert.ok(res.body.data.metrics.bureauBreakdown.PGRC >= 1);
});

test('Institutions: POST /api/v1/institutions registers new technical institution', async () => {
  const uniqueAicteId = `1-${Date.now().toString().slice(-8)}`;
  const res = await request(app)
    .post('/api/v1/institutions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      aictePermanentId: uniqueAicteId,
      name: 'Himalayan Institute of Applied Engineering',
      address: 'NH-58, By-Pass',
      city: 'Dehradun',
      state: 'Uttarakhand',
      region: 'NORTHERN',
      pinCode: '248001'
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.aicte_permanent_id, uniqueAicteId);
  assert.strictEqual(res.body.data.identity_flag, 'VERIFIED');
});

test('Institutions: Duplicate AICTE Permanent ID is rejected with 409 Conflict', async () => {
  const res = await request(app)
    .post('/api/v1/institutions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      aictePermanentId: '1-109283741', // Already belongs to Apex Institute
      name: 'Fake College With Duplicate ID',
      address: 'Some Street',
      city: 'Delhi',
      state: 'Delhi',
      region: 'NORTHERN'
    });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'DUPLICATE_AICTE_ID');
});

test('Institutions: Missing AICTE Permanent ID flags record for review', async () => {
  const res = await request(app)
    .post('/api/v1/institutions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Unverified Technical School without ID',
      address: 'Rural Area, Block 4',
      city: 'Jaipur',
      state: 'Rajasthan',
      region: 'NORTHERN'
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.identity_flag, 'MISSING_AICTE_ID');
});
