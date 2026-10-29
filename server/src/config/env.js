const path = require('path');
const dotenv = require('dotenv');

// Load .env from root or server directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5174',


  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'samadhan_db',
    connectionLimit: 10,
    queueLimit: 0
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'samadhan_dev_fallback_secret_key_32_chars_min',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },

  sla: {
    warningDays: parseInt(process.env.SLA_WARNING_DAYS, 10) || 20,
    overdueDays: parseInt(process.env.SLA_OVERDUE_DAYS, 10) || 30
  },

  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isTest: process.env.NODE_ENV === 'test'
};

module.exports = config;
