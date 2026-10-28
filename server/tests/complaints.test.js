const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { seedDevelopmentUsers } = require('../src/db/seeds/001_seed_dev_users');
const { seedInstitutionsAndComplaints } = require('../src/db/seeds/002_seed_dev_institutions_and_complaints');

let rbToken = '';
let pgrcToken = '';
let seniorToken = '';

test.before(async () => {
  await seedDevelopmentUsers();
  await seedInstitutionsAndComplaints();

  const rbLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_rb', password: 'Password@123' });
  rbToken = rbLogin.body.data.token;

  const pgrcLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_pgrc', password: 'Password@123' });
  pgrcToken = pgrcLogin.body.data.token;

  const seniorLogin = await request(app).post('/api/v1/auth/login').send({ username: 'official_senior', password: 'Password@123' });
  seniorToken = seniorLogin.body.data.token;
});

test('Complaints: GET /api/v1/complaints enforces Bureau Officer jurisdiction scoping', async () => {
  const rbRes = await request(app)
    .get('/api/v1/complaints')
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(rbRes.status, 200);
  assert.strictEqual(rbRes.body.success, true);
  // All complaints returned to RB officer must be REGULATION_BUREAU
  for (const c of rbRes.body.data) {
    assert.strictEqual(c.bureau, 'REGULATION_BUREAU');
  }

  const pgrcRes = await request(app)
    .get('/api/v1/complaints')
    .set('Authorization', `Bearer ${pgrcToken}`);

  assert.strictEqual(pgrcRes.status, 200);
  for (const c of pgrcRes.body.data) {
    assert.strictEqual(c.bureau, 'PGRC');
  }
});

test('Complaints: Senior Official can view cross-bureau complaints list', async () => {
  const res = await request(app)
    .get('/api/v1/complaints')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(res.status, 200);
  const bureaus = new Set(res.body.data.map(c => c.bureau));
  assert.ok(bureaus.has('REGULATION_BUREAU'));
  assert.ok(bureaus.has('PGRC'));
});

test('Complaints: POST /api/v1/complaints creates complaint and initial action timeline record', async () => {
  const res = await request(app)
    .post('/api/v1/complaints')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      institutionId: 'inst-syn-002',
      bureau: 'REGULATION_BUREAU',
      category: 'FACULTY_GRIEVANCE',
      severity: 'HIGH',
      complainantType: 'FACULTY',
      subject: 'Show-cause notice initiated regarding faculty salary dispute',
      description: 'Formal regulatory inquiry into arbitrary contract termination of assistant professors.',
      slaDays: 30
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.case_id.startsWith('CMP-'));
  assert.strictEqual(res.body.data.status, 'RECEIVED');

  // Verify timeline action was generated
  const timelineRes = await request(app)
    .get(`/api/v1/complaints/${res.body.data.id}/timeline`)
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(timelineRes.status, 200);
  assert.ok(timelineRes.body.data.length >= 1);
  assert.strictEqual(timelineRes.body.data[0].action_type, 'CASE_REGISTERED');
});

test('Complaints: Cross-Bureau registration attempt is denied with 403 Forbidden', async () => {
  const res = await request(app)
    .post('/api/v1/complaints')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      institutionId: 'inst-syn-002',
      bureau: 'PGRC', // RB officer attempting to register in PGRC
      category: 'CAPITATION_FEE',
      subject: 'Unauthorized cross-bureau registration',
      description: 'This attempt must be blocked.'
    });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_BUREAU_SCOPE');
});

test('Complaints: Referencing a non-existent institution returns 404', async () => {
  const res = await request(app)
    .post('/api/v1/complaints')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      institutionId: 'inst-does-not-exist-999',
      bureau: 'REGULATION_BUREAU',
      category: 'CAPITATION_FEE',
      subject: 'Invalid college complaint',
      description: 'Should fail validation'
    });

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'INSTITUTION_NOT_FOUND');
});
