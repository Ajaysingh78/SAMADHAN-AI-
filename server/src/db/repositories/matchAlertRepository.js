const { getPool, getDbStatus } = require('../connection');
const memoryStore = require('../memoryStore');
const crypto = require('crypto');

class MatchAlertRepository {
  async createOrUpdate(data) {
    const dbStatus = getDbStatus();
    const id = data.id || crypto.randomUUID();

    const record = {
      id,
      source_complaint_id: data.source_complaint_id,
      candidate_complaint_id: data.candidate_complaint_id,
      confidence_score: Number(data.confidence_score),
      relationship_classification: data.relationship_classification,
      institution_match_type: data.institution_match_type,
      rule_flags: Array.isArray(data.rule_flags) ? data.rule_flags : [],
      evidence_breakdown: data.evidence_breakdown || {},
      explanation: data.explanation || '',
      status: data.status || 'PENDING_REVIEW',
      reviewed_by: data.reviewed_by || null,
      reviewed_at: data.reviewed_at || null,
      decision_reason: data.decision_reason || null
    };

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          `INSERT INTO match_alerts (
            id, source_complaint_id, candidate_complaint_id, confidence_score,
            relationship_classification, institution_match_type, rule_flags,
            evidence_breakdown, explanation, status, reviewed_by, reviewed_at, decision_reason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            confidence_score = VALUES(confidence_score),
            relationship_classification = VALUES(relationship_classification),
            institution_match_type = VALUES(institution_match_type),
            rule_flags = VALUES(rule_flags),
            evidence_breakdown = VALUES(evidence_breakdown),
            explanation = VALUES(explanation),
            updated_at = CURRENT_TIMESTAMP`,
          [
            record.id,
            record.source_complaint_id,
            record.candidate_complaint_id,
            record.confidence_score,
            record.relationship_classification,
            record.institution_match_type,
            JSON.stringify(record.rule_flags),
            JSON.stringify(record.evidence_breakdown),
            record.explanation,
            record.status,
            record.reviewed_by,
            record.reviewed_at,
            record.decision_reason
          ]
        );
        return record;
      } catch (err) {
        console.warn(`[MatchAlertRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.createOrUpdateMatchAlert(record);
  }

  async findById(id) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          `SELECT ma.*,
                  u.full_name as reviewer_name,
                  sc.case_id as source_case_id, sc.subject as source_subject, sc.bureau as source_bureau, sc.status as source_status,
                  cc.case_id as candidate_case_id, cc.subject as candidate_subject, cc.bureau as candidate_bureau, cc.status as candidate_status
           FROM match_alerts ma
           LEFT JOIN users u ON ma.reviewed_by = u.id
           LEFT JOIN complaints sc ON ma.source_complaint_id = sc.id
           LEFT JOIN complaints cc ON ma.candidate_complaint_id = cc.id
           WHERE ma.id = ?`,
          [id]
        );
        if (rows.length > 0) {
          const row = rows[0];
          return {
            ...row,
            rule_flags: typeof row.rule_flags === 'string' ? JSON.parse(row.rule_flags) : row.rule_flags,
            evidence_breakdown: typeof row.evidence_breakdown === 'string' ? JSON.parse(row.evidence_breakdown) : row.evidence_breakdown
          };
        }
        return null;
      } catch (err) {
        console.warn(`[MatchAlertRepo] MySQL findById error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findMatchAlertById(id);
  }

  async findByComplaintId(complaintId) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          `SELECT ma.*,
                  sc.case_id as source_case_id, sc.subject as source_subject, sc.bureau as source_bureau, sc.status as source_status,
                  cc.case_id as candidate_case_id, cc.subject as candidate_subject, cc.bureau as candidate_bureau, cc.status as candidate_status
           FROM match_alerts ma
           LEFT JOIN complaints sc ON ma.source_complaint_id = sc.id
           LEFT JOIN complaints cc ON ma.candidate_complaint_id = cc.id
           WHERE ma.source_complaint_id = ? OR ma.candidate_complaint_id = ?
           ORDER BY ma.confidence_score DESC`,
          [complaintId, complaintId]
        );
        return rows.map(r => ({
          ...r,
          rule_flags: typeof r.rule_flags === 'string' ? JSON.parse(r.rule_flags) : r.rule_flags,
          evidence_breakdown: typeof r.evidence_breakdown === 'string' ? JSON.parse(r.evidence_breakdown) : r.evidence_breakdown
        }));
      } catch (err) {
        console.warn(`[MatchAlertRepo] MySQL findByComplaint error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findMatchAlertsByComplaintId(complaintId);
  }

  async findAll({ status = '', classification = '', search = '' } = {}) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        let query = `
          SELECT ma.*,
                 sc.case_id as source_case_id, sc.subject as source_subject, sc.bureau as source_bureau, sc.status as source_status,
                 cc.case_id as candidate_case_id, cc.subject as candidate_subject, cc.bureau as candidate_bureau, cc.status as candidate_status,
                 u.full_name as reviewer_name
          FROM match_alerts ma
          LEFT JOIN complaints sc ON ma.source_complaint_id = sc.id
          LEFT JOIN complaints cc ON ma.candidate_complaint_id = cc.id
          LEFT JOIN users u ON ma.reviewed_by = u.id
          WHERE 1=1
        `;
        const params = [];

        if (status) {
          query += ' AND ma.status = ?';
          params.push(status);
        }
        if (classification) {
          query += ' AND ma.relationship_classification = ?';
          params.push(classification);
        }
        if (search) {
          query += ' AND (ma.explanation LIKE ? OR sc.case_id LIKE ? OR cc.case_id LIKE ?)';
          const term = `%${search}%`;
          params.push(term, term, term);
        }

        query += ' ORDER BY ma.confidence_score DESC, ma.created_at DESC';
        const [rows] = await pool.query(query, params);
        return rows.map(r => ({
          ...r,
          rule_flags: typeof r.rule_flags === 'string' ? JSON.parse(r.rule_flags) : r.rule_flags,
          evidence_breakdown: typeof r.evidence_breakdown === 'string' ? JSON.parse(r.evidence_breakdown) : r.evidence_breakdown
        }));
      } catch (err) {
        console.warn(`[MatchAlertRepo] MySQL findAll error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.listMatchAlerts({ status, classification, search });
  }

  async updateReview(id, { status, reviewedBy, decisionReason }) {
    const dbStatus = getDbStatus();
    const now = new Date().toISOString();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          `UPDATE match_alerts
           SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, decision_reason = ?
           WHERE id = ?`,
          [status, reviewedBy, decisionReason, id]
        );
        return this.findById(id);
      } catch (err) {
        console.warn(`[MatchAlertRepo] MySQL updateReview error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.updateMatchAlertReview(id, { status, reviewedBy, decisionReason });
  }
}

module.exports = new MatchAlertRepository();
