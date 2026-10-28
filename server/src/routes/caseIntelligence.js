/**
 * Express REST API Routes for Explainable Cross-Bureau Case Intelligence
 * Implements candidate matching, explainable alert retrieval, scope masking,
 * human-reviewed decision actions, non-destructive case linking, and benchmark reporting.
 */

const express = require('express');
const router = express.Router();

const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const complaintRepo = require('../db/repositories/complaintRepository');
const institutionRepo = require('../db/repositories/institutionRepository');
const matchAlertRepo = require('../db/repositories/matchAlertRepository');
const caseLinkRepo = require('../db/repositories/caseLinkRepository');
const caseActionRepo = require('../db/repositories/caseActionRepository');
const auditRepo = require('../db/repositories/auditRepository');
const { matchComplaint } = require('../services/caseMatchingService');
const { runBenchmarkEvaluation } = require('../services/benchmarkService');

/**
 * Helper to mask sensitive cross-bureau complaint details for non-privileged bureau officers
 */
function applyScopeMasking(alert, user) {
  const isSuperUser = user.role === 'SYSTEM_ADMIN' || user.role === 'SENIOR_OFFICIAL';
  if (isSuperUser) return alert;

  const userBureau = user.primary_bureau || user.bureau;
  const sourceBureau = alert.source_bureau;
  const candidateBureau = alert.candidate_bureau;

  // Clone alert
  const masked = { ...alert };

  // If user doesn't belong to candidate bureau, summarize/mask sensitive candidate fields
  if (userBureau && candidateBureau && userBureau !== candidateBureau) {
    masked.candidate_subject = `[CROSS-BUREAU: ${candidateBureau.replace(/_/g, ' ')}] Overlapping allegations under investigation`;
  }

  // If user doesn't belong to source bureau, summarize/mask sensitive source fields
  if (userBureau && sourceBureau && userBureau !== sourceBureau) {
    masked.source_subject = `[CROSS-BUREAU: ${sourceBureau.replace(/_/g, ' ')}] Overlapping allegations under investigation`;
  }

  return masked;
}

// All intelligence endpoints require authentication
router.use(authenticate);

/**
 * 1. POST /api/v1/intelligence/match/:complaintId
 * Runs matching pipeline for a source complaint against stored complaints
 */
router.post('/match/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await complaintRepo.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Complaint with ID '${complaintId}' was not found.` }
      });
    }

    // Scoping check: Bureau Officers can only trigger matching on cases within their jurisdiction
    const userBureau = req.user.primary_bureau || req.user.bureau;
    if (req.user.role === 'BUREAU_OFFICER' && userBureau !== complaint.bureau) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_JURISDICTION', message: 'You cannot analyze cases outside your assigned Bureau jurisdiction.' }
      });
    }

    const alerts = await matchComplaint(complaint, { complaintRepo, institutionRepo, matchAlertRepo });

    await auditRepo.log({
      user_id: req.user.id,
      event_type: 'CASE_INTELLIGENCE_MATCH_RUN',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: { complaintId, alertsGenerated: alerts.length }
    });

    return res.status(200).json({
      success: true,
      data: {
        complaintId,
        caseId: complaint.case_id,
        alertsFound: alerts.length,
        alerts: alerts.map(a => applyScopeMasking(a, req.user))
      }
    });
  } catch (err) {
    console.error('[CaseIntelligence] Match error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to run case matching analysis.' }
    });
  }
});

/**
 * 2. GET /api/v1/intelligence/alerts
 * Lists match alerts with filters and role-based scope masking
 */
router.get('/alerts', async (req, res) => {
  try {
    const { status, classification, search } = req.query;
    let alerts = await matchAlertRepo.findAll({ status, classification, search });

    // Jurisdiction filtering for Bureau Officers
    const userBureau = req.user.primary_bureau || req.user.bureau;
    if (req.user.role === 'BUREAU_OFFICER' && userBureau) {
      alerts = alerts.filter(
        a => a.source_bureau === userBureau || a.candidate_bureau === userBureau
      );
    }

    const maskedAlerts = alerts.map(a => applyScopeMasking(a, req.user));

    return res.status(200).json({
      success: true,
      data: {
        total: maskedAlerts.length,
        items: maskedAlerts
      }
    });
  } catch (err) {
    console.error('[CaseIntelligence] List alerts error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve match alerts.' }
    });
  }
});

/**
 * 3. GET /api/v1/intelligence/alerts/:id
 * Retrieves detailed alert dossier
 */
router.get('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await matchAlertRepo.findById(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Match alert with ID '${id}' was not found.` }
      });
    }

    // Check Bureau Officer jurisdiction
    const userBureau = req.user.primary_bureau || req.user.bureau;
    if (req.user.role === 'BUREAU_OFFICER' && userBureau) {
      const isInvolved = alert.source_bureau === userBureau || alert.candidate_bureau === userBureau;
      if (!isInvolved) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN_JURISDICTION', message: 'You are not authorized to view alerts outside your Bureau jurisdiction.' }
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: applyScopeMasking(alert, req.user)
    });
  } catch (err) {
    console.error('[CaseIntelligence] Get alert error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve match alert details.' }
    });
  }
});

/**
 * 4. PATCH /api/v1/intelligence/alerts/:id/review
 * Human review workflow: Confirm or Dismiss an alert with mandatory reason
 */
router.patch('/alerts/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, decisionReason } = req.body;

    if (!['CONFIRMED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: "Status must be 'CONFIRMED' or 'DISMISSED'." }
      });
    }

    if (!decisionReason || decisionReason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REASON', message: 'A substantive decision reason (minimum 5 characters) is required.' }
      });
    }

    const alert = await matchAlertRepo.findById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Match alert with ID '${id}' was not found.` }
      });
    }

    // Check Bureau Officer jurisdiction
    const userBureau = req.user.primary_bureau || req.user.bureau;
    if (req.user.role === 'BUREAU_OFFICER' && userBureau) {
      const isInvolved = alert.source_bureau === userBureau || alert.candidate_bureau === userBureau;
      if (!isInvolved) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN_JURISDICTION', message: 'You are not authorized to review alerts outside your Bureau jurisdiction.' }
        });
      }
    }

    const updated = await matchAlertRepo.updateReview(id, {
      status,
      reviewedBy: req.user.id,
      decisionReason: decisionReason.trim()
    });

    await auditRepo.log({
      user_id: req.user.id,
      event_type: 'CASE_ALERT_REVIEWED',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: { alertId: id, status, decisionReason: decisionReason.trim() }
    });

    return res.status(200).json({
      success: true,
      data: applyScopeMasking(updated, req.user),
      message: `Match alert successfully marked as ${status}.`
    });
  } catch (err) {
    console.error('[CaseIntelligence] Review alert error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record alert review decision.' }
    });
  }
});

/**
 * 5. POST /api/v1/intelligence/links
 * Creates formal cross-bureau coordination link between two cases
 * GUARANTEE: Does NOT merge, delete, or alter independent case records!
 */
router.post('/links', async (req, res) => {
  try {
    const { sourceComplaintId, targetComplaintId, matchAlertId, linkType, linkReason } = req.body;

    if (!sourceComplaintId || !targetComplaintId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CASE_IDS', message: 'Both sourceComplaintId and targetComplaintId are required.' }
      });
    }

    if (sourceComplaintId === targetComplaintId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PAIR', message: 'Cannot link a case to itself.' }
      });
    }

    if (!linkReason || linkReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_REASON', message: 'A detailed linking justification (minimum 10 characters) is required.' }
      });
    }

    const caseA = await complaintRepo.findById(sourceComplaintId);
    const caseB = await complaintRepo.findById(targetComplaintId);

    if (!caseA || !caseB) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'One or both complaints do not exist.' }
      });
    }

    // Check Bureau Officer jurisdiction
    const userBureau = req.user.primary_bureau || req.user.bureau;
    if ((req.user.role === 'BUREAU_OFFICER' || req.user.role === 'REGIONAL_OFFICER') && userBureau) {
      const isInvolved = caseA.bureau === userBureau || caseB.bureau === userBureau;
      if (!isInvolved) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN_JURISDICTION', message: 'You can only link cases where at least one complaint falls under your Bureau.' }
        });
      }
    }

    // Check if already linked
    const alreadyLinked = await caseLinkRepo.isLinked(sourceComplaintId, targetComplaintId);
    if (alreadyLinked) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_LINK', message: 'These two cases are already officially linked.' }
      });
    }

    // Create case link record
    const linkRecord = await caseLinkRepo.createLink({
      source_complaint_id: sourceComplaintId,
      target_complaint_id: targetComplaintId,
      match_alert_id: matchAlertId || null,
      link_type: linkType || 'CROSS_BUREAU_COORDINATION',
      link_reason: linkReason.trim(),
      created_by: req.user.id
    });

    // Record action timeline entry on case A
    await caseActionRepo.create({
      complaint_id: caseA.id,
      action_type: 'CASE_COORDINATION_LINKED',
      previous_status: caseA.status,
      new_status: caseA.status, // Independent status preserved!
      remarks: `Cross-Bureau link established with case ${caseB.case_id} (${caseB.bureau.replace(/_/g, ' ')}). Reason: ${linkReason.trim()}`,
      performed_by: req.user.id
    });

    // Record action timeline entry on case B
    await caseActionRepo.create({
      complaint_id: caseB.id,
      action_type: 'CASE_COORDINATION_LINKED',
      previous_status: caseB.status,
      new_status: caseB.status, // Independent status preserved!
      remarks: `Cross-Bureau link established with case ${caseA.case_id} (${caseA.bureau.replace(/_/g, ' ')}). Reason: ${linkReason.trim()}`,
      performed_by: req.user.id
    });

    // If an alert ID was provided, automatically set alert status to CONFIRMED
    if (matchAlertId) {
      await matchAlertRepo.updateReview(matchAlertId, {
        status: 'CONFIRMED',
        reviewedBy: req.user.id,
        decisionReason: `Confirmed via formal case link: ${linkReason.trim()}`
      });
    }

    await auditRepo.log({
      user_id: req.user.id,
      event_type: 'CASE_LINK_CREATED',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: { sourceCaseId: caseA.case_id, targetCaseId: caseB.case_id, linkReason: linkReason.trim() }
    });

    return res.status(201).json({
      success: true,
      data: linkRecord,
      message: `Formal coordination link established between ${caseA.case_id} and ${caseB.case_id}. Both case lifecycles remain independent.`
    });
  } catch (err) {
    console.error('[CaseIntelligence] Create link error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create case coordination link.' }
    });
  }
});

/**
 * 6. GET /api/v1/intelligence/links/case/:complaintId
 * Returns all confirmed case links for a specific complaint
 */
router.get('/links/case/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const links = await caseLinkRepo.findByComplaintId(complaintId);

    return res.status(200).json({
      success: true,
      data: {
        complaintId,
        total: links.length,
        items: links
      }
    });
  } catch (err) {
    console.error('[CaseIntelligence] Get case links error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve case links.' }
    });
  }
});

/**
 * 7. GET /api/v1/intelligence/evaluation/benchmark
 * Runs synthetic evaluation benchmark on-demand and returns measured metrics
 */
router.get('/evaluation/benchmark', (req, res) => {
  try {
    const report = runBenchmarkEvaluation();
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error('[CaseIntelligence] Benchmark error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to execute synthetic benchmark evaluation.' }
    });
  }
});

module.exports = router;
