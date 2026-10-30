/**
 * AICTE Samadhan Chatbot & Assistant Routes
 * Endpoint: POST /api/v1/chatbot/query
 * Supports both Public Citizens (unauthenticated) and AICTE Officers (authenticated via Bearer JWT)
 */

const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbotService');
const { verifyToken, hashToken } = require('../utils/security');
const tokenRepository = require('../db/repositories/tokenRepository');
const userRepository = require('../db/repositories/userRepository');

/**
 * Optional Authentication Middleware
 * Populates req.user if valid token provided; does not reject request if unauthenticated.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  req.user = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1].trim();
    try {
      const decoded = verifyToken(token);
      const isRevoked = await tokenRepository.isTokenRevoked(hashToken(token));
      if (!isRevoked && decoded?.id) {
        const user = await userRepository.findById(decoded.id);
        if (user && user.is_active) {
          req.user = user;
        }
      }
    } catch {
      // Token expired or invalid; fallback to public mode cleanly
      req.user = null;
    }
  }

  next();
}

/**
 * POST /api/v1/chatbot/query
 * Processes natural language questions and commands
 */
router.post('/query', optionalAuth, async (req, res, next) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Message content is required.'
        }
      });
    }

    const result = await chatbotService.processQuery({
      message: message.trim(),
      user: req.user,
      history: Array.isArray(history) ? history : []
    });

    return res.json({
      success: true,
      data: {
        ...result,
        userMode: req.user ? 'OFFICER' : 'CITIZEN'
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
