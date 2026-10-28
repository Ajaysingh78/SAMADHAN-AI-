const { getPool, getDbStatus } = require('../connection');
const memoryStore = require('../memoryStore');

class UserRepository {
  async findByUsername(username) {
    if (!username) return null;
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          'SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
          [username]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn(`[UserRepository] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findUserByUsername(username);
  }

  async findById(id) {
    if (!id) return null;
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          'SELECT * FROM users WHERE id = ? LIMIT 1',
          [id]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn(`[UserRepository] MySQL error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.findUserById(id);
  }

  async create(userData) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const id = userData.id || require('crypto').randomUUID();
        await pool.query(
          `INSERT INTO users (id, username, email, password_hash, full_name, role, primary_bureau, region, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            userData.username,
            userData.email,
            userData.password_hash,
            userData.full_name,
            userData.role,
            userData.primary_bureau || null,
            userData.region || 'ALL',
            userData.is_active !== undefined ? userData.is_active : true
          ]
        );
        return this.findById(id);
      } catch (err) {
        console.warn(`[UserRepository] MySQL create error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.createUser(userData);
  }

  async updateStatus(id, isActive) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
          [Boolean(isActive), id]
        );
        return this.findById(id);
      } catch (err) {
        console.warn(`[UserRepository] MySQL update error: ${err.message}`);
      }
    }

    return memoryStore.updateUserStatus(id, isActive);
  }

  async updateRole(id, role, primaryBureau, region) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        await pool.query(
          'UPDATE users SET role = ?, primary_bureau = ?, region = ?, updated_at = NOW() WHERE id = ?',
          [role, primaryBureau || null, region || 'ALL', id]
        );
        return this.findById(id);
      } catch (err) {
        console.warn(`[UserRepository] MySQL update error: ${err.message}`);
      }
    }

    return memoryStore.updateUserRole(id, role, primaryBureau, region);
  }

  async listUsers(options) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
          'SELECT id, username, email, full_name, role, primary_bureau, region, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
          [limit, offset]
        );
        const [countResult] = await pool.query('SELECT COUNT(*) as count FROM users');

        return {
          total: countResult[0].count,
          items: rows,
          page,
          limit
        };
      } catch (err) {
        console.warn(`[UserRepository] MySQL list error: ${err.message}`);
      }
    }

    return memoryStore.listUsers(options);
  }
}

module.exports = new UserRepository();
