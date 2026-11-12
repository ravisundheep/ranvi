const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const parseOriginList = (raw) =>
  (raw || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

const DEFAULT_JWT_ACCESS_SECRET = 'ranvi_access_secret_key_default_2026';
const DEFAULT_JWT_REFRESH_SECRET = 'ranvi_refresh_secret_key_default_2026';

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ranvi_institutions',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  ALLOWED_ORIGINS: Array.from(
    new Set([
      ...parseOriginList(process.env.CLIENT_ORIGIN || 'http://localhost:5173'),
      ...parseOriginList(process.env.ADDITIONAL_CORS_ORIGINS || ''),
    ])
  ),
  ALLOW_VERCEL_PREVIEWS: process.env.ALLOW_VERCEL_PREVIEWS === 'true',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || DEFAULT_JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || DEFAULT_JWT_REFRESH_SECRET,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_sample',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER || 'admissions@ranviinstitutions.com',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: (process.env.SMTP_USER || '').trim(),
  SMTP_PASS: (process.env.SMTP_PASS || '').trim(),
  INITIAL_ADMIN_EMAIL: process.env.INITIAL_ADMIN_EMAIL || 'admin@ranviinstitutions.com',
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD || 'RanviAdmin@2026!',
};

const validateProductionEnv = () => {
  if (env.NODE_ENV !== 'production') return;

  const errors = [];
  if (!env.JWT_ACCESS_SECRET || env.JWT_ACCESS_SECRET === DEFAULT_JWT_ACCESS_SECRET || env.JWT_ACCESS_SECRET.length < 32) {
    errors.push('JWT_ACCESS_SECRET must be set to a strong >= 32-character secret in production.');
  }
  if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET === DEFAULT_JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be set to a strong >= 32-character secret in production.');
  }
  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI is required in production.');
  }
  if (env.ALLOWED_ORIGINS.length === 0) {
    errors.push('CLIENT_ORIGIN must be explicitly configured in production.');
  }

  if (errors.length > 0) {
    throw new Error(`[Production Env Validation Failed]\n- ${errors.join('\n- ')}`);
  }
};

env.validateProductionEnv = validateProductionEnv;

module.exports = env;
