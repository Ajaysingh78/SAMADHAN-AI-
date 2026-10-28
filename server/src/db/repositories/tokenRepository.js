const { getPool, getDbStatus } = require('../connection');
const memoryStore = require('../memoryStore');
const crypto = require('crypto');

class TokenRepository {
  async revokeToken(tokenHash, userId, expiresAt) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const id = crypto.randomUUID();
        await pool.query(
          'INSERT INTO revoked_tokens (id, token_hash, user_id, expires_at) VALUES (?, ?, ?, ?)',
          [id, tokenHash, userId, new Date(expiresAt * 1000)]
        );
        return true;
      } catch (err) {
        console.warn(`[TokenRepository] MySQL insert error, fallback to memory: ${err.message}`);
      }
    }

    memoryStore.revokeToken(tokenHash, userId, expiresAt);
    return true;
  }

  async isTokenRevoked(tokenHash) {
    const dbStatus = getDbStatus();

    if (dbStatus.connected) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          'SELECT id FROM revoked_tokens WHERE token_hash = ? LIMIT 1',
          [tokenHash]
        );
        return rows.length > 0;
      } catch (err) {
        console.warn(`[TokenRepository] MySQL query error, fallback to memory: ${err.message}`);
      }
    }

    return memoryStore.isTokenRevoked(tokenHash);
  }
}

module.exports = new TokenRepository();
