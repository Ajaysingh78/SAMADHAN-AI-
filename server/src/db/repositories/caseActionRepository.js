const { getPool, getDbStatus } = require('../connection');
const memoryStore = require('../memoryStore');
const crypto = require('crypto');

class CaseActionRepository {
  async create(data) {
    const dbStatus = getDbStatus();
    const id = data.id || crypto.randomUUID();

    const record = {
      id,
      complaint_id: data.complaint_id,
      action_type: data.action_type,
      previous_status: data.previous_status || null,
      new_status: data.new_status || null,
      remarks: data.remarks ? data.remarks.trim() : '',
      document_reference: data.document_reference || null,
      performed_by: data.performed_by,
      performed_at: new Date().toISOString()
    };

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          `INSERT INTO case_actions (id, complaint_id, action_type, previous_status, new_status, remarks, document_reference, performed_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id,
            record.complaint_id,
            record.action_type,
            record.previous_status,
            record.new_status,
            record.remarks,
            record.document_reference,
            record.performed_by
          ]
        );
        return record;
      } catch (err) {
        console.warn(`[CaseActionRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.addCaseAction(record);
  }

  async listByComplaintId(complaintId) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          `SELECT a.*, u.full_name as performed_by_name, u.role as performed_by_role
           FROM case_actions a
           LEFT JOIN users u ON a.performed_by = u.id
           WHERE a.complaint_id = ?
           ORDER BY a.performed_at DESC`,
          [complaintId]
        );
        return rows;
      } catch (err) {
        console.warn(`[CaseActionRepo] MySQL list error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.listCaseActions(complaintId);
  }
}

module.exports = new CaseActionRepository();
