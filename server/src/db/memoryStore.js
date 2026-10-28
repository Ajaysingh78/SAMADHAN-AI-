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
    // Keep max 500 in memory
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
