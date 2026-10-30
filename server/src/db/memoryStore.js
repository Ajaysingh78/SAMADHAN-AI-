/**
 * In-Memory Database Store for samadhanX
 * Serves as a resilient storage adapter when external MySQL is offline or in test environments.
 */

const crypto = require('crypto');

class MemoryStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.roles = new Map();
    this.users = new Map();
    this.userScopes = new Map();
    this.revokedTokens = new Set();
    this.auditLogs = [];
    this.institutions = new Map();
    this.complaints = new Map();
    this.caseActions = [];
    this.matchAlerts = new Map();
    this.caseLinks = new Map();
    this.notifications = new Map();
    this.workflowConfig = new Map([
      ['REQUIRE_CLOSURE_REVIEW', 'false'],
      ['SLA_STANDARD_DAYS', '30'],
      ['SLA_HIGH_DAYS', '14'],
      ['SLA_CRITICAL_DAYS', '7']
    ]);
  }

  // --- Users ---
  findUserByUsername(username) {
    if (!username) return null;
    const lower = username.toLowerCase();
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === lower) {
        return { ...user };
      }
    }
    return null;
  }

  findUserById(id) {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  createUser(userData) {
    const id = userData.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const record = {
      ...userData,
      id,
      created_at: now,
      updated_at: now
    };
    this.users.set(id, record);
    return { ...record };
  }

  updateUserStatus(id, isActive) {
    const user = this.users.get(id);
    if (!user) return null;
    user.is_active = Boolean(isActive);
    user.updated_at = new Date().toISOString();
    this.users.set(id, user);
    return { ...user };
  }

  updateUserRole(id, role, primaryBureau, region) {
    const user = this.users.get(id);
    if (!user) return null;
    if (role) user.role = role;
    if (primaryBureau !== undefined) user.primary_bureau = primaryBureau;
    if (region !== undefined) user.region = region;
    user.updated_at = new Date().toISOString();
    this.users.set(id, user);
    return { ...user };
  }

  listUsers({ page = 1, limit = 20, search = '', role = '' } = {}) {
    let list = Array.from(this.users.values());

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    if (role) {
      list = list.filter(u => u.role === role);
    }

    const total = list.length;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit).map(u => {
      const { password_hash, ...safe } = u;
      return safe;
    });

    return { total, items, page, limit };
  }

  // --- Institutions ---
  createInstitution(instData) {
    const id = instData.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const record = {
      ...instData,
      id,
      created_at: now,
      updated_at: now
    };
    this.institutions.set(id, record);
    return { ...record };
  }

  findInstitutionById(id) {
    const inst = this.institutions.get(id);
    return inst ? { ...inst } : null;
  }

  findInstitutionByAicteId(aicteId) {
    if (!aicteId) return null;
    const cleanId = String(aicteId).trim().toLowerCase();
    for (const inst of this.institutions.values()) {
      if (inst.aicte_permanent_id && inst.aicte_permanent_id.toLowerCase() === cleanId) {
        return { ...inst };
      }
    }
    return null;
  }

  findInstitutionByNormalizedName(normName) {
    if (!normName) return null;
    const clean = normName.trim().toLowerCase();
    for (const inst of this.institutions.values()) {
      if (inst.normalized_name && inst.normalized_name.toLowerCase() === clean) {
        return { ...inst };
      }
    }
    return null;
  }

  listInstitutions({ page = 1, limit = 20, search = '', region = '', state = '' } = {}) {
    let list = Array.from(this.institutions.values());

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.aicte_permanent_id && i.aicte_permanent_id.toLowerCase().includes(q)) ||
        i.city.toLowerCase().includes(q)
      );
    }

    if (region) {
      list = list.filter(i => i.region === region);
    }

    if (state) {
      list = list.filter(i => i.state.toLowerCase() === state.toLowerCase());
    }

    const total = list.length;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    return { total, items, page, limit };
  }

  // --- Complaints ---
  createComplaint(complaintData) {
    const id = complaintData.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const record = {
      ...complaintData,
      id,
      created_at: now,
      updated_at: now
    };
    this.complaints.set(id, record);
    return { ...record };
  }

  findComplaintById(id) {
    const cmp = this.complaints.get(id);
    return cmp ? { ...cmp } : null;
  }

  findComplaintByCaseId(caseId) {
    if (!caseId) return null;
    const cleanId = String(caseId).trim().toLowerCase();
    for (const cmp of this.complaints.values()) {
      if (cmp.case_id.toLowerCase() === cleanId) {
        return { ...cmp };
      }
    }
    return null;
  }

  updateComplaint(id, updateFields) {
    const cmp = this.complaints.get(id);
    if (!cmp) return null;
    const updated = {
      ...cmp,
      ...updateFields,
      updated_at: new Date().toISOString()
    };
    this.complaints.set(id, updated);
    return { ...updated };
  }

  listComplaints({ page = 1, limit = 20, bureau = '', status = '', category = '', institutionId = '', search = '' } = {}) {
    let list = Array.from(this.complaints.values());

    if (bureau) {
      list = list.filter(c => c.bureau === bureau);
    }

    if (status) {
      list = list.filter(c => c.status === status);
    }

    if (category) {
      list = list.filter(c => c.category === category);
    }

    if (institutionId) {
      list = list.filter(c => c.institution_id === institutionId);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.case_id.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    // Sort by received_date desc
    list.sort((a, b) => new Date(b.received_date || b.created_at) - new Date(a.received_date || a.created_at));

    const total = list.length;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    return { total, items, page, limit };
  }

  // --- Case Actions ---
  addCaseAction(actionData) {
    const id = actionData.id || crypto.randomUUID();
    const record = {
      ...actionData,
      id,
      performed_at: new Date().toISOString()
    };
    this.caseActions.push(record);
    return { ...record };
  }

  listCaseActions(complaintId) {
    return this.caseActions
      .filter(a => a.complaint_id === complaintId)
      .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at));
  }

  listAllRecentCaseActions(limit = 10) {
    return [...this.caseActions]
      .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))
      .slice(0, limit);
  }


  // --- Tokens ---
  revokeToken(tokenHash, userId, expiresAt) {
    this.revokedTokens.add(tokenHash);
  }

  isTokenRevoked(tokenHash) {
    return this.revokedTokens.has(tokenHash);
  }

  // --- Audit Logs ---
  addAuditLog(entry) {
    const id = crypto.randomUUID();
    const record = {
      id,
      ...entry,
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return record;
  }

  listAuditLogs({ limit = 50, offset = 0, eventType = '' } = {}) {
    let list = this.auditLogs;
    if (eventType) {
      list = list.filter(l => l.event_type === eventType);
    }
    const total = list.length;
    const items = list.slice(offset, offset + limit);
    return { total, items };
  }

  // --- Match Alerts ---
  createOrUpdateMatchAlert(alertData) {
    const existing = Array.from(this.matchAlerts.values()).find(
      a => (a.source_complaint_id === alertData.source_complaint_id && a.candidate_complaint_id === alertData.candidate_complaint_id) ||
        (a.source_complaint_id === alertData.candidate_complaint_id && a.candidate_complaint_id === alertData.source_complaint_id)
    );

    const now = new Date().toISOString();
    if (existing) {
      existing.confidence_score = alertData.confidence_score;
      existing.relationship_classification = alertData.relationship_classification;
      existing.institution_match_type = alertData.institution_match_type;
      existing.rule_flags = alertData.rule_flags;
      existing.evidence_breakdown = alertData.evidence_breakdown;
      existing.explanation = alertData.explanation;
      existing.updated_at = now;
      this.matchAlerts.set(existing.id, existing);
      return { ...existing };
    }

    const id = alertData.id || crypto.randomUUID();
    const record = {
      ...alertData,
      id,
      status: alertData.status || 'PENDING_REVIEW',
      reviewed_by: alertData.reviewed_by || null,
      reviewed_at: alertData.reviewed_at || null,
      decision_reason: alertData.decision_reason || null,
      created_at: now,
      updated_at: now
    };
    this.matchAlerts.set(id, record);
    return { ...record };
  }

  findMatchAlertById(id) {
    const alert = this.matchAlerts.get(id);
    return alert ? { ...alert } : null;
  }

  findMatchAlertsByComplaintId(complaintId) {
    return Array.from(this.matchAlerts.values())
      .filter(a => a.source_complaint_id === complaintId || a.candidate_complaint_id === complaintId)
      .sort((a, b) => b.confidence_score - a.confidence_score);
  }

  listMatchAlerts({ status = '', classification = '', search = '' } = {}) {
    let list = Array.from(this.matchAlerts.values());
    if (status) {
      list = list.filter(a => a.status === status);
    }
    if (classification) {
      list = list.filter(a => a.relationship_classification === classification);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.explanation && a.explanation.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.confidence_score - a.confidence_score);
  }

  updateMatchAlertReview(id, { status, reviewedBy, decisionReason }) {
    const alert = this.matchAlerts.get(id);
    if (!alert) return null;
    alert.status = status;
    alert.reviewed_by = reviewedBy;
    alert.reviewed_at = new Date().toISOString();
    alert.decision_reason = decisionReason || null;
    alert.updated_at = new Date().toISOString();
    this.matchAlerts.set(id, alert);
    return { ...alert };
  }

  // --- Case Links ---
  createCaseLink(linkData) {
    const id = linkData.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const record = {
      ...linkData,
      id,
      created_at: now
    };
    this.caseLinks.set(id, record);
    return { ...record };
  }

  findCaseLinksByComplaintId(complaintId) {
    return Array.from(this.caseLinks.values())
      .filter(l => l.source_complaint_id === complaintId || l.target_complaint_id === complaintId);
  }

  isCaseLinked(id1, id2) {
    return Array.from(this.caseLinks.values()).some(
      l => (l.source_complaint_id === id1 && l.target_complaint_id === id2) ||
        (l.source_complaint_id === id2 && l.target_complaint_id === id1)
    );
  }

  listCaseLinks() {
    return Array.from(this.caseLinks.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // --- Notifications ---
  createNotification(notifData) {
    const id = notifData.id || crypto.randomUUID();
    const record = {
      id,
      user_id: notifData.user_id,
      event_type: notifData.event_type,
      title: notifData.title,
      message: notifData.message,
      complaint_id: notifData.complaint_id || null,
      case_id: notifData.case_id || null,
      read_status: Boolean(notifData.read_status),
      navigation_url: notifData.navigation_url || `/app/complaints/${notifData.complaint_id}`,
      created_at: new Date().toISOString()
    };
    this.notifications.set(id, record);
    return { ...record };
  }

  findNotificationsByUser(userId, { unreadOnly = false, limit = 50 } = {}) {
    let list = Array.from(this.notifications.values()).filter(n => n.user_id === userId);
    if (unreadOnly) {
      list = list.filter(n => !n.read_status);
    }
    return list
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  markNotificationAsRead(id, userId) {
    const notif = this.notifications.get(id);
    if (!notif) return null;
    if (userId && notif.user_id !== userId) return null;
    notif.read_status = true;
    this.notifications.set(id, notif);
    return { ...notif };
  }

  markAllNotificationsAsRead(userId) {
    let updated = 0;
    for (const notif of this.notifications.values()) {
      if (notif.user_id === userId && !notif.read_status) {
        notif.read_status = true;
        this.notifications.set(notif.id, notif);
        updated++;
      }
    }
    return updated;
  }

  countUnreadNotifications(userId) {
    return Array.from(this.notifications.values()).filter(n => n.user_id === userId && !n.read_status).length;
  }

  hasRecentNotification(complaintId, eventType, windowHours = 24) {
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
    return Array.from(this.notifications.values()).some(
      n => n.complaint_id === complaintId && n.event_type === eventType && n.created_at >= cutoff
    );
  }

  // --- Workflow Config ---
  getWorkflowConfig(key, defaultValue = null) {
    return this.workflowConfig.has(key) ? this.workflowConfig.get(key) : defaultValue;
  }

  setWorkflowConfig(key, value) {
    this.workflowConfig.set(key, String(value));
    return { key, value: String(value) };
  }

  getAllWorkflowConfigs() {
    return Object.fromEntries(this.workflowConfig);
  }
}

const memoryStore = new MemoryStore();

module.exports = memoryStore;
