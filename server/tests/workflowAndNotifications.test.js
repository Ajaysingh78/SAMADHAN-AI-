const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const memoryStore = require('../src/db/memoryStore');
const { seedDevelopmentUsers } = require('../src/db/seeds/001_seed_dev_users');
const { seedInstitutionsAndComplaints } = require('../src/db/seeds/002_seed_dev_institutions_and_complaints');
const { calculateSlaStatus } = require('../src/services/workflowService');

let rbToken = '';
let pgrcToken = '';
let seniorToken = '';
let adminToken = '';
let testComplaint = null;

test.before(async () => {
  await seedDevelopmentUsers();
  await seedInstitutionsAndComplaints();

  const rbLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_rb', password: 'Password@123' });
  rbToken = rbLogin.body.data.token;

  const pgrcLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_pgrc', password: 'Password@123' });
  pgrcToken = pgrcLogin.body.data.token;

  const seniorLogin = await request(app).post('/api/v1/auth/login').send({ username: 'official_senior', password: 'Password@123' });
  seniorToken = seniorLogin.body.data.token;

  const adminLogin = await request(app).post('/api/v1/auth/login').send({ username: 'admin_sys', password: 'Password@123' });
  adminToken = adminLogin.body.data.token;

  // Retrieve an active RB complaint
  const allComplaints = Array.from(memoryStore.complaints.values());
  testComplaint = allComplaints.find(c => c.bureau === 'REGULATION_BUREAU');
});

test('Workflow: Valid status transition executes and records timeline action', async () => {
  const res = await request(app)
    .post(`/api/v1/workflow/complaints/${testComplaint.id}/transition`)
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      newStatus: 'UNDER_PROCESS',
      remarks: 'Transitioning to active investigation under assigned bureau officer.'
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.complaint.status, 'UNDER_PROCESS');

  // Verify action was appended
  const actionsRes = await request(app)
    .get(`/api/v1/workflow/complaints/${testComplaint.id}/actions`)
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(actionsRes.status, 200);
  const found = actionsRes.body.data.actions.find(a => a.new_status === 'UNDER_PROCESS');
  assert.ok(found, 'Must record transition action in timeline');
});

test('Workflow: Invalid status transition is rejected with 400', async () => {
  // Jump from REVIEW_COORDINATION to RECEIVED is illegal in the state machine
  const res = await request(app)
    .post(`/api/v1/workflow/complaints/${testComplaint.id}/transition`)
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      newStatus: 'RECEIVED',
      remarks: 'Attempting invalid jump back to registered state.'
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'INVALID_WORKFLOW_TRANSITION');
});

test('Workflow: Unauthorized transfer attempt by officer from another bureau is denied with 403', async () => {
  // PGRC officer trying to transfer an RB case
  const res = await request(app)
    .post(`/api/v1/workflow/complaints/${testComplaint.id}/transfer`)
    .set('Authorization', `Bearer ${pgrcToken}`)
    .send({
      destinationBureau: 'PGRC',
      transferReason: 'Attempting transfer across bureaus without authority'
    });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_JURISDICTION');
});

test('Workflow: Authorized transfer succeeds and records previous/new bureau in action history', async () => {
  const res = await request(app)
    .post(`/api/v1/workflow/complaints/${testComplaint.id}/transfer`)
    .set('Authorization', `Bearer ${seniorToken}`)
    .send({
      destinationBureau: 'APPROVAL_BUREAU',
      transferReason: 'Grievance involves building approval irregularities falling under Approval Bureau jurisdiction.'
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.complaint.bureau, 'APPROVAL_BUREAU');

  const actionsRes = await request(app)
    .get(`/api/v1/workflow/complaints/${testComplaint.id}/actions`)
    .set('Authorization', `Bearer ${seniorToken}`);

  const transferAction = actionsRes.body.data.actions.find(a => a.action_type === 'CASE_TRANSFERRED');
  assert.ok(transferAction, 'Must record CASE_TRANSFERRED in timeline');
  assert.ok(transferAction.remarks.includes('APPROVAL BUREAU'));
});

test('Workflow: Escalation sets severity to CRITICAL and notifies Senior Official', async () => {
  const res = await request(app)
    .post(`/api/v1/workflow/complaints/${testComplaint.id}/escalate`)
    .set('Authorization', `Bearer ${seniorToken}`)
    .send({
      escalationReason: 'Allegations of safety hazards requiring immediate site inspection.'
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.complaint.severity, 'CRITICAL');

  // Verify notification was created for Senior Official
  const notifRes = await request(app)
    .get('/api/v1/workflow/notifications')
    .set('Authorization', `Bearer ${seniorToken}`);

  const escalationNotif = notifRes.body.data.items.find(n => n.event_type === 'CASE_ESCALATED');
  assert.ok(escalationNotif, 'Senior official should receive escalation notification');
});

test('Workflow: Case closure with review disabled closes directly to DISPOSED', async () => {
  // Ensure closure review is disabled
  memoryStore.setWorkflowConfig('REQUIRE_CLOSURE_REVIEW', 'false');

  const res = await request(app)
    .post(`/api/v1/workflow/complaints/${testComplaint.id}/transition`)
    .set('Authorization', `Bearer ${seniorToken}`)
    .send({
      newStatus: 'DISPOSED',
      remarks: 'Comprehensive inquiry concluded. Recommendations submitted to council.'
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.complaint.status, 'DISPOSED');
});

test('Workflow: Case reopening requires Senior Official and records CASE_REOPENED timeline entry', async () => {
  // Bureau officer cannot reopen disposed case
  const unauthorizedRes = await request(app)
    .post(`/api/v1/workflow/complaints/${testComplaint.id}/transition`)
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      newStatus: 'REOPENED',
      remarks: 'Unauthorized officer trying to reopen closed case.'
    });

  assert.strictEqual(unauthorizedRes.status, 403);

  // Senior Official can reopen
  const authorizedRes = await request(app)
    .post(`/api/v1/workflow/complaints/${testComplaint.id}/transition`)
    .set('Authorization', `Bearer ${seniorToken}`)
    .send({
      newStatus: 'REOPENED',
      remarks: 'Additional credible evidence submitted by complainant; reopening for further inquiry.'
    });

  assert.strictEqual(authorizedRes.status, 200);
  assert.strictEqual(authorizedRes.body.data.complaint.status, 'REOPENED');
});

test('Workflow: Dynamic SLA calculation correctly handles active, overdue, and disposed states', () => {
  // Case overdue by 5 days
  const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const overdueStatus = calculateSlaStatus(pastDate, 'UNDER_PROCESS');
  assert.strictEqual(overdueStatus.isOverdue, true);
  assert.strictEqual(overdueStatus.slaState, 'OVERDUE');
  assert.strictEqual(overdueStatus.daysOverdue, 5);

  // Disposed case is never overdue
  const disposedStatus = calculateSlaStatus(pastDate, 'DISPOSED', new Date().toISOString());
  assert.strictEqual(disposedStatus.isOverdue, false);
  assert.strictEqual(disposedStatus.slaState, 'DISPOSED');

  // Case due in 2 days
  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const approachingStatus = calculateSlaStatus(futureDate, 'UNDER_PROCESS');
  assert.strictEqual(approachingStatus.isOverdue, false);
  assert.strictEqual(approachingStatus.slaState, 'APPROACHING_DEADLINE');
});

test('Workflow: Reminder deduplication prevents generating multiple identical overdue alerts on same day', async () => {
  // Run SLA scan twice
  const scan1 = await request(app)
    .post('/api/v1/workflow/cron/check-slas')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(scan1.status, 200);

  const scan2 = await request(app)
    .post('/api/v1/workflow/cron/check-slas')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(scan2.status, 200);
  // Second scan should deduplicate already generated reminders
  assert.ok(scan2.body.data.deduplicatedCount >= 0);
  assert.strictEqual(scan2.body.data.overdueAlertsCreated, 0);
});

test('Workflow: Notification read status toggle and unread count update', async () => {
  // Get unread notifications
  const notifRes = await request(app)
    .get('/api/v1/workflow/notifications')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(notifRes.status, 200);
  const items = notifRes.body.data.items;

  if (items.length > 0) {
    const target = items[0];
    const markRes = await request(app)
      .patch(`/api/v1/workflow/notifications/${target.id}/read`)
      .set('Authorization', `Bearer ${seniorToken}`);

    assert.strictEqual(markRes.status, 200);
    assert.strictEqual(markRes.body.data.read_status, true);
  }

  // Mark all as read
  const markAllRes = await request(app)
    .patch('/api/v1/workflow/notifications/read-all')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(markAllRes.status, 200);

  // Check unread count is 0
  const countRes = await request(app)
    .get('/api/v1/workflow/notifications/unread-count')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(countRes.body.data.unreadCount, 0);
});
