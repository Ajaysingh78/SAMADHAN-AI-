/**
 * Sliding Window In-Memory Rate Limiter for Authentication Attempts
 */

class RateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxAttempts = 5) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
    this.attempts = new Map();
  }

  getKey(req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const username = (req.body && req.body.username) ? req.body.username.toLowerCase().trim() : '';
    return `${ip}:${username}`;
  }

  isRateLimited(key) {
    const now = Date.now();
    const records = this.attempts.get(key) || [];
    // Keep only timestamps within the sliding window
    const validRecords = records.filter(timestamp => now - timestamp < this.windowMs);
    this.attempts.set(key, validRecords);

    return validRecords.length >= this.maxAttempts;
  }

  recordFailedAttempt(key) {
    const now = Date.now();
    const records = this.attempts.get(key) || [];
    records.push(now);
    this.attempts.set(key, records);
  }

  resetAttempts(key) {
    this.attempts.delete(key);
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      if (this.isRateLimited(key)) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
            details: null
          }
        });
      }
      req.rateLimitKey = key;
      next();
    };
  }
}

const loginRateLimiter = new RateLimiter(15 * 60 * 1000, 5);

module.exports = {
  RateLimiter,
  loginRateLimiter
};
