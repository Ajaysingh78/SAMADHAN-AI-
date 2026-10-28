const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { seedDevelopmentUsers } = require('../src/db/seeds/001_seed_dev_users');
const { seedInstitutionsAndComplaints } = require('../src/db/seeds/002_seed_dev_institutions_and_complaints');

let rbToken = '';

test.before(async () => {
  await seedDevelopmentUsers();
  await seedInstitutionsAndComplaints();

  const rbLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_rb', password: 'Password@123' });
  rbToken = rbLogin.body.data.token;
});

test('Workflow: Valid transition progression updates status and records timeline action', async () => {
  // 1. Create a fresh complaint in RECEIVED status
  const createRes = await request(app)
    .post('/api/v1/complaints')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      institutionId: 'inst-syn-001',
      bureau: 'REGULATION_BUREAU',
      category: 'CAPITATION_FEE',
      subject: 'Workflow progression test case',
      description: 'Testing valid status progression sequence.'
    });

  const complaintId = createRes.body.data.id;
  assert.strictEqual(createRes.body.data.status, 'RECEIVED');

  // 2. Transition: RECEIVED -> VALIDATION_ASSIGNMENT (Valid)
  const step1 = await request(app)
    .patch(`/api/v1/complaints/${complaintId}/status`)
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      newStatus: 'VALIDATION_ASSIGNMENT',
      remarks: 'Primary scrutiny completed. Moving to scrutiny board assignment.'
    });

  assert.strictEqual(step1.status, 200);
  assert.strictEqual(step1.body.data.status, 'VALIDATION_ASSIGNMENT');

  // 3. Transition: VALIDATION_ASSIGNMENT -> UNDER_PROCESS (Valid)
  const step2 = await request(app)
    .patch(`/api/v1/complaints/${complaintId}/status`)
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      newStatus: 'UNDER_PROCESS',
      remarks: 'Show-cause letter dispatched. Formal inquiry active.'
    });

  assert.strictEqual(step2.status, 200);
  assert.strictEqual(step2.body.data.status, 'UNDER_PROCESS');

  // 4. Transition: UNDER_PROCESS -> DISPOSED (Valid)
  const step3 = await request(app)
    .patch(`/api/v1/complaints/${complaintId}/status`)
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      newStatus: 'DISPOSED',
      remarks: 'Institution submitted compliance undertaking. Fine levied and verified.'
    });

  assert.strictEqual(step3.status, 200);
  assert.strictEqual(step3.body.data.status, 'DISPOSED');

  // 5. Verify Timeline has all actions logged
  const timelineRes = await request(app)
    .get(`/api/v1/complaints/${complaintId}/timeline`)
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(timelineRes.status, 200);
  assert.ok(timelineRes.body.data.length >= 4);
});

test('Workflow: Illegal transition is rejected with 400 INVALID_WORKFLOW_TRANSITION', async () => {
  // Create complaint in RECEIVED status
  const createRes = await request(app)
    .post('/api/v1/complaints')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      institutionId: 'inst-syn-001',
      bureau: 'REGULATION_BUREAU',
      category: 'CAPITATION_FEE',
      subject: 'Illegal skip test case',
      description: 'Testing illegal jump from RECEIVED to REVIEW_COORDINATION.'
    });

  const complaintId = createRes.body.data.id;

  // Attempt illegal jump: RECEIVED -> REVIEW_COORDINATION
  const res = await request(app)
    .patch(`/api/v1/complaints/${complaintId}/status`)
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      newStatus: 'REVIEW_COORDINATION',
      remarks: 'Illegal jump should fail.'
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'INVALID_WORKFLOW_TRANSITION');
});

test('Workflow: Officer assignment updates handling officer and logs action', async () => {
  const createRes = await request(app)
    .post('/api/v1/complaints')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      institutionId: 'inst-syn-001',
      bureau: 'REGULATION_BUREAU',
      category: 'CAPITATION_FEE',
      subject: 'Assignment test case',
      description: 'Testing officer assignment.'
    });

  const complaintId = createRes.body.data.id;

  const assignRes = await request(app)
    .patch(`/api/v1/complaints/${complaintId}/assign`)
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      officerId: 'usr-rb-01',
      remarks: 'Assigned to Shri Rajesh Kumar for regulatory inspection.'
    });

  assert.strictEqual(assignRes.status, 200);
  assert.strictEqual(assignRes.body.data.assigned_officer_id, 'usr-rb-01');
});
