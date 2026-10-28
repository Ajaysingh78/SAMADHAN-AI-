/**
 * Express REST API Routes for Integrated Dashboard, Reporting & Analytics
 * Delivers data-driven metrics, multi-criteria scoped searches, and CSV exports
 * with anti-formula injection safeguards.
 */

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/authMiddleware');
const { ROLES, BUREAUS } = require('../utils/security');
const complaintRepo = require('../db/repositories/complaintRepository');
const institutionRepo = require('../db/repositories/institutionRepository');
const caseActionRepo = require('../db/repositories/caseActionRepository');
const caseLinkRepo = require('../db/repositories/caseLinkRepository');
const matchAlertRepo = require('../db/repositories/matchAlertRepository');
const memoryStore = require('../db/memoryStore');
const { calculateSlaStatus, WORKFLOW_STATUSES } = require('../services/workflowService');

// All reports routes require authentication
router.use(authenticate);

/**
 * Helper: Sanitizes a string for CSV to prevent formula injection
 * Prepends single quote (') if string begins with =, +, -, @, \t, or \r
 */
function sanitizeCsvField(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim().replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

/**
 * 1. GET /api/v1/reports/metrics
 * Comprehensive aggregate statistics and analytics breakdown for the dashboard
 */
router.get('/metrics', async (req, res) => {
  try {
    const user = req.user;
    const isSuperUser = user.role === ROLES.ADMIN || user.role === ROLES.SENIOR_OFFICIAL;
    const userBureau = user.primary_bureau || user.bureau;

    // Fetch all complaints
    let allComplaints = await complaintRepo.findAll();

    // Fetch case links for cross-bureau correlation metrics
    const allLinks = await caseLinkRepo.findAll();
    const linkedComplaintIds = new Set();
    allLinks.forEach(link => {
      if (link.source_complaint_id) linkedComplaintIds.add(link.source_complaint_id);
      if (link.target_complaint_id) linkedComplaintIds.add(link.target_complaint_id);
    });

    // Fetch match alerts
    const allAlerts = await matchAlertRepo.findAll();


    // Scope filtering:
    // Bureau Officers only evaluate cases within their bureau,
    // Regional Officers only evaluate cases within their institution region,
    // Senior Officials and Admins evaluate entire system.
    let scopedComplaints = allComplaints;
    if (user.role === ROLES.BUREAU_OFFICER && userBureau) {
      scopedComplaints = allComplaints.filter(c => c.bureau === userBureau);
    } else if (user.role === ROLES.REGIONAL_OFFICER && user.region && user.region !== 'ALL') {
      scopedComplaints = allComplaints.filter(c => c.institution_region === user.region);
    }

    const now = new Date();

    // Counters
    let pendingCount = 0;
    let underProcessCount = 0;
    let closureRequestedCount = 0;
    let disposedCount = 0;
    let reopenedCount = 0;
    let overdueCount = 0;
    let dueSoonCount = 0;
    let criticalCount = 0;
    let crossBureauLinkedCount = 0;

    // Distributions
    const bureauWorkload = {
      REGULATION_BUREAU: { total: 0, pending: 0, underProcess: 0, disposed: 0, overdue: 0 },
      PGRC: { total: 0, pending: 0, underProcess: 0, disposed: 0, overdue: 0 },
      APPROVAL_BUREAU: { total: 0, pending: 0, underProcess: 0, disposed: 0, overdue: 0 },
      REGIONAL_OFFICE: { total: 0, pending: 0, underProcess: 0, disposed: 0, overdue: 0 }
    };

    const categoryBreakdown = {};
    const severityBreakdown = { CRITICAL: 0, HIGH: 0, STANDARD: 0 };
    const ageingDistribution = {
      under15Days: 0,
      between15And30Days: 0,
      between30And60Days: 0,
      over60Days: 0
    };

    const institutionCountMap = new Map();

    scopedComplaints.forEach(c => {
      // Distinct calculation per unique complaint (no double-counting)
      const status = c.status || 'RECEIVED';
      const severity = c.severity || 'STANDARD';
      const sla = calculateSlaStatus(
        c.expected_disposal_date,
        status,
        c.disposed_date,
        severity === 'CRITICAL'
      );

      // Status aggregation
      if (status === WORKFLOW_STATUSES.RECEIVED || status === WORKFLOW_STATUSES.VALIDATION_ASSIGNMENT) {
        pendingCount += 1;
      } else if (status === WORKFLOW_STATUSES.UNDER_PROCESS || status === WORKFLOW_STATUSES.REVIEW_COORDINATION) {
        underProcessCount += 1;
      } else if (status === WORKFLOW_STATUSES.CLOSURE_REQUESTED) {
        closureRequestedCount += 1;
      } else if (status === WORKFLOW_STATUSES.DISPOSED) {
        disposedCount += 1;
      } else if (status === WORKFLOW_STATUSES.REOPENED) {
        reopenedCount += 1;
      }

      // SLA dynamics
      if (sla.isOverdue) overdueCount += 1;
      if (sla.slaState === 'APPROACHING_DEADLINE') dueSoonCount += 1;

      // Severity
      if (severity === 'CRITICAL') criticalCount += 1;
      severityBreakdown[severity] = (severityBreakdown[severity] || 0) + 1;

      // Linked status
      if (linkedComplaintIds.has(c.id)) {
        crossBureauLinkedCount += 1;
      }

      // Category breakdown
      const cat = c.category || 'OTHER';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

      // Bureau workload distribution
      const bKey = c.bureau;
      if (bureauWorkload[bKey]) {
        bureauWorkload[bKey].total += 1;
        if (status === WORKFLOW_STATUSES.RECEIVED || status === WORKFLOW_STATUSES.VALIDATION_ASSIGNMENT) {
          bureauWorkload[bKey].pending += 1;
        } else if (status === WORKFLOW_STATUSES.UNDER_PROCESS || status === WORKFLOW_STATUSES.REVIEW_COORDINATION) {
          bureauWorkload[bKey].underProcess += 1;
        } else if (status === WORKFLOW_STATUSES.DISPOSED) {
          bureauWorkload[bKey].disposed += 1;
        }
        if (sla.isOverdue) bureauWorkload[bKey].overdue += 1;
      }

      // Ageing calculation
      const receivedDate = new Date(c.received_date || c.created_at);
      const ageDays = Math.max(0, Math.round((now - receivedDate) / (1000 * 60 * 60 * 24)));
      if (ageDays <= 15) {
        ageingDistribution.under15Days += 1;
      } else if (ageDays <= 30) {
        ageingDistribution.between15And30Days += 1;
      } else if (ageDays <= 60) {
        ageingDistribution.between30And60Days += 1;
      } else {
        ageingDistribution.over60Days += 1;
      }

      // Institution frequency map
      if (c.institution_id) {
        const current = institutionCountMap.get(c.institution_id) || {
          institutionId: c.institution_id,
          name: c.institution_name || 'Technical Institute',
          aicteId: c.aicte_permanent_id || 'PENDING',
          region: c.institution_region || 'Northern',
          count: 0
        };
        current.count += 1;
        institutionCountMap.set(c.institution_id, current);
      }
    });

    // Top institutions
    const topInstitutions = Array.from(institutionCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Pending match review tasks in scope
    let pendingMatchReviewsCount = 0;
    allAlerts.forEach(alert => {
      if (alert.status === 'PENDING_REVIEW') {
        if (isSuperUser) {
          pendingMatchReviewsCount += 1;
        } else if (userBureau && (alert.source_bureau === userBureau || alert.candidate_bureau === userBureau)) {
          pendingMatchReviewsCount += 1;
        }
      }
    });

    // Recent actions (latest 8)
    const recentActions = await caseActionRepo.listRecent(8);

    // Recent escalations
    const recentEscalations = scopedComplaints
      .filter(c => c.severity === 'CRITICAL')
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        caseId: c.case_id,
        institutionName: c.institution_name,
        bureau: c.bureau,
        subject: c.subject,
        status: c.status,
        slaDueDate: c.expected_disposal_date
      }));

    const total = scopedComplaints.length;
    const disposalRate = total > 0 ? Math.round((disposedCount / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        scope: {
          userRole: user.role,
          jurisdiction: isSuperUser ? 'ALL_BUREAUS (Executive Oversight)' : (userBureau || user.region || 'ALL'),
          isFiltered: !isSuperUser
        },
        counters: {
          totalComplaints: total,
          pendingCases: pendingCount,
          underProcessCases: underProcessCount,
          closureRequestedCases: closureRequestedCount,
          disposedCases: disposedCount,
          reopenedCases: reopenedCount,
          overdueCases: overdueCount,
          dueSoonCases: dueSoonCount,
          activeEscalationsCount: criticalCount,
          crossBureauLinkedCount,
          pendingMatchReviewsCount,
          disposalRatePercentage: disposalRate
        },
        distributions: {
          bureauWorkload,
          categoryBreakdown,
          severityBreakdown,
          ageingDistribution
        },
        topInstitutions,
        recentEscalations,
        recentActions,
        meta: {
          environment: 'beta-demonstration',
          dataDisclaimer: 'Demonstration Data: Real-time database metrics derived from synchronized synthetic cases. AICTE SLA thresholds are configurable demo policies.',
          generatedAt: new Date().toISOString()
        }
      }
    });
  } catch (err) {
    console.error('[Reports] Get metrics error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate dashboard metrics.' }
    });
  }
});

/**
 * 2. GET /api/v1/reports/search
 * Multi-criteria search and reporting across cases with dynamic SLA resolution
 */
router.get('/search', async (req, res) => {
  try {
    const user = req.user;
    const isSuperUser = user.role === ROLES.ADMIN || user.role === ROLES.SENIOR_OFFICIAL;
    const userBureau = user.primary_bureau || user.bureau;

    let {
      query = '',
      caseId = '',
      institutionSearch = '',
      bureau = '',
      region = '',
      category = '',
      status = '',
      severity = '',
      overdueOnly = 'false',
      linkedOnly = 'false',
      startDate = '',
      endDate = '',
      page = 1,
      limit = 20
    } = req.query;

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    // Scope enforcement: Non-superusers cannot query outside their bureau/region
    if (!isSuperUser) {
      if (user.role === ROLES.BUREAU_OFFICER && userBureau) {
        bureau = userBureau;
      } else if (user.role === ROLES.REGIONAL_OFFICER && user.region && user.region !== 'ALL') {
        region = user.region;
      }
    }

    let allComplaints = await complaintRepo.findAll();

    // Pre-load case links for linking filter
    const allLinks = await caseLinkRepo.findAll();
    const linkedCaseIdCountMap = new Map();
    allLinks.forEach(l => {
      linkedCaseIdCountMap.set(l.source_complaint_id, (linkedCaseIdCountMap.get(l.source_complaint_id) || 0) + 1);
      linkedCaseIdCountMap.set(l.target_complaint_id, (linkedCaseIdCountMap.get(l.target_complaint_id) || 0) + 1);
    });

    // Multi-criteria filter execution
    let filtered = allComplaints.filter(c => {
      // 1. Bureau filter
      if (bureau && c.bureau !== bureau) return false;

      // 2. Region filter
      if (region && c.institution_region !== region) return false;

      // 3. Status filter
      if (status && c.status !== status) return false;

      // 4. Category filter
      if (category && c.category !== category) return false;

      // 5. Severity filter
      if (severity && c.severity !== severity) return false;

      // 6. Case ID prefix / match
      if (caseId && !c.case_id.toLowerCase().includes(caseId.toLowerCase().trim())) return false;

      // 7. Institution Search
      if (institutionSearch) {
        const q = institutionSearch.toLowerCase().trim();
        const matchName = c.institution_name && c.institution_name.toLowerCase().includes(q);
        const matchAicte = c.aicte_permanent_id && c.aicte_permanent_id.toLowerCase().includes(q);
        if (!matchName && !matchAicte) return false;
      }

      // 8. General search query
      if (query) {
        const q = query.toLowerCase().trim();
        const matchCase = c.case_id.toLowerCase().includes(q);
        const matchSub = c.subject && c.subject.toLowerCase().includes(q);
        const matchDesc = c.description && c.description.toLowerCase().includes(q);
        const matchInst = c.institution_name && c.institution_name.toLowerCase().includes(q);
        if (!matchCase && !matchSub && !matchDesc && !matchInst) return false;
      }

      // 9. Date range
      if (startDate) {
        if (new Date(c.received_date) < new Date(startDate)) return false;
      }
      if (endDate) {
        if (new Date(c.received_date) > new Date(endDate)) return false;
      }

      // 10. Linked only
      const linkCount = linkedCaseIdCountMap.get(c.id) || 0;
      if (linkedOnly === 'true' && linkCount === 0) return false;

      // 11. Overdue only
      if (overdueOnly === 'true') {
        const sla = calculateSlaStatus(
          c.expected_disposal_date,
          c.status,
          c.disposed_date,
          c.severity === 'CRITICAL'
        );
        if (!sla.isOverdue) return false;
      }

      return true;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    // Enrich with dynamic SLA and link statistics
    const enriched = paginated.map(c => {
      const sla = calculateSlaStatus(
        c.expected_disposal_date,
        c.status,
        c.disposed_date,
        c.severity === 'CRITICAL'
      );
      return {
        ...c,
        slaStatus: sla,
        linkedCasesCount: linkedCaseIdCountMap.get(c.id) || 0
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        total,
        page,
        limit,
        totalPages,
        items: enriched
      }
    });
  } catch (err) {
    console.error('[Reports] Search error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to search complaint records.' }
    });
  }
});

/**
 * 3. GET /api/v1/reports/export-csv
 * Exports filtered records as CSV with OWASP CSV Injection / Formula Injection prevention
 */
router.get('/export-csv', async (req, res) => {
  try {
    const user = req.user;
    const isSuperUser = user.role === ROLES.ADMIN || user.role === ROLES.SENIOR_OFFICIAL;
    const userBureau = user.primary_bureau || user.bureau;

    let {
      query = '',
      caseId = '',
      institutionSearch = '',
      bureau = '',
      region = '',
      category = '',
      status = '',
      severity = '',
      overdueOnly = 'false',
      linkedOnly = 'false',
      startDate = '',
      endDate = ''
    } = req.query;

    // Scope enforcement
    if (!isSuperUser) {
      if (user.role === ROLES.BUREAU_OFFICER && userBureau) {
        bureau = userBureau;
      } else if (user.role === ROLES.REGIONAL_OFFICER && user.region && user.region !== 'ALL') {
        region = user.region;
      }
    }

    let allComplaints = await complaintRepo.findAll();

    const allLinks = await caseLinkRepo.findAll();
    const linkedCaseIdCountMap = new Map();
    allLinks.forEach(l => {
      linkedCaseIdCountMap.set(l.source_complaint_id, (linkedCaseIdCountMap.get(l.source_complaint_id) || 0) + 1);
      linkedCaseIdCountMap.set(l.target_complaint_id, (linkedCaseIdCountMap.get(l.target_complaint_id) || 0) + 1);
    });

    // Apply identical filtering logic
    let filtered = allComplaints.filter(c => {
      if (bureau && c.bureau !== bureau) return false;
      if (region && c.institution_region !== region) return false;
      if (status && c.status !== status) return false;
      if (category && c.category !== category) return false;
      if (severity && c.severity !== severity) return false;
      if (caseId && !c.case_id.toLowerCase().includes(caseId.toLowerCase().trim())) return false;

      if (institutionSearch) {
        const q = institutionSearch.toLowerCase().trim();
        const matchName = c.institution_name && c.institution_name.toLowerCase().includes(q);
        const matchAicte = c.aicte_permanent_id && c.aicte_permanent_id.toLowerCase().includes(q);
        if (!matchName && !matchAicte) return false;
      }

      if (query) {
        const q = query.toLowerCase().trim();
        const matchCase = c.case_id.toLowerCase().includes(q);
        const matchSub = c.subject && c.subject.toLowerCase().includes(q);
        const matchDesc = c.description && c.description.toLowerCase().includes(q);
        const matchInst = c.institution_name && c.institution_name.toLowerCase().includes(q);
        if (!matchCase && !matchSub && !matchDesc && !matchInst) return false;
      }

      if (startDate && new Date(c.received_date) < new Date(startDate)) return false;
      if (endDate && new Date(c.received_date) > new Date(endDate)) return false;

      const linkCount = linkedCaseIdCountMap.get(c.id) || 0;
      if (linkedOnly === 'true' && linkCount === 0) return false;

      if (overdueOnly === 'true') {
        const sla = calculateSlaStatus(
          c.expected_disposal_date,
          c.status,
          c.disposed_date,
          c.severity === 'CRITICAL'
        );
        if (!sla.isOverdue) return false;
      }

      return true;
    });

    // Construct CSV Header
    const headers = [
      'Case ID',
      'AICTE Permanent ID',
      'Institution Name',
      'Bureau / Cell',
      'Region',
      'Category',
      'Severity',
      'Status',
      'Complainant Type',
      'Received Date',
      'SLA Due Date',
      'SLA Overdue Status',
      'Disposed Date',
      'Linked Cases Count',
      'Subject'
    ];

    const rows = [headers.map(h => `"${h}"`).join(',')];


    // Build rows with Anti-Formula Injection sanitization
    filtered.forEach(c => {
      const sla = calculateSlaStatus(
        c.expected_disposal_date,
        c.status,
        c.disposed_date,
        c.severity === 'CRITICAL'
      );
      const linkCount = linkedCaseIdCountMap.get(c.id) || 0;

      const row = [
        sanitizeCsvField(c.case_id),
        sanitizeCsvField(c.aicte_permanent_id || 'N/A'),
        sanitizeCsvField(c.institution_name || 'N/A'),
        sanitizeCsvField(c.bureau),
        sanitizeCsvField(c.institution_region || 'N/A'),
        sanitizeCsvField(c.category),
        sanitizeCsvField(c.severity),
        sanitizeCsvField(c.status),
        sanitizeCsvField(c.complainant_type),
        sanitizeCsvField(c.received_date),
        sanitizeCsvField(c.expected_disposal_date || 'N/A'),
        sanitizeCsvField(sla.isOverdue ? `OVERDUE (${sla.daysOverdue} days)` : sla.slaState),
        sanitizeCsvField(c.disposed_date ? c.disposed_date.split('T')[0] : 'N/A'),
        sanitizeCsvField(linkCount),
        sanitizeCsvField(c.subject)
      ];

      rows.push(row.join(','));
    });

    const csvContent = rows.join('\r\n');
    const filename = `samadhan_case_report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[Reports] Export CSV error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to export CSV report.' }
    });
  }
});

module.exports = router;
