/**
 * Central Workflow Definition & Transition Validator
 * Ensures valid status progression conforming to the proposed AICTE complaint lifecycle.
 */

const WORKFLOW_STATUSES = {
  RECEIVED: 'RECEIVED',
  VALIDATION_ASSIGNMENT: 'VALIDATION_ASSIGNMENT',
  UNDER_PROCESS: 'UNDER_PROCESS',
  REVIEW_COORDINATION: 'REVIEW_COORDINATION',
  DISPOSED: 'DISPOSED',
  REOPENED: 'REOPENED'
};

const STATUS_LABELS = {
  RECEIVED: 'Received / Registered',
  VALIDATION_ASSIGNMENT: 'Validation & Assignment',
  UNDER_PROCESS: 'Under Process',
  REVIEW_COORDINATION: 'Review & Coordination',
  DISPOSED: 'Disposed / Closed',
  REOPENED: 'Authorized Reopened'
};

const ALLOWED_TRANSITIONS = {
  RECEIVED: [
    WORKFLOW_STATUSES.VALIDATION_ASSIGNMENT,
    WORKFLOW_STATUSES.DISPOSED // Summary disposal / invalid complaint
  ],
  VALIDATION_ASSIGNMENT: [
    WORKFLOW_STATUSES.UNDER_PROCESS,
    WORKFLOW_STATUSES.RECEIVED
  ],
  UNDER_PROCESS: [
    WORKFLOW_STATUSES.REVIEW_COORDINATION,
    WORKFLOW_STATUSES.DISPOSED
  ],
  REVIEW_COORDINATION: [
    WORKFLOW_STATUSES.UNDER_PROCESS,
    WORKFLOW_STATUSES.DISPOSED
  ],
  DISPOSED: [
    WORKFLOW_STATUSES.REOPENED // Reopening requires justification and audit
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
 * Calculates default SLA expected disposal date (default 30 days from receipt)
 */
function calculateExpectedDisposalDate(receivedDate, slaDays = 30) {
  const base = receivedDate ? new Date(receivedDate) : new Date();
  const disposal = new Date(base.getTime() + slaDays * 24 * 60 * 60 * 1000);
  return disposal.toISOString().split('T')[0];
}

/**
 * Calculates overdue status and days remaining/overdue
 */
function calculateSlaStatus(expectedDisposalDate, currentStatus, disposedDate = null) {
  if (currentStatus === WORKFLOW_STATUSES.DISPOSED) {
    return {
      isDisposed: true,
      isOverdue: false,
      daysOverdue: 0,
      slaState: 'DISPOSED'
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
      slaState: 'OVERDUE'
    };
  } else if (diffDays >= -10) {
    // Within 10 days of deadline
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

module.exports = {
  WORKFLOW_STATUSES,
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
  isValidTransition,
  calculateExpectedDisposalDate,
  calculateSlaStatus
};
