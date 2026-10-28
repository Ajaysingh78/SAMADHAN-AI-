const express = require('express');
const router = express.Router();
const { authenticate, requireRoles, requireBureauScope, requireRegionScope } = require('../middleware/authMiddleware');
const { ROLES, BUREAUS } = require('../utils/security');

// Regulation Bureau Scoped Route
router.get(
  '/rb-scoped',
  authenticate,
  (req, res, next) => {
    req.params.bureau = BUREAUS.REGULATION_BUREAU;
    next();
  },
  requireBureauScope('bureau'),
  (req, res) => {
    res.json({
      success: true,
      data: {
        bureau: BUREAUS.REGULATION_BUREAU,
        message: 'Access granted to Regulation Bureau regulatory filings and show-cause records.'
      }
    });
  }
);

// PGRC Scoped Route
router.get(
  '/pgrc-scoped',
  authenticate,
  (req, res, next) => {
    req.params.bureau = BUREAUS.PGRC;
    next();
  },
  requireBureauScope('bureau'),
  (req, res) => {
    res.json({
      success: true,
      data: {
        bureau: BUREAUS.PGRC,
        message: 'Access granted to Public Grievance Redressal Cell student/faculty petitions.'
      }
    });
  }
);

// Regional Scoped Route
router.get(
  '/regional-scoped',
  authenticate,
  (req, res, next) => {
    req.params.region = 'NORTHERN';
    next();
  },
  requireRegionScope('region'),
  (req, res) => {
    res.json({
      success: true,
      data: {
        region: 'NORTHERN',
        message: 'Access granted to Northern Regional Office inspection cases.'
      }
    });
  }
);

// Executive Oversight Route: Restricted to Senior Officials and Admins
router.get(
  '/oversight',
  authenticate,
  requireRoles(ROLES.SENIOR_OFFICIAL, ROLES.ADMIN),
  (req, res) => {
    res.json({
      success: true,
      data: {
        accessLevel: 'CROSS_BUREAU_OVERSIGHT',
        message: 'Cross-bureau executive oversight data accessible.'
      }
    });
  }
);

module.exports = router;
