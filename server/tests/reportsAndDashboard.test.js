const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const memoryStore = require('../src/db/memoryStore');
const complaintRepo = require('../src/db/repositories/complaintRepository');
const caseLinkRepo = require('../src/db/repositories/caseLinkRepository');

const { seedDevelopmentUsers } = require('../src/db/seeds/001_seed_dev_users');
const { seedInstitutionsAndComplaints } = require('../src/db/seeds/002_seed_dev_institutions_and_complaints');

let adminToken;
let rbOfficerToken;
let pgrcOfficerToken;
let seniorToken;

test.before(async () => {
  await seedDevelopmentUsers();
  await seedInstitutionsAndComplaints();

  // Login with development seed accounts
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'admin_sys', password: 'Password@123' });
  adminToken = adminRes.body.data.token;

  const rbRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'officer_rb', password: 'Password@123' });
  rbOfficerToken = rbRes.body.data.token;

  const pgrcRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'officer_pgrc', password: 'Password@123' });
  pgrcOfficerToken = pgrcRes.body.data.token;

  const seniorRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'official_senior', password: 'Password@123' });
  seniorToken = seniorRes.body.data.token;
});


test('Dashboard Metrics: Unauthenticated user is rejected with 401 Unauthorized', async () => {
  const res = await request(app).get('/api/v1/reports/metrics');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('Dashboard Metrics: Senior Official receives system-wide consolidated metrics without double counting', async () => {
  const res = await request(app)
    .get('/api/v1/reports/metrics')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  const { counters, distributions, scope, topInstitutions } = res.body.data;

  assert.strictEqual(scope.isFiltered, false);
  assert.ok(counters.totalComplaints > 0, 'Total complaints must be greater than zero');
  
  // Reconcile: Pending + Under Process + Closure Requested + Disposed + Reopened === Total Complaints
  const sumStatuses = counters.pendingCases + 
                      counters.underProcessCases + 
                      counters.closureRequestedCases + 
                      counters.disposedCases + 
                      counters.reopenedCases;
  assert.strictEqual(sumStatuses, counters.totalComplaints, 'Status counts must perfectly reconcile with total complaints without double counting');

  // Verify distributions structure
  assert.ok(distributions.bureauWorkload.REGULATION_BUREAU, 'Must include Regulation Bureau workload');
  assert.ok(distributions.bureauWorkload.PGRC, 'Must include PGRC workload');
  assert.ok(distributions.ageingDistribution, 'Must include ageing distribution');
  assert.ok(Array.isArray(topInstitutions), 'Top institutions must be an array');
});

test('Dashboard Metrics: Bureau Officer is scoped to assigned Bureau jurisdiction', async () => {
  const res = await request(app)
    .get('/api/v1/reports/metrics')
    .set('Authorization', `Bearer ${rbOfficerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  const { scope, distributions, counters } = res.body.data;
  assert.strictEqual(scope.isFiltered, true);
  assert.strictEqual(scope.jurisdiction, 'REGULATION_BUREAU');

  // The scoped total complaints should equal Regulation Bureau's workload
  assert.strictEqual(counters.totalComplaints, distributions.bureauWorkload.REGULATION_BUREAU.total);
});

test('Search & Reporting: Multi-criteria filtering by Category, Status, and Bureau', async () => {
  const res = await request(app)
    .get('/api/v1/reports/search?bureau=PGRC&status=RECEIVED')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.items));

  // All returned items must match requested filters
  res.body.data.items.forEach(item => {
    assert.strictEqual(item.bureau, 'PGRC');
    assert.strictEqual(item.status, 'RECEIVED');
    assert.ok(item.slaStatus, 'Each item must have a dynamically calculated SLA status');
  });
});

test('Search & Reporting: Scope enforcement prevents Bureau Officer from querying other Bureaus', async () => {
  // RB Officer attempts to query PGRC
  const res = await request(app)
    .get('/api/v1/reports/search?bureau=PGRC')
    .set('Authorization', `Bearer ${rbOfficerToken}`);

  assert.strictEqual(res.status, 200);
  // Backend silently overrides or enforces scope to REGULATION_BUREAU
  res.body.data.items.forEach(item => {
    assert.strictEqual(item.bureau, 'REGULATION_BUREAU', 'Backend must enforce officer assigned bureau scope');
  });
});

test('Search & Reporting: Overdue filter dynamically returns only cases past SLA due date', async () => {
  const res = await request(app)
    .get('/api/v1/reports/search?overdueOnly=true')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(res.status, 200);
  res.body.data.items.forEach(item => {
    assert.strictEqual(item.slaStatus.isOverdue, true, 'All filtered items must be dynamically overdue');
  });
});

test('CSV Export: Authorized CSV download returns proper Content-Type and headers', async () => {
  const res = await request(app)
    .get('/api/v1/reports/export-csv')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(res.status, 200);
  assert.ok(res.headers['content-type'].includes('text/csv'));
  assert.ok(res.headers['content-disposition'].includes('attachment; filename='));
  
  // CSV header row must be present
  assert.ok(res.text.startsWith('"Case ID","AICTE Permanent ID","Institution Name"'));
});

test('CSV Export: Anti-Formula-Injection protection sanitizes dangerous spreadsheet prefixes', async () => {
  // Create a complaint with potentially malicious formula injection payload in subject
  const maliciousComplaint = await complaintRepo.create({
    institution_id: 'inst-rb-01',
    bureau: 'REGULATION_BUREAU',
    category: 'FACULTY_GRIEVANCE',
    subject: '=cmd|’ /C calc’!A0 Malicious Formula Injection Test',
    description: '+@SUM(1+1) Testing formula neutralization',
    created_by: 'usr-admin-01',
    expected_disposal_date: '2026-11-20'
  });

  const res = await request(app)
    .get(`/api/v1/reports/export-csv?caseId=${maliciousComplaint.case_id}`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  
  // Ensure the subject and description formula prefixes are neutralized with a prepended single quote (')
  assert.ok(res.text.includes("'=cmd|"), 'Dangerous formula leading with = must be prepended with a single quote');

});
