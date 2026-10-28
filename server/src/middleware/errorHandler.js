const config = require('../config/env');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.isPublic ? err.message : (statusCode === 500 ? 'An unexpected server error occurred.' : err.message);

  if (statusCode === 500 && !config.isTest) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details: err.details || null,
      ...(config.isDev ? { stack: err.stack } : {})
    }
  });
}

module.exports = errorHandler;
