const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const { CORS_ORIGIN } = require('./config/env');
const { globalLimiter } = require('./middleware/rateLimiter.middleware');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();

// ── Middleware Stack (order matches PRD Section 10.3) ──
// 1. Security headers
app.use(helmet());

// 2. CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const cleanAllowed = CORS_ORIGIN.replace(/\/$/, '');
    if (cleanOrigin === cleanAllowed || CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: Origin ${origin} not allowed by config CORS_ORIGIN=${CORS_ORIGIN}`));
    }
  },
  credentials: true,
}));

// 3. Body parsing + NoSQL injection prevention
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// 4. Rate limiting
app.use('/api', globalLimiter);

// 5. Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 6. Route mounting
app.use('/api/v1', routes);

// Welcome page
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TransitOps API Service', status: 'active', version: '1.0.0' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 7. Centralized error handler (last)
app.use(errorHandler);

module.exports = app;
