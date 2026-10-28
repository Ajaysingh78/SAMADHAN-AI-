const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const memoryStore = require('../src/db/memoryStore');
const { seedDevelopmentUsers } = require('../src/db/seeds/001_seed_dev_users');
const { seedInstitutionsAndComplaints } = require('../src/db/seeds/002_seed_dev_institutions_and_complaints');
const { evaluateCasePair } = require('../src/services/caseMatchingService');
const { runBenchmarkEvaluation } = require('../src/services/benchmarkService');

let rbToken = '';
let pgrcToken = '';
let seniorToken = '';
let regionalToken = '';
let sampleRbComplaint = null;
let samplePgrcComplaint = null;

test.before(async () => {
  await seedDevelopmentUsers();
  await seedInstitutionsAndComplaints();

  const rbLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_rb', password: 'Password@123' });
  rbToken = rbLogin.body.data.token;

  const pgrcLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_pgrc', password: 'Password@123' });
  pgrcToken = pgrcLogin.body.data.token;

  const seniorLogin = await request(app).post('/api/v1/auth/login').send({ username: 'official_senior', password: 'Password@123' });
  seniorToken = seniorLogin.body.data.token;

  const regionalLogin = await request(app).post('/api/v1/auth/login').send({ username: 'officer_regional', password: 'Password@123' });
  regionalToken = regionalLogin.body.data.token;

  // Retrieve sample complaints from memoryStore
  const allComplaints = Array.from(memoryStore.complaints.values());
  sampleRbComplaint = allComplaints.find(c => c.bureau === 'REGULATION_BUREAU');
  samplePgrcComplaint = allComplaints.find(c => c.bureau === 'PGRC');
});

test('Case Intelligence: Exact-identifier and rule-based matches trigger Operational Overlap alert', async () => {
  // Trigger matching on sample RB complaint
  const res = await request(app)
    .post(`/api/v1/intelligence/match/${sampleRbComplaint.id}`)
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.alerts));

  // Verify at least one alert generated for the same college (e.g. Apex Institute has both RB and PGRC complaints)
  const alert = res.body.data.alerts.find(a => a.relationship_classification === 'POTENTIAL_OPERATIONAL_OVERLAP');
  assert.ok(alert, 'Should detect POTENTIAL_OPERATIONAL_OVERLAP on shared institution cross-bureau cases');
  assert.ok(alert.confidence_score > 0.40);
  assert.ok(alert.rule_flags.includes('CROSS_BUREAU_INVOLVEMENT'));
});

test('Case Intelligence: Similar text with different institutions is classified as POTENTIALLY_RELATED_COMPLAINTS, not operational overlap', () => {
  const sourceComplaint = {
    id: 'C-A',
    bureau: 'REGULATION_BUREAU',
    status: 'UNDER_PROCESS',
    category: 'Approval & Affiliation',
    complainant_type: 'CITIZEN',
    subject: 'AICTE norm non-compliance and teacher student ratio failure',
    description: 'Institution violates Approval Process Handbook teacher student ratio and safety norms.'
  };

  const candComplaint = {
    id: 'C-B',
    bureau: 'REGULATION_BUREAU',
    status: 'UNDER_PROCESS',
    category: 'Approval & Affiliation',
    complainant_type: 'CITIZEN',
    subject: 'AICTE norm non-compliance and teacher student ratio failure',
    description: 'Institution violates Approval Process Handbook teacher student ratio and safety norms.'
  };

  const instA = { id: 'I-1', aicte_permanent_id: '1-11111111', name: 'Alpha Institute', identity_flag: 'VERIFIED' };
  const instB = { id: 'I-2', aicte_permanent_id: '1-22222222', name: 'Beta College', identity_flag: 'VERIFIED' };

  const evalResult = evaluateCasePair(sourceComplaint, candComplaint, instA, instB);

  assert.strictEqual(evalResult.institutionMatchType, 'DIFFERENT_INSTITUTION');
  assert.strictEqual(evalResult.relationshipClassification, 'POTENTIALLY_RELATED_COMPLAINTS');
  assert.notStrictEqual(evalResult.relationshipClassification, 'POTENTIAL_OPERATIONAL_OVERLAP');
  assert.ok(evalResult.ruleFlags.includes('HIGH_TEXT_SIMILARITY'));
});

test('Case Intelligence: Same institution but unrelated complaints are classified as SAME_INSTITUTION, preventing false operational alerts', () => {
  const sourceComplaint = {
    id: 'C-101',
    bureau: 'REGIONAL_OFFICE',
    status: 'UNDER_PROCESS',
    category: 'Refund & Caution Money',
    complainant_type: 'STUDENT',
    subject: 'Refund of library caution deposit after graduation',
    description: 'Library deposit of Rs 5000 not refunded.'
  };

  const candComplaint = {
    id: 'C-102',
    bureau: 'PGRC',
    status: 'UNDER_PROCESS',
    category: 'Infrastructure & Amenities',
    complainant_type: 'STUDENT',
    subject: 'Contaminated hostel mess water supply',
    description: 'Drinking water in hostel mess is contaminated.'
  };

  const inst = { id: 'I-SAME', aicte_permanent_id: '1-99999999', name: 'Apex Engineering', identity_flag: 'VERIFIED' };

  const evalResult = evaluateCasePair(sourceComplaint, candComplaint, inst, inst);

  assert.strictEqual(evalResult.institutionMatchType, 'EXACT_PERMANENT_ID');
  assert.strictEqual(evalResult.relationshipClassification, 'SAME_INSTITUTION');
  assert.notStrictEqual(evalResult.relationshipClassification, 'POTENTIAL_OPERATIONAL_OVERLAP');
});

test('Case Intelligence: Missing AICTE Permanent ID triggers UNCERTAIN_INSTITUTION_IDENTITY flag', () => {
  const sourceComplaint = {
    id: 'C-201',
    bureau: 'REGULATION_BUREAU',
    status: 'UNDER_PROCESS',
    category: 'Faculty Grievance',
    subject: 'Unpaid salary dues',
    description: 'Faculty salary unpaid.'
  };

  const candComplaint = {
    id: 'C-202',
    bureau: 'PGRC',
    status: 'UNDER_PROCESS',
    category: 'Faculty Grievance',
    subject: 'Withheld salary and PF',
    description: 'Withheld faculty provident fund.'
  };

  const instMissingId = {
    id: 'I-MISSING',
    aicte_permanent_id: null,
    name: 'Unverified Polytechnic',
    identity_flag: 'MISSING_AICTE_ID'
  };

  const evalResult = evaluateCasePair(sourceComplaint, candComplaint, instMissingId, instMissingId);

  assert.ok(evalResult.ruleFlags.includes('UNCERTAIN_INSTITUTION_IDENTITY'));
  assert.strictEqual(evalResult.evidenceBreakdown.institutionEvidence.uncertainIdentity, true);
});

test('Case Intelligence: Restricted cross-Bureau visibility applies scope masking to candidate subjects', async () => {
  // Regulation Bureau officer queries alerts
  const res = await request(app)
    .get('/api/v1/intelligence/alerts')
    .set('Authorization', `Bearer ${rbToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  for (const alert of res.body.data.items) {
    // Alert must involve RB
    assert.ok(alert.source_bureau === 'REGULATION_BUREAU' || alert.candidate_bureau === 'REGULATION_BUREAU');

    // If candidate is PGRC, candidate_subject must be scope-masked
    if (alert.candidate_bureau === 'PGRC') {
      assert.ok(alert.candidate_subject.includes('[CROSS-BUREAU: PGRC]'));
    }
  }
});

test('Case Intelligence: Unauthorized linking is rejected when Bureau Officer has no jurisdiction', async () => {
  // Regional Officer trying to link RB case with PGRC case
  const res = await request(app)
    .post('/api/v1/intelligence/links')
    .set('Authorization', `Bearer ${regionalToken}`)
    .send({
      sourceComplaintId: sampleRbComplaint.id,
      targetComplaintId: samplePgrcComplaint.id,
      linkReason: 'Unauthorized linking attempt across two other bureaus'
    });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_JURISDICTION');
});

test('Case Intelligence: Duplicate links are rejected with 409 Conflict', async () => {
  // First link by Senior Official
  const firstLink = await request(app)
    .post('/api/v1/intelligence/links')
    .set('Authorization', `Bearer ${seniorToken}`)
    .send({
      sourceComplaintId: sampleRbComplaint.id,
      targetComplaintId: samplePgrcComplaint.id,
      linkReason: 'Legitimate cross-bureau coordination linking between Regulation Bureau and PGRC'
    });

  assert.strictEqual(firstLink.status, 201);
  assert.strictEqual(firstLink.body.success, true);

  // Duplicate attempt
  const dupLink = await request(app)
    .post('/api/v1/intelligence/links')
    .set('Authorization', `Bearer ${seniorToken}`)
    .send({
      sourceComplaintId: sampleRbComplaint.id,
      targetComplaintId: samplePgrcComplaint.id,
      linkReason: 'Attempting duplicate link between the same pair'
    });

  assert.strictEqual(dupLink.status, 409);
  assert.strictEqual(dupLink.body.error.code, 'DUPLICATE_LINK');
});

test('Case Intelligence: Independent case records remain preserved after linking without merging', async () => {
  // Check source complaint
  const sourceAfter = await request(app)
    .get(`/api/v1/complaints/${sampleRbComplaint.id}`)
    .set('Authorization', `Bearer ${seniorToken}`);

  // Check target complaint
  const targetAfter = await request(app)
    .get(`/api/v1/complaints/${samplePgrcComplaint.id}`)
    .set('Authorization', `Bearer ${seniorToken}`);

  // Both cases must retain their distinct case IDs, bureaus, and non-merged statuses
  assert.strictEqual(sourceAfter.body.data.id, sampleRbComplaint.id);
  assert.strictEqual(sourceAfter.body.data.bureau, 'REGULATION_BUREAU');

  assert.strictEqual(targetAfter.body.data.id, samplePgrcComplaint.id);
  assert.strictEqual(targetAfter.body.data.bureau, 'PGRC');

  // Verify timeline action logged CASE_COORDINATION_LINKED on both
  const sourceTimelineRes = await request(app)
    .get(`/api/v1/complaints/${sampleRbComplaint.id}/timeline`)
    .set('Authorization', `Bearer ${seniorToken}`);

  const targetTimelineRes = await request(app)
    .get(`/api/v1/complaints/${samplePgrcComplaint.id}/timeline`)
    .set('Authorization', `Bearer ${seniorToken}`);

  const sourceAction = sourceTimelineRes.body.data.find(a => a.action_type === 'CASE_COORDINATION_LINKED');
  assert.ok(sourceAction, 'Must record CASE_COORDINATION_LINKED in source timeline');

  const targetAction = targetTimelineRes.body.data.find(a => a.action_type === 'CASE_COORDINATION_LINKED');
  assert.ok(targetAction, 'Must record CASE_COORDINATION_LINKED in target timeline');
});

test('Case Intelligence: Alert review updates status to CONFIRMED or DISMISSED with audit reason', async () => {
  // Ensure match has been triggered on sample complaint
  await request(app)
    .post(`/api/v1/intelligence/match/${sampleRbComplaint.id}`)
    .set('Authorization', `Bearer ${seniorToken}`);

  // Find an alert
  const alertsRes = await request(app)
    .get('/api/v1/intelligence/alerts')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.ok(alertsRes.body.data.items.length > 0);
  const targetAlert = alertsRes.body.data.items[0];

  // Dismiss with substantive reason
  const reviewRes = await request(app)
    .patch(`/api/v1/intelligence/alerts/${targetAlert.id}/review`)
    .set('Authorization', `Bearer ${seniorToken}`)
    .send({
      status: 'DISMISSED',
      decisionReason: 'Reviewed and confirmed to be separate incidents without operational conflict.'
    });

  assert.strictEqual(reviewRes.status, 200);
  assert.strictEqual(reviewRes.body.data.status, 'DISMISSED');
  assert.strictEqual(reviewRes.body.data.decision_reason, 'Reviewed and confirmed to be separate incidents without operational conflict.');
});

test('Case Intelligence: Evaluation benchmark executes with high precision and low false-positive rate', async () => {
  const res = await request(app)
    .get('/api/v1/intelligence/evaluation/benchmark')
    .set('Authorization', `Bearer ${seniorToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  const { metrics, totalTestPairs } = res.body.data;
  assert.strictEqual(totalTestPairs, 14);
  assert.ok(metrics.precision >= 0.85, `Precision (${metrics.precisionPercent}) must be >= 85%`);
  assert.ok(metrics.recall >= 0.80, `Recall (${metrics.recallPercent}) must be >= 80%`);
  assert.ok(metrics.f1Score >= 0.82, `F1 Score (${metrics.f1ScorePercent}) must be >= 82%`);
  assert.ok(metrics.falsePositiveRate <= 0.10, `False Positive Rate (${metrics.falsePositiveRatePercent}) must be <= 10%`);
});
