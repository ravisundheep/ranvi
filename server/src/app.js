const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { protectMediaUpload } = require('./middleware/protectedMedia');
const { sanitizeInput } = require('./middleware/sanitizeInput');

const app = express();

// CORS Configuration (strict in production)
const allowedOrigins = Array.from(
  new Set([
    ...(env.ALLOWED_ORIGINS || []),
    ...(env.NODE_ENV !== 'production'
      ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
      : []),
  ])
);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'sameorigin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'blob:', 'https:'],
      frameAncestors: ["'self'", ...allowedOrigins],
      objectSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    const isAllowed =
      allowedOrigins.includes(cleanOrigin) ||
      (env.ALLOW_VERCEL_PREVIEWS && cleanOrigin.endsWith('.vercel.app')) ||
      env.NODE_ENV !== 'production';

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Blocked by CORS policy: ${origin}`));
    }
  },
  credentials: true,
}));

// Body Parsers (with raw body support for Razorpay webhooks)
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf.toString();
    }
  },
}));

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(sanitizeInput);
app.use(cookieParser());
app.use(compression());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Public static images (thumbnails, faculty avatars, banners) & protected media files
app.use('/uploads/images', express.static(path.join(__dirname, '../uploads/images')));
app.get('/uploads/videos/:filename', protectMediaUpload('videos'));
app.get('/uploads/papers/:filename', protectMediaUpload('papers'));
app.use('/uploads', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Direct access to this upload directory is forbidden.',
  });
});

// Root Endpoint (Welcome & Uptime Check)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ranvi Institutions Backend API is active and running',
    status: 'online',
    version: '1.0.0',
    apiBase: '/api/v1',
    healthCheck: '/api/v1/health',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
