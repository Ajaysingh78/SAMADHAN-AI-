const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { hashPassword, ROLES } = require('../utils/security');
const userRepository = require('../db/repositories/userRepository');
const auditRepository = require('../db/repositories/auditRepository');

// All admin endpoints require authentication and ADMIN role
router.use(authenticate, requireAdmin);

/**
 * GET /api/v1/admin/users
 * Lists user accounts with search and pagination
 */
router.get('/users', async (req, res) => {
  const { page, limit, search, role } = req.query;
  const result = await userRepository.listUsers({
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
    search: search || '',
    role: role || ''
  });

  return res.json({
    success: true,
    data: result.items,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total
    }
  });
});

/**
 * POST /api/v1/admin/users
 * Securely provisions a new officer or official account
 */
router.post('/users', async (req, res) => {
  const { username, email, password, fullName, role, primaryBureau, region } = req.body || {};

  if (!username || !email || !password || !fullName || !role) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Username, email, password, full name, and role are required.',
        details: null
      }
    });
  }

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: `Role must be one of: ${Object.values(ROLES).join(', ')}`,
        details: null
      }
    });
  }

  // Check uniqueness
  const existing = await userRepository.findByUsername(username.trim());
  if (existing) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'USERNAME_EXISTS',
        message: `Username '${username}' is already in use.`,
        details: null
      }
    });
  }

  const password_hash = await hashPassword(password);
  const newUser = await userRepository.create({
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password_hash,
    full_name: fullName.trim(),
    role,
    primary_bureau: primaryBureau || null,
    region: region || 'ALL',
    is_active: true
  });

  await auditRepository.logEvent({
    userId: req.user.id,
    username: req.user.username,
    eventType: 'ADMIN_USER_CREATED',
    ipAddress: req.ip,
    details: { createdUserId: newUser.id, username: newUser.username, role: newUser.role }
  });

  const { password_hash: _, ...safeUser } = newUser;

  return res.status(201).json({
    success: true,
    data: safeUser
  });
});

/**
 * PATCH /api/v1/admin/users/:id/status
 * Enables or disables an officer account
 */
router.patch('/users/:id/status', async (req, res) => {
  const { isActive } = req.body;
  const targetId = req.params.id;

  if (isActive === undefined) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'isActive boolean is required.' }
    });
  }

  // Prevent self-lockout
  if (targetId === req.user.id && !isActive) {
    return res.status(400).json({
      success: false,
      error: { code: 'SELF_DISABLE_PROHIBITED', message: 'Administrators cannot deactivate their own active account.' }
    });
  }

  const updated = await userRepository.updateStatus(targetId, isActive);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User account not found.' }
    });
  }

  await auditRepository.logEvent({
    userId: req.user.id,
    username: req.user.username,
    eventType: isActive ? 'ADMIN_USER_ACTIVATED' : 'ADMIN_USER_DEACTIVATED',
    ipAddress: req.ip,
    details: { targetUserId: targetId, newStatus: isActive }
  });

  const { password_hash: _, ...safeUser } = updated;
  return res.json({ success: true, data: safeUser });
});

/**
 * GET /api/v1/admin/audit-logs
 * Retrieves security and administrative audit history
 */
router.get('/audit-logs', async (req, res) => {
  const { limit, offset, eventType } = req.query;
  const result = await auditRepository.listAuditLogs({
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    eventType: eventType || ''
  });

  return res.json({
    success: true,
    data: result.items,
    meta: {
      total: result.total
    }
  });
});

module.exports = router;
