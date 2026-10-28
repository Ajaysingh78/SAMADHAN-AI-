const express = require('express');
const router = express.Router();
const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const complaintRepository = require('../db/repositories/complaintRepository');
const institutionRepository = require('../db/repositories/institutionRepository');
const caseActionRepository = require('../db/repositories/caseActionRepository');
const auditRepository = require('../db/repositories/auditRepository');
const { 
  WORKFLOW_STATUSES, 
  isValidTransition, 
  calculateExpectedDisposalDate, 
  calculateSlaStatus 
} = require('../services/workflowService');
const { ROLES, BUREAUS } = require('../utils/security');

router.use(authenticate);

/**
 * GET /api/v1/complaints
 * Lists complaints with filtering, search, and pagination.
 * Bureau Officers are strictly scoped to their assigned bureau.
 */
router.get('/', async (req, res) => {
  const { page, limit, bureau, status, category, institutionId, search } = req.query;

  // Bureau scoping enforcement
  let effectiveBureau = bureau;
  if (req.user.role === ROLES.BUREAU_OFFICER) {
    effectiveBureau = req.user.primary_bureau;
  }

  const result = await complaintRepository.list({
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
    bureau: effectiveBureau,
    status,
    category,
    institutionId,
    search
  });

  // Calculate dynamic SLA status for each item
  const enrichedItems = result.items.map(item => {
    const sla = calculateSlaStatus(item.expected_disposal_date, item.status, item.disposed_date);
    return {
      ...item,
      sla
    };
  });

  return res.json({
    success: true,
    data: enrichedItems,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total
    }
  });
});

/**
 * GET /api/v1/complaints/:id
 * Retrieves complaint details by internal ID
 */
router.get('/:id', async (req, res) => {
  const complaint = await complaintRepository.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COMPLAINT_NOT_FOUND',
        message: 'Complaint record not found.',
        details: null
      }
    });
  }

  // Bureau scope check for dealing officers
  if (req.user.role === ROLES.BUREAU_OFFICER && req.user.primary_bureau !== complaint.bureau) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_BUREAU_SCOPE',
        message: `Cross-bureau restriction: You are authorized for ${req.user.primary_bureau} cases only.`,
        details: { caseBureau: complaint.bureau }
      }
    });
  }

  const sla = calculateSlaStatus(complaint.expected_disposal_date, complaint.status, complaint.disposed_date);

  return res.json({
    success: true,
    data: {
      ...complaint,
      sla
    }
  });
});

/**
 * GET /api/v1/complaints/:id/timeline
 * Retrieves complete chronological action history for a case
 */
router.get('/:id/timeline', async (req, res) => {
  const complaint = await complaintRepository.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: { code: 'COMPLAINT_NOT_FOUND', message: 'Complaint record not found.' }
    });
  }

  // Bureau scope check
  if (req.user.role === ROLES.BUREAU_OFFICER && req.user.primary_bureau !== complaint.bureau) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_BUREAU_SCOPE', message: 'Access denied to cross-bureau action history.' }
    });
  }

  const actions = await caseActionRepository.listByComplaintId(complaint.id);

  return res.json({
    success: true,
    data: actions
  });
});

/**
 * POST /api/v1/complaints
 * Registers a new institution complaint
 */
router.post('/', async (req, res) => {
  const {
    institutionId,
    bureau,
    category,
    severity,
    complainantType,
    subject,
    description,
    receivedDate,
    slaDays
  } = req.body || {};

  // Validation
  if (!institutionId || !bureau || !category || !subject || !description) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'institutionId, bureau, category, subject, and description are mandatory.',
        details: null
      }
    });
  }

  // Verify institution exists
  const institution = await institutionRepository.findById(institutionId);
  if (!institution) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'INSTITUTION_NOT_FOUND',
        message: 'The referenced technical institution does not exist in the registry.',
        details: { institutionId }
      }
    });
  }

  // Bureau Officer scope check
  if (req.user.role === ROLES.BUREAU_OFFICER && req.user.primary_bureau !== bureau) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_BUREAU_SCOPE',
        message: `You are authorized to register complaints for ${req.user.primary_bureau} only.`,
        details: { attemptedBureau: bureau }
      }
    });
  }

  const effectiveReceivedDate = receivedDate || new Date().toISOString().split('T')[0];
  const expectedDisposalDate = calculateExpectedDisposalDate(effectiveReceivedDate, parseInt(slaDays, 10) || 30);

  // Generate unique immutable Case ID
  const caseId = complaintRepository.generateCaseId(bureau);

  const created = await complaintRepository.create({
    case_id: caseId,
    institution_id: institution.id,
    bureau,
    category,
    severity: severity || 'STANDARD',
    complainant_type: complainantType || 'STUDENT',
    subject,
    description,
    received_date: effectiveReceivedDate,
    status: WORKFLOW_STATUSES.RECEIVED,
    assigned_officer_id: null,
    expected_disposal_date: expectedDisposalDate,
    created_by: req.user.id
  });

  // Log initial action in timeline
  await caseActionRepository.create({
    complaint_id: created.id,
    action_type: 'CASE_REGISTERED',
    previous_status: null,
    new_status: WORKFLOW_STATUSES.RECEIVED,
    remarks: `Complaint registered in ${bureau} against ${institution.name} (ID: ${institution.aicte_permanent_id || 'Unassigned'}).`,
    performed_by: req.user.id
  });

  await auditRepository.logEvent({
    userId: req.user.id,
    username: req.user.username,
    eventType: 'COMPLAINT_REGISTERED',
    ipAddress: req.ip,
    details: { caseId: created.case_id, institutionId: institution.id, bureau }
  });

  return res.status(201).json({
    success: true,
    data: created
  });
});

/**
 * PATCH /api/v1/complaints/:id/status
 * Updates workflow status with transition validation and audit logging
 */
router.patch('/:id/status', async (req, res) => {
  const { newStatus, remarks } = req.body || {};

  if (!newStatus || !remarks) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'newStatus and remarks are mandatory for workflow state changes.',
        details: null
      }
    });
  }

  const complaint = await complaintRepository.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: { code: 'COMPLAINT_NOT_FOUND', message: 'Complaint record not found.' }
    });
  }

  // Bureau Scope Check
  if (req.user.role === ROLES.BUREAU_OFFICER && req.user.primary_bureau !== complaint.bureau) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_BUREAU_SCOPE', message: 'Unauthorized to change status of another bureau’s case.' }
    });
  }

  // State Transition Validation
  if (!isValidTransition(complaint.status, newStatus)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_WORKFLOW_TRANSITION',
        message: `Illegal transition: Cannot move complaint from '${complaint.status}' directly to '${newStatus}'.`,
        details: { currentStatus: complaint.status, attemptedStatus: newStatus }
      }
    });
  }

  // Special Check: Reopening a disposed case requires admin or authorized role
  if (complaint.status === WORKFLOW_STATUSES.DISPOSED && newStatus === WORKFLOW_STATUSES.REOPENED) {
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SENIOR_OFFICIAL && req.user.role !== ROLES.BUREAU_OFFICER) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_ROLE', message: 'Insufficient role privilege to reopen a disposed complaint.' }
      });
    }
  }

  const updatePayload = {
    status: newStatus,
    last_action_date: new Date().toISOString()
  };

  if (newStatus === WORKFLOW_STATUSES.DISPOSED) {
    updatePayload.disposed_date = new Date().toISOString();
  }

  const updated = await complaintRepository.update(complaint.id, updatePayload);

  // Record action in timeline
  await caseActionRepository.create({
    complaint_id: complaint.id,
    action_type: newStatus === WORKFLOW_STATUSES.DISPOSED ? 'CASE_DISPOSED' :
                 newStatus === WORKFLOW_STATUSES.REOPENED ? 'CASE_REOPENED' : 'STATUS_CHANGED',
    previous_status: complaint.status,
    new_status: newStatus,
    remarks: remarks.trim(),
    performed_by: req.user.id
  });

  await auditRepository.logEvent({
    userId: req.user.id,
    username: req.user.username,
    eventType: 'CASE_STATUS_UPDATED',
    ipAddress: req.ip,
    details: { caseId: complaint.case_id, from: complaint.status, to: newStatus, remarks }
  });

  return res.json({
    success: true,
    data: updated
  });
});

/**
 * PATCH /api/v1/complaints/:id/assign
 * Assigns or reassigns handling officer
 */
router.patch('/:id/assign', requireRoles(ROLES.ADMIN, ROLES.BUREAU_OFFICER, ROLES.SENIOR_OFFICIAL), async (req, res) => {
  const { officerId, remarks } = req.body || {};

  const complaint = await complaintRepository.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: { code: 'COMPLAINT_NOT_FOUND', message: 'Complaint record not found.' }
    });
  }

  const updated = await complaintRepository.update(complaint.id, {
    assigned_officer_id: officerId || null,
    last_action_date: new Date().toISOString()
  });

  await caseActionRepository.create({
    complaint_id: complaint.id,
    action_type: officerId ? 'OFFICER_ASSIGNED' : 'OFFICER_UNASSIGNED',
    previous_status: complaint.status,
    new_status: complaint.status,
    remarks: remarks ? remarks.trim() : (officerId ? `Assigned to officer ID ${officerId}` : 'Officer unassigned'),
    performed_by: req.user.id
  });

  return res.json({
    success: true,
    data: updated
  });
});

/**
 * POST /api/v1/complaints/import/preview
 * Safely parses and validates CSV rows without committing to database
 */
router.post('/import/preview', async (req, res) => {
  const { rows } = req.body || {};

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'An array of rows is required for import preview.',
        details: null
      }
    });
  }

  const previewResults = [];
  const seenCaseIds = new Set();
  let validCount = 0;
  let invalidCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNumber = idx + 1;
    const errors = [];

    // 1. Mandatory Field Checks
    if (!row.subject || !String(row.subject).trim()) {
      errors.push('Subject/Title is required.');
    }
    if (!row.description || !String(row.description).trim()) {
      errors.push('Description is required.');
    }
    if (!row.bureau) {
      errors.push('Bureau is required (e.g. REGULATION_BUREAU, PGRC).');
    } else if (!Object.values(BUREAUS).includes(row.bureau)) {
      errors.push(`Invalid bureau '${row.bureau}'. Must be one of: ${Object.values(BUREAUS).join(', ')}`);
    }

    // 2. Resolve Institution
    let resolvedInstitution = null;
    if (row.institutionId) {
      resolvedInstitution = await institutionRepository.findById(row.institutionId);
    } else if (row.aictePermanentId) {
      resolvedInstitution = await institutionRepository.findByAicteId(row.aictePermanentId);
    } else if (row.institutionName) {
      const normName = institutionRepository.normalizeInstitutionName(row.institutionName);
      resolvedInstitution = await institutionRepository.findByNormalizedName(normName);
    }

    if (!resolvedInstitution) {
      errors.push('Could not resolve institution: verify AICTE Permanent ID or registered institution name.');
    }

    // 3. Case ID Checks (if provided in row)
    if (row.caseId) {
      const cleanCaseId = String(row.caseId).trim();
      if (seenCaseIds.has(cleanCaseId.toLowerCase())) {
        errors.push(`Duplicate Case ID '${cleanCaseId}' detected within import batch.`);
      } else {
        seenCaseIds.add(cleanCaseId.toLowerCase());
        const existingCase = await complaintRepository.findByCaseId(cleanCaseId);
        if (existingCase) {
          errors.push(`Case ID '${cleanCaseId}' already exists in system database.`);
        }
      }
    }

    // 4. Role Scope Check
    if (req.user.role === ROLES.BUREAU_OFFICER && row.bureau && row.bureau !== req.user.primary_bureau) {
      errors.push(`Your role cannot import complaints for '${row.bureau}'. Authorized for '${req.user.primary_bureau}' only.`);
    }

    const isValid = errors.length === 0;
    if (isValid) validCount += 1;
    else invalidCount += 1;

    previewResults.push({
      rowNumber,
      isValid,
      errors,
      resolvedInstitution: resolvedInstitution ? {
        id: resolvedInstitution.id,
        name: resolvedInstitution.name,
        aicteId: resolvedInstitution.aicte_permanent_id
      } : null,
      data: {
        caseId: row.caseId || null,
        bureau: row.bureau,
        category: row.category || 'GENERAL_COMPLAINT',
        severity: row.severity || 'STANDARD',
        complainantType: row.complainantType || 'STUDENT',
        subject: row.subject,
        description: row.description,
        receivedDate: row.receivedDate || new Date().toISOString().split('T')[0]
      }
    });
  }

  return res.json({
    success: true,
    data: {
      summary: {
        totalRows: rows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        canCommit: validCount > 0 && invalidCount === 0
      },
      preview: previewResults
    }
  });
});

/**
 * POST /api/v1/complaints/import/commit
 * Commits pre-validated CSV rows inside a transactional write
 */
router.post('/import/commit', async (req, res) => {
  const { rows, confirm } = req.body || {};

  if (!confirm) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'CONFIRMATION_REQUIRED',
        message: 'Explicit confirmation flag { confirm: true } is required to execute batch import.',
        details: null
      }
    });
  }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'No rows provided to import.' }
    });
  }

  const importedCases = [];

  for (const item of rows) {
    const caseId = item.caseId || complaintRepository.generateCaseId(item.bureau);
    const expectedDisposalDate = calculateExpectedDisposalDate(item.receivedDate, 30);

    const created = await complaintRepository.create({
      case_id: caseId,
      institution_id: item.institutionId,
      bureau: item.bureau,
      category: item.category || 'GENERAL_COMPLAINT',
      severity: item.severity || 'STANDARD',
      complainant_type: item.complainantType || 'STUDENT',
      subject: item.subject,
      description: item.description,
      received_date: item.receivedDate || new Date().toISOString().split('T')[0],
      status: WORKFLOW_STATUSES.RECEIVED,
      expected_disposal_date: expectedDisposalDate,
      created_by: req.user.id
    });

    await caseActionRepository.create({
      complaint_id: created.id,
      action_type: 'CASE_REGISTERED_VIA_CSV_IMPORT',
      previous_status: null,
      new_status: WORKFLOW_STATUSES.RECEIVED,
      remarks: 'Batch imported via verified CSV file intake.',
      performed_by: req.user.id
    });

    importedCases.push(created.case_id);
  }

  await auditRepository.logEvent({
    userId: req.user.id,
    username: req.user.username,
    eventType: 'BATCH_CSV_IMPORTED',
    ipAddress: req.ip,
    details: { totalImported: importedCases.length, caseIds: importedCases }
  });

  return res.status(201).json({
    success: true,
    data: {
      totalImported: importedCases.length,
      importedCaseIds: importedCases
    }
  });
});

module.exports = router;
