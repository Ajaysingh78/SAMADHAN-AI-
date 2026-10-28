const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const institutionsRoutes = require('./routes/institutions');
const complaintsRoutes = require('./routes/complaints');
const scopedCasesRoutes = require('./routes/scopedCases');
const intelligenceRoutes = require('./routes/caseIntelligence');
const workflowRoutes = require('./routes/workflow');
const reportsRoutes = require('./routes/reports');
const { seedDevelopmentUsers } = require('./db/seeds/001_seed_dev_users');
const { seedInstitutionsAndComplaints } = require('./db/seeds/002_seed_dev_institutions_and_complaints');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

// Initialize development seed users and data if in development or test environment
if (config.env !== 'production') {
  seedDevelopmentUsers()
    .then(() => seedInstitutionsAndComplaints())
    .catch(err => {
      console.warn(`[Seed Warning] Could not complete seed initialization: ${err.message}`);
    });
}

// Security and standard middlewares
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Primary API v1 route mounting
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/institutions', institutionsRoutes);
app.use('/api/v1/complaints', complaintsRoutes);
app.use('/api/v1/cases', scopedCasesRoutes);
app.use('/api/v1/intelligence', intelligenceRoutes);
app.use('/api/v1/workflow', workflowRoutes);
app.use('/api/v1/reports', reportsRoutes);


// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'SAMADHAN Case Intelligence Platform API',
    version: '1.0.0',
    documentation: '/docs/API_CONTRACT.md',
    healthEndpoint: '/api/v1/health'
  });
});

// Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
