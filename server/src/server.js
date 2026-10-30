const app = require('./app');
const config = require('./config/env');
const { testConnection } = require('./db/connection');

async function startServer() {
  // Test DB connection on startup (non-fatal if offline during local scaffolding)
  try {
    const dbStatus = await testConnection();
    if (dbStatus.connected) {
      console.log(`[Database] Connected successfully to MySQL (${config.db.host}:${config.db.port}/${config.db.database})`);
    } else {
      console.warn(`[Database] MySQL not reachable: ${dbStatus.error || 'Check local credentials in .env'}`);
    }
  } catch (err) {
    console.warn(`[Database] Initial check warning: ${err.message}`);
  }

  const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(` samadhanX Backend API running on port ${config.port}`);
    console.log(` Environment : ${config.env}`);
    console.log(` Healthcheck : http://localhost:${config.port}/api/v1/health`);
    console.log(` Allowed CORS: ${config.clientUrl}`);
    console.log(`====================================================`);
  });

  const shutdown = () => {
    console.log('Shutting down samadhanX API gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
