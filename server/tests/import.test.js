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

test('CSV Import: Preview validates rows, reports errors, and resolves institutions', async () => {
  const batchRows = [
    // Valid row 1: Resolves by AICTE ID
    {
      aictePermanentId: '1-109283741',
      bureau: 'REGULATION_BUREAU',
      category: 'CAPITATION_FEE',
      subject: 'Batch imported fee complaint 1',
      description: 'First valid description in preview batch'
    },
    // Invalid row 2: Missing subject
    {
      aictePermanentId: '1-109283741',
      bureau: 'REGULATION_BUREAU',
      category: 'CAPITATION_FEE',
      subject: '', // Invalid
      description: 'Second description'
    },
    // Invalid row 3: Unknown institution
    {
      aictePermanentId: '1-999999999', // Unknown
      bureau: 'REGULATION_BUREAU',
      category: 'FACULTY_GRIEVANCE',
      subject: 'Valid subject',
      description: 'Valid description'
    }
  ];

  const res = await request(app)
    .post('/api/v1/complaints/import/preview')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({ rows: batchRows });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.summary.totalRows, 3);
  assert.strictEqual(res.body.data.summary.validRows, 1);
  assert.strictEqual(res.body.data.summary.invalidRows, 2);
  assert.strictEqual(res.body.data.summary.canCommit, false);

  // Row 1 is valid
  assert.strictEqual(res.body.data.preview[0].isValid, true);
  assert.strictEqual(res.body.data.preview[0].resolvedInstitution.name, 'Apex Institute of Technology & Management');

  // Row 2 has subject error
  assert.strictEqual(res.body.data.preview[1].isValid, false);
  assert.ok(res.body.data.preview[1].errors.some(e => e.includes('Subject/Title is required')));

  // Row 3 has institution error
  assert.strictEqual(res.body.data.preview[2].isValid, false);
  assert.ok(res.body.data.preview[2].errors.some(e => e.includes('Could not resolve institution')));
});

test('CSV Import: Preview detects duplicate Case ID within batch', async () => {
  const batchWithDuplicates = [
    {
      caseId: 'CMP-TEST-DUP-01',
      aictePermanentId: '1-109283741',
      bureau: 'REGULATION_BUREAU',
      subject: 'Subject 1',
      description: 'Desc 1'
    },
    {
      caseId: 'CMP-TEST-DUP-01', // Duplicate ID
      aictePermanentId: '1-109283741',
      bureau: 'REGULATION_BUREAU',
      subject: 'Subject 2',
      description: 'Desc 2'
    }
  ];

  const res = await request(app)
    .post('/api/v1/complaints/import/preview')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({ rows: batchWithDuplicates });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.preview[0].isValid, true);
  assert.strictEqual(res.body.data.preview[1].isValid, false);
  assert.ok(res.body.data.preview[1].errors.some(e => e.includes('Duplicate Case ID')));
});

test('CSV Import: Commit requires explicit confirmation flag', async () => {
  const res = await request(app)
    .post('/api/v1/complaints/import/commit')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      rows: [
        {
          institutionId: 'inst-syn-001',
          bureau: 'REGULATION_BUREAU',
          subject: 'Unconfirmed import',
          description: 'Should fail without confirm flag'
        }
      ]
      // Missing confirm: true
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'CONFIRMATION_REQUIRED');
});

test('CSV Import: Commit successfully executes batch write and logs audit event', async () => {
  const rowsToCommit = [
    {
      institutionId: 'inst-syn-001',
      bureau: 'REGULATION_BUREAU',
      category: 'EXAMINATION_MALPRACTICE',
      subject: 'Batch committed exam irregularity 1',
      description: 'Detailed description for first committed record'
    },
    {
      institutionId: 'inst-syn-002',
      bureau: 'REGULATION_BUREAU',
      category: 'FACULTY_GRIEVANCE',
      subject: 'Batch committed faculty issue 2',
      description: 'Detailed description for second committed record'
    }
  ];

  const res = await request(app)
    .post('/api/v1/complaints/import/commit')
    .set('Authorization', `Bearer ${rbToken}`)
    .send({
      rows: rowsToCommit,
      confirm: true
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.totalImported, 2);
  assert.strictEqual(res.body.data.importedCaseIds.length, 2);
});
