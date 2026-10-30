const express = require('express');
const router = express.Router();
const { getDbStatus, testConnection } = require('../db/connection');
const config = require('../config/env');

const startTime = new Date();

router.get('/health', async (req, res) => {
  // Check live connection on health probe
  const dbStatus = await testConnection();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'samadhanX-api',
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((new Date() - startTime) / 1000),
      database: {
        target: `${config.db.host}:${config.db.port}/${config.db.database}`,
        connected: dbStatus.connected,
        lastChecked: dbStatus.lastChecked,
        error: dbStatus.error || null
      },
      features: {
        authEnforcedInPhase2: true,
        complaintsInPhase3: true,
        caseIntelligenceInPhase4: true
      }
    }
  });
});

module.exports = router;
