/**
 * Express REST API Routes for Case Workflow, Audit Trail, Reminders & Notifications
 * Implements traceable case transitions, transfers, escalations, closure approvals,
 * persistent notifications, and dynamic SLA scans.
 */

const express = require('express');
const router = express.Router();

const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const { ROLES, BUREAUS } = require('../utils/security');
const complaintRepo = require('../db/repositories/complaintRepository');
const caseActionRepo = require('../db/repositories/caseActionRepository');
const notificationRepo = require('../db/repositories/notificationRepository');
const userRepo = require('../db/repositories/userRepository');
const auditRepo = require('../db/repositories/auditRepository');
const memoryStore = require('../db/memoryStore');
const {
  WORKFLOW_STATUSES,
  STATUS_LABELS,
  isValidTransition,
  isClosureReviewRequired,
  validateTransitionPermissions,
  calculateSlaStatus,
  scanAndGenerateSlaReminders
} = require('../services/workflowService');

// All workflow routes require authentication
router.use(authenticate);

/**
 * 1. GET /api/v1/workflow/complaints/:id/actions
 * Returns complete chronological action timeline for a case
 */
router.get('/complaints/:id/actions', async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await complaintRepo.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Complaint with ID '${id}' was not found.` }
      });
    }

    // Scoping check for Bureau Officers
    const userBureau = req.user.primary_bureau || req.user.bureau;
    if (req.user.role === ROLES.BUREAU_OFFICER && userBureau && complaint.bureau !== userBureau) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_JURISDICTION', message: 'You cannot view action history outside your assigned Bureau.' }
      });
    }

    const actions = await caseActionRepo.listByComplaintId(id);

    return res.status(200).json({
      success: true,
      data: {
        complaintId: id,
        caseId: complaint.case_id,
        currentStatus: complaint.status,
        totalActions: actions.length,
        actions
      }
    });
  } catch (err) {
    console.error('[Workflow] Get actions error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve case action history.' }
    });
  }
});

/**
 * 2. POST /api/v1/workflow/complaints/:id/transition
 * Executes enforced status transition with audit logging and optional closure review
 */
router.post('/complaints/:id/transition', async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, remarks, documentReference } = req.body;

    if (!newStatus || !WORKFLOW_STATUSES[newStatus]) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Invalid status '${newStatus}'. Allowed: ${Object.keys(WORKFLOW_STATUSES).join(', ')}` }
      });
    }

    if (!remarks || remarks.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REMARKS', message: 'Substantive remarks (minimum 5 characters) are required for any workflow transition.' }
      });
    }

    const complaint = await complaintRepo.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Complaint with ID '${id}' was not found.` }
      });
    }

    let targetStatus = newStatus;

    // Optional Configurable Closure Review:
    // If closure review is enabled and officer attempts to DISPOSE an active case, divert to CLOSURE_REQUESTED
    if (targetStatus === WORKFLOW_STATUSES.DISPOSED && complaint.status !== WORKFLOW_STATUSES.CLOSURE_REQUESTED) {
      if (isClosureReviewRequired() && req.user.role !== ROLES.SENIOR_OFFICIAL && req.user.role !== ROLES.ADMIN) {
        targetStatus = WORKFLOW_STATUSES.CLOSURE_REQUESTED;
      }
    }

    // Validate state machine rule
    if (!isValidTransition(complaint.status, targetStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORKFLOW_TRANSITION',
          message: `Illegal workflow jump from '${complaint.status}' to '${targetStatus}'.`
        }
      });
    }

    // Validate role & scope permissions
    const permCheck = validateTransitionPermissions(req.user, complaint, targetStatus);
    if (!permCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_TRANSITION', message: permCheck.reason }
      });
    }

    // Apply status update
    const updatePayload = {
      status: targetStatus,
      last_action_date: new Date().toISOString()
    };

    if (targetStatus === WORKFLOW_STATUSES.DISPOSED) {
      updatePayload.disposed_date = new Date().toISOString();
    } else if (targetStatus === WORKFLOW_STATUSES.REOPENED) {
      updatePayload.disposed_date = null;
    }

    const updatedComplaint = await complaintRepo.update(id, updatePayload);

    // Record action timeline entry
    const actionRecord = await caseActionRepo.create({
      complaint_id: id,
      action_type: targetStatus === WORKFLOW_STATUSES.DISPOSED ? 'CASE_DISPOSED' :
                   targetStatus === WORKFLOW_STATUSES.REOPENED ? 'CASE_REOPENED' :
                   targetStatus === WORKFLOW_STATUSES.CLOSURE_REQUESTED ? 'CLOSURE_REVIEW_REQUESTED' : 'STATUS_CHANGED',
      previous_status: complaint.status,
      new_status: targetStatus,
      remarks: remarks.trim(),
      document_reference: documentReference || null,
      performed_by: req.user.id
    });

    // Notify assigned officer if someone else changed status
    if (complaint.assigned_officer_id && complaint.assigned_officer_id !== req.user.id) {
      await notificationRepo.create({
        user_id: complaint.assigned_officer_id,
        event_type: 'ASSIGNMENT_CHANGED',
        title: `Case Status Updated: ${complaint.case_id}`,
        message: `Case ${complaint.case_id} status changed from ${complaint.status} to ${targetStatus} by ${req.user.username}.`,
        complaint_id: id,
        case_id: complaint.case_id
      });
    }

    // If closure review requested, notify senior official
    if (targetStatus === WORKFLOW_STATUSES.CLOSURE_REQUESTED) {
      await notificationRepo.create({
        user_id: 'usr-senior-01',
        event_type: 'CLOSURE_APPROVAL_REQUEST',
        title: `Closure Review Requested: ${complaint.case_id}`,
        message: `Officer ${req.user.username} has submitted case ${complaint.case_id} for final closure approval.`,
        complaint_id: id,
        case_id: complaint.case_id
      });
    }

    await auditRepo.log({
      user_id: req.user.id,
      event_type: 'CASE_STATUS_TRANSITION',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: { caseId: complaint.case_id, from: complaint.status, to: targetStatus, remarks: remarks.trim() }
    });

    return res.status(200).json({
      success: true,
      data: {
        complaint: updatedComplaint,
        action: actionRecord
      },
      message: `Case ${complaint.case_id} successfully updated to ${STATUS_LABELS[targetStatus] || targetStatus}.`
    });
  } catch (err) {
    console.error('[Workflow] Transition error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to execute status transition.' }
    });
  }
});

/**
 * 3. POST /api/v1/workflow/complaints/:id/transfer
 * Transfers case to another bureau with traceable old/new owner tracking
 */
router.post('/complaints/:id/transfer', async (req, res) => {
  try {
    const { id } = req.params;
    const { destinationBureau, transferReason, targetOfficerId } = req.body;

    const validBureaus = Object.values(BUREAUS);
    if (!destinationBureau || !validBureaus.includes(destinationBureau)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_BUREAU', message: `Destination Bureau must be one of: ${validBureaus.join(', ')}` }
      });
    }

    if (!transferReason || transferReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_REASON', message: 'A substantive transfer reason (minimum 10 characters) is required.' }
      });
    }

    const complaint = await complaintRepo.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Complaint with ID '${id}' was not found.` }
      });
    }

    if (complaint.bureau === destinationBureau) {
      return res.status(400).json({
        success: false,
        error: { code: 'IDENTICAL_BUREAU', message: `Case is already under ${destinationBureau}.` }
      });
    }

    // Permission check: Actor must belong to current bureau or be Senior Official/Admin
    const userBureau = req.user.primary_bureau || req.user.bureau;
    const isSuperUser = req.user.role === ROLES.ADMIN || req.user.role === ROLES.SENIOR_OFFICIAL;
    if (!isSuperUser && userBureau !== complaint.bureau) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_JURISDICTION', message: 'You can only initiate transfers for cases within your Bureau.' }
      });
    }

    const previousBureau = complaint.bureau;
    const previousOfficer = complaint.assigned_officer_id;

    // Update complaint bureau and officer assignment
    const updated = await complaintRepo.update(id, {
      bureau: destinationBureau,
      assigned_officer_id: targetOfficerId || null,
      last_action_date: new Date().toISOString()
    });

    // Log action timeline record
    const actionRecord = await caseActionRepo.create({
      complaint_id: id,
      action_type: 'CASE_TRANSFERRED',
      previous_status: complaint.status,
      new_status: complaint.status,
      remarks: `Jurisdiction transferred from ${previousBureau.replace(/_/g, ' ')} to ${destinationBureau.replace(/_/g, ' ')}. Reason: ${transferReason.trim()}`,
      performed_by: req.user.id
    });

    // Send notifications to destination
    if (targetOfficerId) {
      await notificationRepo.create({
        user_id: targetOfficerId,
        event_type: 'CASE_TRANSFERRED',
        title: `Transferred Case Assigned: ${complaint.case_id}`,
        message: `Case ${complaint.case_id} was transferred from ${previousBureau.replace(/_/g, ' ')} to your queue. Reason: ${transferReason.trim()}`,
        complaint_id: id,
        case_id: complaint.case_id
      });
    }

    await auditRepo.log({
      user_id: req.user.id,
      event_type: 'CASE_TRANSFERRED',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: { caseId: complaint.case_id, fromBureau: previousBureau, toBureau: destinationBureau, reason: transferReason.trim() }
    });

    return res.status(200).json({
      success: true,
      data: {
        complaint: updated,
        action: actionRecord
      },
      message: `Case ${complaint.case_id} successfully transferred to ${destinationBureau.replace(/_/g, ' ')}.`
    });
  } catch (err) {
    console.error('[Workflow] Transfer error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to execute case transfer.' }
    });
  }
});

/**
 * 4. POST /api/v1/workflow/complaints/:id/escalate
 * Escalates case due to critical severity or breached SLA
 */
router.post('/complaints/:id/escalate', async (req, res) => {
  try {
    const { id } = req.params;
    const { escalationReason } = req.body;

    if (!escalationReason || escalationReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_REASON', message: 'A detailed escalation justification (minimum 10 characters) is required.' }
      });
    }

    const complaint = await complaintRepo.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Complaint with ID '${id}' was not found.` }
      });
    }

    // Check jurisdiction
    const userBureau = req.user.primary_bureau || req.user.bureau;
    const isSuperUser = req.user.role === ROLES.ADMIN || req.user.role === ROLES.SENIOR_OFFICIAL;
    if (!isSuperUser && userBureau !== complaint.bureau) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_JURISDICTION', message: 'You can only escalate cases within your jurisdiction.' }
      });
    }

    // Set severity to CRITICAL and mark escalated
    const updated = await complaintRepo.update(id, {
      severity: 'CRITICAL',
      last_action_date: new Date().toISOString()
    });

    const actionRecord = await caseActionRepo.create({
      complaint_id: id,
      action_type: 'CASE_ESCALATED',
      previous_status: complaint.status,
      new_status: complaint.status,
      remarks: `Priority escalated to CRITICAL. Reason: ${escalationReason.trim()}`,
      performed_by: req.user.id
    });

    // Notify Senior Official
    await notificationRepo.create({
      user_id: 'usr-senior-01',
      event_type: 'CASE_ESCALATED',
      title: `URGENT Escalation Alert: ${complaint.case_id}`,
      message: `Case ${complaint.case_id} (${complaint.bureau.replace(/_/g, ' ')}) has been escalated to CRITICAL. Reason: ${escalationReason.trim()}`,
      complaint_id: id,
      case_id: complaint.case_id
    });

    await auditRepo.log({
      user_id: req.user.id,
      event_type: 'CASE_ESCALATED',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: { caseId: complaint.case_id, reason: escalationReason.trim() }
    });

    return res.status(200).json({
      success: true,
      data: {
        complaint: updated,
        action: actionRecord
      },
      message: `Case ${complaint.case_id} successfully escalated to CRITICAL priority.`
    });
  } catch (err) {
    console.error('[Workflow] Escalation error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to escalate case.' }
    });
  }
});

/**
 * 5. GET /api/v1/workflow/notifications
 * Retrieves persistent in-app notifications for authenticated user
 */
router.get('/notifications', async (req, res) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = parseInt(req.query.limit, 10) || 50;

    const items = await notificationRepo.findByUser(req.user.id, { unreadOnly, limit });
    const unreadCount = await notificationRepo.countUnread(req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
        total: items.length,
        items
      }
    });
  } catch (err) {
    console.error('[Workflow] Get notifications error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve notifications.' }
    });
  }
});

/**
 * 6. GET /api/v1/workflow/notifications/unread-count
 */
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const unreadCount = await notificationRepo.countUnread(req.user.id);
    return res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (err) {
    console.error('[Workflow] Unread count error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch unread notification count.' }
    });
  }
});

/**
 * 7. PATCH /api/v1/workflow/notifications/:id/read
 */
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await notificationRepo.markAsRead(id, req.user.id);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found or unauthorized.' }
      });
    }

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err) {
    console.error('[Workflow] Mark read error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update notification status.' }
    });
  }
});

/**
 * 8. PATCH /api/v1/workflow/notifications/read-all
 */
router.patch('/notifications/read-all', async (req, res) => {
  try {
    const count = await notificationRepo.markAllAsRead(req.user.id);
    return res.status(200).json({
      success: true,
      data: { markedRead: count },
      message: 'All notifications marked as read.'
    });
  } catch (err) {
    console.error('[Workflow] Mark all read error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to mark notifications read.' }
    });
  }
});

/**
 * 9. POST /api/v1/workflow/cron/check-slas
 * Scheduled / on-demand processor that checks SLA deadlines and generates deduplicated alerts
 */
router.post('/cron/check-slas', async (req, res) => {
  try {
    const result = await scanAndGenerateSlaReminders({
      complaintRepo,
      notificationRepo,
      userRepo
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: `SLA scan complete: ${result.scannedCount} cases reviewed, ${result.overdueAlertsCreated} overdue alerts, ${result.dueSoonAlertsCreated} reminders, ${result.deduplicatedCount} deduplicated.`
    });
  } catch (err) {
    console.error('[Workflow] Cron SLA error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to execute SLA reminder scanner.' }
    });
  }
});

/**
 * 10. GET /api/v1/workflow/config
 * Retrieves workflow configuration settings
 */
router.get('/config', (req, res) => {
  try {
    const configs = memoryStore.getAllWorkflowConfigs();
    return res.status(200).json({
      success: true,
      data: configs
    });
  } catch (err) {
    console.error('[Workflow] Get config error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve workflow configuration.' }
    });
  }
});

/**
 * 11. PATCH /api/v1/workflow/config
 * Admin only: Updates workflow settings (e.g. closure review toggle, SLA defaults)
 */
router.patch('/config', async (req, res) => {
  try {
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_ADMIN_ONLY', message: 'Only System Administrators can modify workflow policy settings.' }
      });
    }

    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Both key and value are required.' }
      });
    }

    const updated = memoryStore.setWorkflowConfig(key, value);

    await auditRepo.log({
      user_id: req.user.id,
      event_type: 'WORKFLOW_CONFIG_UPDATED',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata: { key, value }
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: `Workflow setting '${key}' updated to '${value}'.`
    });
  } catch (err) {
    console.error('[Workflow] Update config error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update workflow configuration.' }
    });
  }
});

/**
 * 12. GET /api/v1/workflow/audit
 * Administrative security audit log access
 */
router.get('/audit', async (req, res) => {
  try {
    const isSuperUser = req.user.role === ROLES.ADMIN || req.user.role === ROLES.SENIOR_OFFICIAL;
    if (!isSuperUser) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_AUDIT_ACCESS', message: 'Audit trails are restricted to Administrators and Senior Officials.' }
      });
    }

    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const eventType = req.query.eventType || '';

    const logs = await auditRepo.listAuditLogs({ limit, offset, eventType });

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (err) {
    console.error('[Workflow] Audit error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch audit log trail.' }
    });
  }
});

module.exports = router;
