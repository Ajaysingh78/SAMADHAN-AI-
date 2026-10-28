const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

const BCRYPT_ROUNDS = 10;

/**
 * Hash a plaintext password
 */
async function hashPassword(plainText) {
  if (!plainText || typeof plainText !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

/**
 * Compare plaintext with hashed password
 */
async function comparePassword(plainText, hash) {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}

/**
 * Generate a signed JWT token
 */
function generateToken(payload, expiresIn = config.jwt.expiresIn) {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, config.jwt.secret, {
    expiresIn,
    issuer: 'samadhan-platform'
  });
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'samadhan-platform'
  });
}

/**
 * Hash token with SHA-256 for safe database revocation indexing
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Predefined System Roles & Permissions
 */
const ROLES = {
  ADMIN: 'ADMIN',
  BUREAU_OFFICER: 'BUREAU_OFFICER',
  REGIONAL_OFFICER: 'REGIONAL_OFFICER',
  SENIOR_OFFICIAL: 'SENIOR_OFFICIAL'
};

const BUREAUS = {
  REGULATION_BUREAU: 'REGULATION_BUREAU',
  PGRC: 'PGRC',
  APPROVAL_BUREAU: 'APPROVAL_BUREAU',
  REGIONAL_OFFICE: 'REGIONAL_OFFICE'
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  hashToken,
  ROLES,
  BUREAUS
};
