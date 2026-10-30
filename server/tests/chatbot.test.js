const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { seedDevelopmentUsers } = require('../src/db/seeds/001_seed_dev_users');
const { seedInstitutionsAndComplaints } = require('../src/db/seeds/002_seed_dev_institutions_and_complaints');

let officerToken = null;

test('Chatbot Test Setup: Seed users and obtain Officer auth token', async () => {
  await seedDevelopmentUsers();
  await seedInstitutionsAndComplaints();

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      username: 'officer_pgrc',
      password: 'Password@123'
    });

  assert.strictEqual(loginRes.status, 200);
  assert.ok(loginRes.body.data.token);
  officerToken = loginRes.body.data.token;
});

test('Chatbot Public: Rejects empty query with 400 INVALID_QUERY', async () => {
  const res = await request(app)
    .post('/api/v1/chatbot/query')
    .send({ message: '' });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.error.code, 'INVALID_QUERY');
});

test('Chatbot Public: Answers fee refund query with AICTE statutory guidelines', async () => {
  const res = await request(app)
    .post('/api/v1/chatbot/query')
    .send({ message: 'What is the AICTE fee refund policy if I withdraw my seat?' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.userMode, 'CITIZEN');
  assert.strictEqual(res.body.data.intent, 'POLICY_FEE_REFUND');
  assert.ok(res.body.data.answer.includes('1,000'));
  assert.ok(res.body.data.answer.includes('PGRC'));
  assert.ok(Array.isArray(res.body.data.suggestions));
});

test('Chatbot Public: Answers anti-ragging helpline inquiry', async () => {
  const res = await request(app)
    .post('/api/v1/chatbot/query')
    .send({ message: 'How to report ragging in college?' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.intent, 'POLICY_ANTI_RAGGING');
  assert.ok(res.body.data.answer.includes('1800-180-5522'));
});

test('Chatbot Public: Tracks case CMP-2026-PGRC-0010 with privacy-safe masking', async () => {
  const res = await request(app)
    .post('/api/v1/chatbot/query')
    .send({ message: 'Track status of CMP-2026-PGRC-0010' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.userMode, 'CITIZEN');
  assert.strictEqual(res.body.data.intent, 'CITIZEN_CASE_LOOKUP');
  assert.ok(res.body.data.answer.includes('CMP-2026-PGRC-0010'));
  assert.ok(res.body.data.answer.includes('AICTE Grievance Status'));
  assert.ok(res.body.data.answer.includes('masked')); // Verifies privacy statement
});

test('Chatbot Officer: Tracks case CMP-2026-PGRC-0010 with operational dossier and SLA health', async () => {
  const res = await request(app)
    .post('/api/v1/chatbot/query')
    .set('Authorization', `Bearer ${officerToken}`)
    .send({ message: 'Inspect CMP-2026-PGRC-0010' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.userMode, 'OFFICER');
  assert.strictEqual(res.body.data.intent, 'OFFICER_CASE_LOOKUP');
  assert.ok(res.body.data.answer.includes('Case Dossier'));
  assert.ok(res.body.data.answer.includes('SLA Health'));
  assert.ok(res.body.data.metadata?.id);
});

test('Chatbot Officer: Summarizes overdue cases and SLA health', async () => {
  const res = await request(app)
    .post('/api/v1/chatbot/query')
    .set('Authorization', `Bearer ${officerToken}`)
    .send({ message: 'Show me all overdue cases' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.userMode, 'OFFICER');
  assert.strictEqual(res.body.data.intent, 'OFFICER_OVERDUE_SUMMARY');
  assert.ok(res.body.data.answer.includes('SLA Operational Alert Summary'));
});

test('Chatbot Officer: Summarizes cross-bureau match alerts', async () => {
  const res = await request(app)
    .post('/api/v1/chatbot/query')
    .set('Authorization', `Bearer ${officerToken}`)
    .send({ message: 'Are there any cross-bureau match alerts?' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.userMode, 'OFFICER');
  assert.strictEqual(res.body.data.intent, 'OFFICER_MATCH_ALERTS');
  assert.ok(res.body.data.answer.includes('Cross-Bureau Case Intelligence'));
});
