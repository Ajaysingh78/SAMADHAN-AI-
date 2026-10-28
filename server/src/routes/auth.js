const express = require('express');
const router = express.Router();
const { comparePassword, generateToken, hashToken } = require('../utils/security');
const { loginRateLimiter } = require('../utils/rateLimiter');
const { authenticate } = require('../middleware/authMiddleware');
const userRepository = require('../db/repositories/userRepository');
const tokenRepository = require('../db/repositories/tokenRepository');
const auditRepository = require('../db/repositories/auditRepository');

/**
 * POST /api/v1/auth/login
 * Validates credentials, checks rate limits, issues JWT, logs security audit
 */
router.post('/login', loginRateLimiter.middleware(), async (req, res) => {
  const { username, password } = req.body || {};

  // Input validation
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Username and password are required fields.',
        details: null
      }
    });
  }

  const cleanUsername = username.trim();

  // Find user
  const user = await userRepository.findByUsername(cleanUsername);

  // Constant-time-like generic response to prevent username enumeration
  if (!user) {
    loginRateLimiter.recordFailedAttempt(req.rateLimitKey);
    await auditRepository.logEvent({
      username: cleanUsername,
      eventType: 'AUTH_LOGIN_FAILED_UNKNOWN_USER',
      ipAddress: req.ip,
      details: { attemptedUsername: cleanUsername }
    });

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password.',
        details: null
      }
    });
  }

  // Check if account is disabled
  if (!user.is_active) {
    loginRateLimiter.recordFailedAttempt(req.rateLimitKey);
    await auditRepository.logEvent({
      userId: user.id,
      username: user.username,
      eventType: 'AUTH_LOGIN_FAILED_ACCOUNT_DISABLED',
      ipAddress: req.ip,
      details: { role: user.role }
    });

    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_DISABLED',
        message: 'This account has been deactivated. Please contact the AICTE Administrator.',
        details: null
      }
    });
  }

  // Verify bcrypt password hash
  const isValidPassword = await comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    loginRateLimiter.recordFailedAttempt(req.rateLimitKey);
    await auditRepository.logEvent({
      userId: user.id,
      username: user.username,
      eventType: 'AUTH_LOGIN_FAILED_BAD_PASSWORD',
      ipAddress: req.ip,
      details: { role: user.role }
    });

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password.',
        details: null
      }
    });
  }

  // Reset failed login attempts on success
  loginRateLimiter.resetAttempts(req.rateLimitKey);

  // Generate JWT token with user claims
  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    primaryBureau: user.primary_bureau,
    region: user.region
  };

  const token = generateToken(tokenPayload);

  // Record login audit event
  await auditRepository.logEvent({
    userId: user.id,
    username: user.username,
    eventType: 'AUTH_LOGIN_SUCCESS',
    ipAddress: req.ip,
    details: { role: user.role, bureau: user.primary_bureau }
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        primaryBureau: user.primary_bureau,
        region: user.region
      }
    }
  });
});

/**
 * GET /api/v1/auth/me
 * Retrieves active session profile for authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.full_name,
        role: req.user.role,
        primaryBureau: req.user.primary_bureau,
        region: req.user.region,
        createdAt: req.user.created_at
      }
    }
  });
});

/**
 * POST /api/v1/auth/logout
 * Explicitly revokes active token on backend and logs security event
 */
router.post('/logout', authenticate, async (req, res) => {
  const tokenHash = hashToken(req.token);
  const expiresAt = req.tokenPayload.exp || Math.floor(Date.now() / 1000) + 28800;

  await tokenRepository.revokeToken(tokenHash, req.user.id, expiresAt);

  await auditRepository.logEvent({
    userId: req.user.id,
    username: req.user.username,
    eventType: 'AUTH_LOGOUT',
    ipAddress: req.ip,
    details: { role: req.user.role }
  });

  return res.json({
    success: true,
    data: {
      message: 'Successfully logged out. Session has been revoked.'
    }
  });
});

module.exports = router;
