const { verifyToken, hashToken, ROLES } = require('../utils/security');
const userRepository = require('../db/repositories/userRepository');
const tokenRepository = require('../db/repositories/tokenRepository');
const auditRepository = require('../db/repositories/auditRepository');

/**
 * Authentication Middleware: Validates Bearer JWT, token revocation, and user status
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication token is required to access this resource.',
        details: null
      }
    });
  }

  const token = authHeader.split(' ')[1].trim();

  try {
    // 1. Verify cryptographic signature and expiry
    const decoded = verifyToken(token);

    // 2. Check if token was explicitly revoked on logout
    const tokenHash = hashToken(token);
    const isRevoked = await tokenRepository.isTokenRevoked(tokenHash);
    if (isRevoked) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'This session has been terminated. Please sign in again.',
          details: null
        }
      });
    }

    // 3. Verify user account exists and is active
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The account associated with this session no longer exists.',
          details: null
        }
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'This account has been deactivated. Please contact the AICTE Administrator.',
          details: null
        }
      });
    }

    // Attach user and raw token to request
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Session expired. Please sign in again.',
          details: null
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or malformed authentication token.',
        details: null
      }
    });
  }
}

/**
 * Role-Based Authorization Guard
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required.',
          details: null
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Audit unauthorized role attempt
      auditRepository.logEvent({
        userId: req.user.id,
        username: req.user.username,
        eventType: 'UNAUTHORIZED_ROLE_ACCESS_DENIED',
        ipAddress: req.ip,
        details: {
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          path: req.originalUrl
        }
      }).catch(() => {});

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: 'Your role does not have authorization to perform this operation.',
          details: {
            requiredRoles: allowedRoles,
            currentRole: req.user.role
          }
        }
      });
    }

    next();
  };
}

/**
 * Bureau Scope Guard: Restricts Bureau Officers strictly to their assigned bureau.
 * Admins and Senior Officials retain overarching jurisdiction.
 */
function requireBureauScope(bureauParamKey = 'bureau') {
  return (req, res, next) => {
    const targetBureau = req.params[bureauParamKey] || req.body[bureauParamKey] || req.query[bureauParamKey];

    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
    }

    // Admins and Senior Officials have oversight over all bureaus
    if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SENIOR_OFFICIAL) {
      return next();
    }

    // Bureau officers must match their assigned bureau
    if (req.user.role === ROLES.BUREAU_OFFICER) {
      if (!targetBureau || req.user.primary_bureau !== targetBureau) {
        auditRepository.logEvent({
          userId: req.user.id,
          username: req.user.username,
          eventType: 'CROSS_BUREAU_ACCESS_DENIED',
          ipAddress: req.ip,
          details: {
            assignedBureau: req.user.primary_bureau,
            targetBureau,
            path: req.originalUrl
          }
        }).catch(() => {});

        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN_BUREAU_SCOPE',
            message: `Jurisdiction restricted: You are only authorized for ${req.user.primary_bureau} cases.`,
            details: {
              assignedBureau: req.user.primary_bureau,
              attemptedBureau: targetBureau
            }
          }
        });
      }
    }

    next();
  };
}

/**
 * Region Scope Guard: Restricts Regional Officers strictly to their assigned region.
 */
function requireRegionScope(regionParamKey = 'region') {
  return (req, res, next) => {
    const targetRegion = req.params[regionParamKey] || req.body[regionParamKey] || req.query[regionParamKey];

    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
    }

    if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SENIOR_OFFICIAL || req.user.region === 'ALL') {
      return next();
    }

    if (req.user.role === ROLES.REGIONAL_OFFICER) {
      if (!targetRegion || req.user.region !== targetRegion) {
        auditRepository.logEvent({
          userId: req.user.id,
          username: req.user.username,
          eventType: 'CROSS_REGION_ACCESS_DENIED',
          ipAddress: req.ip,
          details: {
            assignedRegion: req.user.region,
            targetRegion,
            path: req.originalUrl
          }
        }).catch(() => {});

        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN_REGION_SCOPE',
            message: `Regional jurisdiction restricted: Authorized solely for ${req.user.region} region records.`,
            details: {
              assignedRegion: req.user.region,
              attemptedRegion: targetRegion
            }
          }
        });
      }
    }

    next();
  };
}

/**
 * Admin Role Guard
 */
const requireAdmin = requireRoles(ROLES.ADMIN);

module.exports = {
  authenticate,
  requireRoles,
  requireBureauScope,
  requireRegionScope,
  requireAdmin
};
