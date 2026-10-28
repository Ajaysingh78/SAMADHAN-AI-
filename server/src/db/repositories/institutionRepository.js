const { getPool, getDbStatus } = require('../connection');
const memoryStore = require('../memoryStore');
const crypto = require('crypto');

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

class InstitutionRepository {
  normalizeInstitutionName(name) {
    return normalizeName(name);
  }

  async findById(id) {
    if (!id) return null;
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM institutions WHERE id = ? LIMIT 1', [id]);
        return rows[0] || null;
      } catch (err) {
        console.warn(`[InstitutionRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findInstitutionById(id);
  }

  async findByAicteId(aicteId) {
    if (!aicteId) return null;
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM institutions WHERE LOWER(aicte_permanent_id) = LOWER(?) LIMIT 1', [aicteId.trim()]);
        return rows[0] || null;
      } catch (err) {
        console.warn(`[InstitutionRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findInstitutionByAicteId(aicteId);
  }

  async findByNormalizedName(normName) {
    if (!normName) return null;
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query('SELECT * FROM institutions WHERE LOWER(normalized_name) = LOWER(?) LIMIT 1', [normName.trim()]);
        return rows[0] || null;
      } catch (err) {
        console.warn(`[InstitutionRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findInstitutionByNormalizedName(normName);
  }

  async create(data) {
    const dbStatus = getDbStatus();
    const id = data.id || crypto.randomUUID();
    const normalized_name = data.normalized_name || normalizeName(data.name);

    const record = {
      id,
      aicte_permanent_id: data.aicte_permanent_id ? data.aicte_permanent_id.trim() : null,
      name: data.name.trim(),
      normalized_name,
      address: data.address.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      region: data.region ? data.region.trim() : 'NORTHERN',
      pin_code: data.pin_code ? String(data.pin_code).trim() : '000000',
      approval_status: data.approval_status || 'APPROVED',
      identity_flag: data.identity_flag || 'VERIFIED'
    };

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          `INSERT INTO institutions (id, aicte_permanent_id, name, normalized_name, address, city, state, region, pin_code, approval_status, identity_flag)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id,
            record.aicte_permanent_id,
            record.name,
            record.normalized_name,
            record.address,
            record.city,
            record.state,
            record.region,
            record.pin_code,
            record.approval_status,
            record.identity_flag
          ]
        );
        return this.findById(id);
      } catch (err) {
        console.warn(`[InstitutionRepo] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.createInstitution(record);
  }

  async list(options = {}) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const page = options.page || 1;
        const limit = options.limit || 20;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM institutions WHERE 1=1';
        const params = [];

        if (options.search) {
          query += ' AND (LOWER(name) LIKE ? OR LOWER(aicte_permanent_id) LIKE ? OR LOWER(city) LIKE ?)';
          const term = `%${options.search.toLowerCase()}%`;
          params.push(term, term, term);
        }

        if (options.region) {
          query += ' AND region = ?';
          params.push(options.region);
        }

        if (options.state) {
          query += ' AND state = ?';
          params.push(options.state);
        }

        query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        const [countResult] = await pool.query('SELECT COUNT(*) as count FROM institutions');

        return {
          total: countResult[0].count,
          items: rows,
          page,
          limit
        };
      } catch (err) {
        console.warn(`[InstitutionRepo] MySQL list error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.listInstitutions(options);
  }
}

module.exports = new InstitutionRepository();
