/**
 * Central Workflow Service for samadhanX
 * Enforces complaint lifecycle state machine, role-based transitions,
 * configurable closure review, transfers, escalations, dynamic SLA calculation,
 * and automated reminder deduplication.
 */

const memoryStore = require('../db/memoryStore');
const { ROLES, BUREAUS } = require('../utils/security');

const WORKFLOW_STATUSES = {
  RECEIVED: 'RECEIVED',
  VALIDATION_ASSIGNMENT: 'VALIDATION_ASSIGNMENT',
  UNDER_PROCESS: 'UNDER_PROCESS',
  REVIEW_COORDINATION: 'REVIEW_COORDINATION',
  CLOSURE_REQUESTED: 'CLOSURE_REQUESTED', // Used when closure review approval is enabled
  DISPOSED: 'DISPOSED',
  REOPENED: 'REOPENED'
};

const STATUS_LABELS = {
  RECEIVED: 'Received / Registered',
  VALIDATION_ASSIGNMENT: 'Validation & Assignment',
  UNDER_PROCESS: 'Under Process',
  REVIEW_COORDINATION: 'Review & Coordination',
  CLOSURE_REQUESTED: 'Closure Requested (Pending Approval)',
  DISPOSED: 'Disposed / Closed',
  REOPENED: 'Authorized Reopened'
};

// Transition validation matrix
const ALLOWED_TRANSITIONS = {
  RECEIVED: [
    WORKFLOW_STATUSES.VALIDATION_ASSIGNMENT,
    WORKFLOW_STATUSES.DISPOSED // Summary dismissal / invalid complaint
  ],
  VALIDATION_ASSIGNMENT: [
    WORKFLOW_STATUSES.UNDER_PROCESS,
    WORKFLOW_STATUSES.RECEIVED,
    WORKFLOW_STATUSES.DISPOSED
  ],
  UNDER_PROCESS: [
    WORKFLOW_STATUSES.REVIEW_COORDINATION,
    WORKFLOW_STATUSES.CLOSURE_REQUESTED,
    WORKFLOW_STATUSES.DISPOSED
  ],
  REVIEW_COORDINATION: [
    WORKFLOW_STATUSES.UNDER_PROCESS,
    WORKFLOW_STATUSES.CLOSURE_REQUESTED,
    WORKFLOW_STATUSES.DISPOSED
  ],
  CLOSURE_REQUESTED: [
    WORKFLOW_STATUSES.DISPOSED,     // Approved closure
    WORKFLOW_STATUSES.UNDER_PROCESS // Rejected closure, sent back for further investigation
  ],
  DISPOSED: [
    WORKFLOW_STATUSES.REOPENED // Reopening requires administrative justification
  ],
  REOPENED: [
    WORKFLOW_STATUSES.UNDER_PROCESS,
    WORKFLOW_STATUSES.DISPOSED
  ]
};

/**
 * Validates if transition from currentStatus to newStatus is allowed
 */
function isValidTransition(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) return false;
  if (currentStatus === newStatus) return true; // Idempotent no-op

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
  return Boolean(allowedNext && allowedNext.includes(newStatus));
}

/**
 * Checks if closure review is currently required by system configuration
 */
function isClosureReviewRequired() {
  const val = memoryStore.getWorkflowConfig('REQUIRE_CLOSURE_REVIEW', 'false');
  return String(val).toLowerCase() === 'true';
}

/**
 * Validates role permission for specific workflow transitions
 */
function validateTransitionPermissions(user, complaint, targetStatus) {
  const userBureau = user.primary_bureau || user.bureau;
  const isSuperUser = user.role === ROLES.ADMIN || user.role === ROLES.SENIOR_OFFICIAL;

  // 1. Bureau Officers can only act on cases in their own Bureau
  if (user.role === ROLES.BUREAU_OFFICER && !isSuperUser) {
    if (userBureau && complaint.bureau !== userBureau) {
      return { allowed: false, reason: `Action restricted: Case belongs to ${complaint.bureau}, but officer is assigned to ${userBureau}.` };
    }
  }

  // 2. Reopening a disposed case requires Senior Official or Administrator authority
  if (targetStatus === WORKFLOW_STATUSES.REOPENED && !isSuperUser) {
    return { allowed: false, reason: 'Reopening disposed cases requires Senior Official or System Administrator authorization.' };
  }

  // 3. Approving closure from CLOSURE_REQUESTED requires Senior Official or Administrator
  if (complaint.status === WORKFLOW_STATUSES.CLOSURE_REQUESTED && targetStatus === WORKFLOW_STATUSES.DISPOSED && !isSuperUser) {
    return { allowed: false, reason: 'Final closure approval for cases in CLOSURE_REQUESTED status requires Senior Official review.' };
  }

  return { allowed: true };
}

/**
 * Calculates dynamic SLA status based on expected disposal date, current status, and optional escalation
 */
function calculateSlaStatus(expectedDisposalDate, currentStatus, disposedDate = null, isEscalated = false) {
  if (currentStatus === WORKFLOW_STATUSES.DISPOSED) {
    return {
      isDisposed: true,
      isOverdue: false,
      daysOverdue: 0,
      daysRemaining: 0,
      slaState: 'DISPOSED'
    };
  }

  if (isEscalated) {
    return {
      isDisposed: false,
      isOverdue: true,
      daysOverdue: 1,
      daysRemaining: 0,
      slaState: 'ESCALATED'
    };
  }

  if (!expectedDisposalDate) {
    return {
      isDisposed: false,
      isOverdue: false,
      daysOverdue: 0,
      daysRemaining: 99,
      slaState: 'WITHIN_SLA'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(expectedDisposalDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - due) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      isDisposed: false,
      isOverdue: true,
      daysOverdue: diffDays,
      daysRemaining: 0,
      slaState: 'OVERDUE'
    };
  } else if (diffDays >= -7) {
    // Within 7 days of deadline
    return {
      isDisposed: false,
      isOverdue: false,
      daysOverdue: 0,
      daysRemaining: Math.abs(diffDays),
      slaState: 'APPROACHING_DEADLINE'
    };
  }

  return {
    isDisposed: false,
    isOverdue: false,
    daysOverdue: 0,
    daysRemaining: Math.abs(diffDays),
    slaState: 'WITHIN_SLA'
  };
}

/**
 * Evaluates default SLA duration in days based on severity (configurable prototype settings)
 */
function getSlaDaysForSeverity(severity = 'STANDARD') {
  if (severity === 'CRITICAL') {
    return parseInt(memoryStore.getWorkflowConfig('SLA_CRITICAL_DAYS', '7'), 10);
  }
  if (severity === 'HIGH') {
    return parseInt(memoryStore.getWorkflowConfig('SLA_HIGH_DAYS', '14'), 10);
  }
  return parseInt(memoryStore.getWorkflowConfig('SLA_STANDARD_DAYS', '30'), 10);
}

/**
 * Calculates default SLA expected disposal date from receipt date
 */
function calculateExpectedDisposalDate(receivedDate, severity = 'STANDARD') {
  const slaDays = getSlaDaysForSeverity(severity);
  const base = receivedDate ? new Date(receivedDate) : new Date();
  const disposal = new Date(base.getTime() + slaDays * 24 * 60 * 60 * 1000);
  return disposal.toISOString().split('T')[0];
}

/**
 * Scheduled/On-Demand Due-Date & SLA Scanner
 * Checks all active complaints and generates in-app notifications with deduplication.
 */
async function scanAndGenerateSlaReminders({ complaintRepo, notificationRepo, userRepo }) {
  const allComplaints = await complaintRepo.findAll();
  const activeComplaints = allComplaints.filter(c => c.status !== WORKFLOW_STATUSES.DISPOSED);

  let scannedCount = 0;
  let overdueAlertsCreated = 0;
  let dueSoonAlertsCreated = 0;
  let deduplicatedCount = 0;

  // Find senior official for escalation copy
  const seniorUsers = await userRepo.findByRole ? await userRepo.findByRole(ROLES.SENIOR_OFFICIAL) : [];
  const seniorOfficialId = seniorUsers[0]?.id || 'usr-senior-01';

  for (const complaint of activeComplaints) {
    scannedCount++;
    const sla = calculateSlaStatus(complaint.expected_disposal_date, complaint.status, complaint.disposed_date);
    const recipientId = complaint.assigned_officer_id || seniorOfficialId;

    if (sla.slaState === 'OVERDUE') {
      // Check deduplication (window: 24 hours)
      const hasRecent = await notificationRepo.hasRecentReminder(complaint.id, 'CASE_OVERDUE', 24);
      if (!hasRecent) {
        await notificationRepo.create({
          user_id: recipientId,
          event_type: 'CASE_OVERDUE',
          title: `Overdue Case: ${complaint.case_id}`,
          message: `Case ${complaint.case_id} has exceeded its SLA deadline by ${sla.daysOverdue} day(s). Immediate action required.`,
          complaint_id: complaint.id,
          case_id: complaint.case_id,
          navigation_url: `/app/complaints/${complaint.id}`
        });
        overdueAlertsCreated++;
      } else {
        deduplicatedCount++;
      }
    } else if (sla.slaState === 'APPROACHING_DEADLINE') {
      const hasRecent = await notificationRepo.hasRecentReminder(complaint.id, 'DUE_DATE_REMINDER', 24);
      if (!hasRecent) {
        await notificationRepo.create({
          user_id: recipientId,
          event_type: 'DUE_DATE_REMINDER',
          title: `Due Date Reminder: ${complaint.case_id}`,
          message: `Case ${complaint.case_id} has ${sla.daysRemaining} day(s) remaining before SLA deadline.`,
          complaint_id: complaint.id,
          case_id: complaint.case_id,
          navigation_url: `/app/complaints/${complaint.id}`
        });
        dueSoonAlertsCreated++;
      } else {
        deduplicatedCount++;
      }
    }
  }

  return {
    scannedCount,
    overdueAlertsCreated,
    dueSoonAlertsCreated,
    deduplicatedCount,
    processedAt: new Date().toISOString()
  };
}

module.exports = {
  WORKFLOW_STATUSES,
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
  isValidTransition,
  isClosureReviewRequired,
  validateTransitionPermissions,
  calculateSlaStatus,
  getSlaDaysForSeverity,
  calculateExpectedDisposalDate,
  scanAndGenerateSlaReminders
};
