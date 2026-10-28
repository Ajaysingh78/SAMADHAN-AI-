/**
 * In-Memory Database Store for SAMADHAN
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
}

const memoryStore = new MemoryStore();

module.exports = memoryStore;
