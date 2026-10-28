const { getPool, getDbStatus } = require('../connection');
const memoryStore = require('../memoryStore');
const crypto = require('crypto');

class AuditRepository {
  async logEvent({ userId = null, username = null, eventType, ipAddress = null, details = null }) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const id = crypto.randomUUID();
        await pool.query(
          `INSERT INTO audit_logs (id, user_id, username, event_type, ip_address, details)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, userId, username, eventType, ipAddress, details ? JSON.stringify(details) : null]
        );
        return { id, eventType, createdAt: new Date().toISOString() };
      } catch (err) {
        console.warn(`[AuditRepository] MySQL log error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.addAuditLog({
      user_id: userId,
      username,
      event_type: eventType,
      ip_address: ipAddress,
      details
    });
  }

  async listAuditLogs(options = {}) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const limit = options.limit || 50;
        const offset = options.offset || 0;
        const [rows] = await pool.query(
          'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
          [limit, offset]
        );
        const [countResult] = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
        return {
          total: countResult[0].count,
          items: rows
        };
      } catch (err) {
        console.warn(`[AuditRepository] MySQL list error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.listAuditLogs(options);
  }
}

module.exports = new AuditRepository();
