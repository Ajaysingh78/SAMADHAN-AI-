const mysql = require('mysql2/promise');
const config = require('../config/env');

let pool = null;
let dbStatus = {
  connected: false,
  lastChecked: null,
  error: null
};

function getPool() {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: config.db.connectionLimit,
        queueLimit: config.db.queueLimit,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });
    } catch (err) {
      dbStatus.connected = false;
      dbStatus.error = err.message;
      dbStatus.lastChecked = new Date().toISOString();
      console.warn(`[DB Pool Warning] Could not initialize pool: ${err.message}`);
    }
  }
  return pool;
}

async function testConnection() {
  const activePool = getPool();
  if (!activePool) {
    dbStatus.connected = false;
    dbStatus.lastChecked = new Date().toISOString();
    return dbStatus;
  }

  try {
    const connection = await activePool.getConnection();
    await connection.ping();
    connection.release();

    dbStatus.connected = true;
    dbStatus.error = null;
    dbStatus.lastChecked = new Date().toISOString();
  } catch (err) {
    dbStatus.connected = false;
    dbStatus.error = err.message;
    dbStatus.lastChecked = new Date().toISOString();
  }

  return dbStatus;
}

function getDbStatus() {
  return dbStatus;
}

module.exports = {
  getPool,
  testConnection,
  getDbStatus
};
