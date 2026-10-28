const { getPool, getDbStatus } = require('../connection');
const memoryStore = require('../memoryStore');
const crypto = require('crypto');

class CaseLinkRepository {
  async createLink(data) {
    const dbStatus = getDbStatus();
    const id = data.id || crypto.randomUUID();

    const record = {
      id,
      source_complaint_id: data.source_complaint_id,
      target_complaint_id: data.target_complaint_id,
      match_alert_id: data.match_alert_id || null,
      link_type: data.link_type || 'CROSS_BUREAU_COORDINATION',
      link_reason: data.link_reason.trim(),
      created_by: data.created_by,
      created_at: new Date().toISOString()
    };

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          `INSERT INTO case_links (
            id, source_complaint_id, target_complaint_id, match_alert_id, link_type, link_reason, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id,
            record.source_complaint_id,
            record.target_complaint_id,
            record.match_alert_id,
            record.link_type,
            record.link_reason,
            record.created_by
          ]
        );
        return record;
      } catch (err) {
        console.warn(`[CaseLinkRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.createCaseLink(record);
  }

  async isLinked(id1, id2) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          `SELECT id FROM case_links
           WHERE (source_complaint_id = ? AND target_complaint_id = ?)
              OR (source_complaint_id = ? AND target_complaint_id = ?)
           LIMIT 1`,
          [id1, id2, id2, id1]
        );
        return rows.length > 0;
      } catch (err) {
        console.warn(`[CaseLinkRepo] MySQL isLinked error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.isCaseLinked(id1, id2);
  }

  async findByComplaintId(complaintId) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          `SELECT cl.*,
                  u.full_name as created_by_name,
                  sc.case_id as source_case_id, sc.subject as source_subject, sc.bureau as source_bureau, sc.status as source_status,
                  tc.case_id as target_case_id, tc.subject as target_subject, tc.bureau as target_bureau, tc.status as target_status
           FROM case_links cl
           LEFT JOIN users u ON cl.created_by = u.id
           LEFT JOIN complaints sc ON cl.source_complaint_id = sc.id
           LEFT JOIN complaints tc ON cl.target_complaint_id = tc.id
           WHERE cl.source_complaint_id = ? OR cl.target_complaint_id = ?
           ORDER BY cl.created_at DESC`,
          [complaintId, complaintId]
        );
        return rows;
      } catch (err) {
        console.warn(`[CaseLinkRepo] MySQL findByComplaintId error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findCaseLinksByComplaintId(complaintId);
  }

  async findAll() {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          `SELECT cl.*,
                  u.full_name as created_by_name,
                  sc.case_id as source_case_id, sc.subject as source_subject, sc.bureau as source_bureau, sc.status as source_status,
                  tc.case_id as target_case_id, tc.subject as target_subject, tc.bureau as target_bureau, tc.status as target_status
           FROM case_links cl
           LEFT JOIN users u ON cl.created_by = u.id
           LEFT JOIN complaints sc ON cl.source_complaint_id = sc.id
           LEFT JOIN complaints tc ON cl.target_complaint_id = tc.id
           ORDER BY cl.created_at DESC`
        );
        return rows;
      } catch (err) {
        console.warn(`[CaseLinkRepo] MySQL findAll error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.listCaseLinks();
  }
}

module.exports = new CaseLinkRepository();
