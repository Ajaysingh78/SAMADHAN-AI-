const { getPool, getDbStatus } = require('../connection');
const memoryStore = require('../memoryStore');
const crypto = require('crypto');

let caseCounter = 100;

class ComplaintRepository {
  generateCaseId(bureau = 'RB') {
    caseCounter += 1;
    const year = new Date().getFullYear();
    const prefix = bureau === 'REGULATION_BUREAU' ? 'RB' :
                   bureau === 'PGRC' ? 'PGRC' :
                   bureau === 'APPROVAL_BUREAU' ? 'APP' : 'REG';
    return `CMP-${year}-${prefix}-${String(caseCounter).padStart(4, '0')}`;
  }

  async findAll() {
    const res = await this.list({ limit: 1000 });
    return res.items || [];
  }

  async findById(id) {
    if (!id) return null;
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          `SELECT c.*, i.name as institution_name, i.aicte_permanent_id, i.region as institution_region,
                  u.full_name as assigned_officer_name, creator.full_name as created_by_name
           FROM complaints c
           LEFT JOIN institutions i ON c.institution_id = i.id
           LEFT JOIN users u ON c.assigned_officer_id = u.id
           LEFT JOIN users creator ON c.created_by = creator.id
           WHERE c.id = ? LIMIT 1`,
          [id]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn(`[ComplaintRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    const raw = memoryStore.findComplaintById(id);
    if (!raw) return null;
    const inst = memoryStore.findInstitutionById(raw.institution_id);
    const assignedUser = raw.assigned_officer_id ? memoryStore.findUserById(raw.assigned_officer_id) : null;
    const creatorUser = raw.created_by ? memoryStore.findUserById(raw.created_by) : null;

    return {
      ...raw,
      institution_name: inst ? inst.name : 'Unknown College',
      aicte_permanent_id: inst ? inst.aicte_permanent_id : null,
      institution_region: inst ? inst.region : null,
      assigned_officer_name: assignedUser ? assignedUser.full_name : null,
      created_by_name: creatorUser ? creatorUser.full_name : null
    };
  }

  async findByCaseId(caseId) {
    if (!caseId) return null;
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM complaints WHERE LOWER(case_id) = LOWER(?) LIMIT 1', [caseId.trim()]);
        return rows[0] || null;
      } catch (err) {
        console.warn(`[ComplaintRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findComplaintByCaseId(caseId);
  }

  async create(data) {
    const dbStatus = getDbStatus();
    const id = data.id || crypto.randomUUID();
    const case_id = data.case_id || this.generateCaseId(data.bureau);

    const record = {
      id,
      case_id,
      institution_id: data.institution_id,
      bureau: data.bureau,
      category: data.category,
      severity: data.severity || 'STANDARD',
      complainant_type: data.complainant_type || 'STUDENT',
      subject: data.subject.trim(),
      description: data.description.trim(),
      received_date: data.received_date || new Date().toISOString().split('T')[0],
      status: data.status || 'RECEIVED',
      assigned_officer_id: data.assigned_officer_id || null,
      last_action_date: new Date().toISOString(),
      next_action_due_date: data.next_action_due_date || null,
      expected_disposal_date: data.expected_disposal_date,
      disposed_date: data.status === 'DISPOSED' ? new Date().toISOString() : null,
      created_by: data.created_by
    };

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          `INSERT INTO complaints (id, case_id, institution_id, bureau, category, severity, complainant_type, subject, description, received_date, status, assigned_officer_id, last_action_date, next_action_due_date, expected_disposal_date, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id,
            record.case_id,
            record.institution_id,
            record.bureau,
            record.category,
            record.severity,
            record.complainant_type,
            record.subject,
            record.description,
            record.received_date,
            record.status,
            record.assigned_officer_id,
            record.last_action_date,
            record.next_action_due_date,
            record.expected_disposal_date,
            record.created_by
          ]
        );
        return this.findById(id);
      } catch (err) {
        console.warn(`[ComplaintRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.createComplaint(record);
  }

  async update(id, updateFields) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const keys = Object.keys(updateFields);
        if (keys.length > 0) {
          const setClause = keys.map(k => `${k} = ?`).join(', ');
          const values = keys.map(k => updateFields[k]);
          values.push(id);
          await pool.query(`UPDATE complaints SET ${setClause}, updated_at = NOW() WHERE id = ?`, values);
        }
        return this.findById(id);
      } catch (err) {
        console.warn(`[ComplaintRepo] MySQL update error: ${err.message}`);
      }
    }

    return memoryStore.updateComplaint(id, updateFields);
  }

  async list(filters = {}) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const offset = (page - 1) * limit;

        let query = `
          SELECT c.*, i.name as institution_name, i.aicte_permanent_id, i.region as institution_region,
                 u.full_name as assigned_officer_name
          FROM complaints c
          LEFT JOIN institutions i ON c.institution_id = i.id
          LEFT JOIN users u ON c.assigned_officer_id = u.id
          WHERE 1=1
        `;
        const params = [];

        if (filters.bureau) {
          query += ' AND c.bureau = ?';
          params.push(filters.bureau);
        }

        if (filters.status) {
          query += ' AND c.status = ?';
          params.push(filters.status);
        }

        if (filters.category) {
          query += ' AND c.category = ?';
          params.push(filters.category);
        }

        if (filters.institutionId) {
          query += ' AND c.institution_id = ?';
          params.push(filters.institutionId);
        }

        if (filters.search) {
          query += ' AND (LOWER(c.case_id) LIKE ? OR LOWER(c.subject) LIKE ? OR LOWER(i.name) LIKE ?)';
          const term = `%${filters.search.toLowerCase()}%`;
          params.push(term, term, term);
        }

        query += ' ORDER BY c.received_date DESC, c.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        const [countResult] = await pool.query('SELECT COUNT(*) as count FROM complaints');

        return {
          total: countResult[0].count,
          items: rows,
          page,
          limit
        };
      } catch (err) {
        console.warn(`[ComplaintRepo] MySQL list error, fallback to memory: ${err.message}`);
      }
    }

    const res = memoryStore.listComplaints(filters);
    const enriched = res.items.map(c => {
      const inst = memoryStore.findInstitutionById(c.institution_id);
      const assigned = c.assigned_officer_id ? memoryStore.findUserById(c.assigned_officer_id) : null;
      return {
        ...c,
        institution_name: inst ? inst.name : 'Unknown College',
        aicte_permanent_id: inst ? inst.aicte_permanent_id : null,
        institution_region: inst ? inst.region : null,
        assigned_officer_name: assigned ? assigned.full_name : null
      };
    });

    return {
      total: res.total,
      items: enriched,
      page: res.page,
      limit: res.limit
    };
  }

  async getInstitutionHistory(institutionId) {
    const listRes = await this.list({ institutionId, limit: 100 });
    return listRes.items;
  }
}

module.exports = new ComplaintRepository();
