const express = require('express');
const router = express.Router();
const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const institutionRepository = require('../db/repositories/institutionRepository');
const complaintRepository = require('../db/repositories/complaintRepository');
const auditRepository = require('../db/repositories/auditRepository');
const { ROLES } = require('../utils/security');

router.use(authenticate);

/**
 * GET /api/v1/institutions
 * Lists institutions with search, region, state filters, and pagination
 */
router.get('/', async (req, res) => {
  const { page, limit, search, region, state } = req.query;

  const result = await institutionRepository.list({
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
    search: search || '',
    region: region || '',
    state: state || ''
  });

  return res.json({
    success: true,
    data: result.items,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total
    }
  });
});

/**
 * GET /api/v1/institutions/:id
 * Retrieves full 360° institution dossier including consolidated complaint history across all bureaus
 */
router.get('/:id', async (req, res) => {
  const institution = await institutionRepository.findById(req.params.id);

  if (!institution) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'INSTITUTION_NOT_FOUND',
        message: 'Institution record not found in central registry.',
        details: null
      }
    });
  }

  // Fetch 360° cross-bureau complaint history for this institution
  const complaintHistory = await complaintRepository.getInstitutionHistory(institution.id);

  // Group complaint metrics
  const totalComplaints = complaintHistory.length;
  const activeComplaints = complaintHistory.filter(c => c.status !== 'DISPOSED').length;
  const disposedComplaints = complaintHistory.filter(c => c.status === 'DISPOSED').length;

  const bureauBreakdown = {
    REGULATION_BUREAU: complaintHistory.filter(c => c.bureau === 'REGULATION_BUREAU').length,
    PGRC: complaintHistory.filter(c => c.bureau === 'PGRC').length,
    OTHER: complaintHistory.filter(c => c.bureau !== 'REGULATION_BUREAU' && c.bureau !== 'PGRC').length
  };

  return res.json({
    success: true,
    data: {
      institution,
      metrics: {
        totalComplaints,
        activeComplaints,
        disposedComplaints,
        bureauBreakdown
      },
      complaintHistory
    }
  });
});

/**
 * POST /api/v1/institutions
 * Registers a new technical institution in the registry
 */
router.post('/', requireRoles(ROLES.ADMIN, ROLES.BUREAU_OFFICER), async (req, res) => {
  const { aictePermanentId, name, address, city, state, region, pinCode, approvalStatus } = req.body || {};

  if (!name || !address || !city || !state || !region) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Name, address, city, state, and region are mandatory.',
        details: null
      }
    });
  }

  // Check unique AICTE Permanent ID if supplied
  let identityFlag = 'VERIFIED';
  if (aictePermanentId) {
    const existing = await institutionRepository.findByAicteId(aictePermanentId);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_AICTE_ID',
          message: `Institution with AICTE Permanent ID '${aictePermanentId}' already exists (${existing.name}).`,
          details: { existingInstitutionId: existing.id }
        }
      });
    }
  } else {
    identityFlag = 'MISSING_AICTE_ID';
  }

  // Check normalized name duplicate warning
  const normName = institutionRepository.normalizeInstitutionName(name);
  const existingByName = await institutionRepository.findByNormalizedName(normName);
  if (existingByName && !aictePermanentId) {
    identityFlag = 'FLAGGED_FOR_REVIEW';
  }

  const created = await institutionRepository.create({
    aicte_permanent_id: aictePermanentId || null,
    name,
    address,
    city,
    state,
    region,
    pin_code: pinCode || '000000',
    approval_status: approvalStatus || 'APPROVED',
    identity_flag: identityFlag
  });

  await auditRepository.logEvent({
    userId: req.user.id,
    username: req.user.username,
    eventType: 'INSTITUTION_REGISTERED',
    ipAddress: req.ip,
    details: { institutionId: created.id, name: created.name, aicteId: created.aicte_permanent_id }
  });

  return res.status(201).json({
    success: true,
    data: created
  });
});

module.exports = router;
