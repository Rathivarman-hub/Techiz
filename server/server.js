import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import os from 'os';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import { connectRedis, isRedisConnected } from './config/redis.js';
import logger from './config/logger.js';
import { errorHandler, notFound } from './middleware/error.js';
import { generalLimiter, authLimiter, adminLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/auth.js';
import questionsRoutes from './routes/questions.js';
import assessmentsRoutes from './routes/assessments.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';
import certificatesRoutes from './routes/certificates.js';

dotenv.config();

// ─── Uncaught Error Handlers ──────────────────────────────────────────────────
// WHY: Without these, an unhandled promise rejection crashes the entire process.
// PM2 will restart it, but all in-flight requests are lost. Log and stay alive.
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
  process.exit(1); // let PM2 restart cleanly
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: String(reason) });
  // Don't exit — just log. PM2 cluster keeps other workers alive.
});

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
// WHY: helmet sets 15+ HTTP headers that defend against XSS, clickjacking,
// MIME sniffing, and other common web vulnerabilities. Zero performance cost.
app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow loading fonts/images from CDNs
}));

// ─── Compression ──────────────────────────────────────────────────────────────
// WHY: JSON responses compress to ~20% of their original size. At 1000 req/s
// this saves massive egress bandwidth and reduces client load time.
app.use(compression({ level: 6, threshold: 1024 })); // only compress >1KB

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, server-to-server) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// WHY: Limiting JSON body to 1mb (down from 10mb) prevents memory exhaustion
// attacks where clients send huge payloads to eat up server RAM.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── NoSQL Injection Protection ───────────────────────────────────────────────
// WHY: Strips $ and . from user input, preventing MongoDB operator injection.
// e.g., { "email": { "$gt": "" } } would match ALL users without this.
app.use(mongoSanitize());

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
// WHY: Morgan logs every request with method, url, status, and response time.
// Essential for diagnosing slow endpoints in production.
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.http(message.trim()) },
  skip: (req) => req.url === '/api/health', // don't spam logs with health checks
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Applied BEFORE routes so abusive traffic is rejected early
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin', adminLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
// WHY: Load balancers and process supervisors ping this to know if the instance is alive.
// Rich diagnostics help ops team diagnose issues without SSH-ing into the server.
const MONGOOSE_STATES = ['disconnected', 'connecting', 'connected', 'disconnecting'];

app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const toMB = (bytes) => `${Math.round(bytes / 1024 / 1024)} MB`;

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    pid: process.pid,
    cpus: os.cpus().length,
    memory: {
      heapUsed: toMB(memUsage.heapUsed),
      heapTotal: toMB(memUsage.heapTotal),
      rss: toMB(memUsage.rss),
    },
    services: {
      mongodb: MONGOOSE_STATES[mongoose.connection.readyState] || 'unknown',
      redis: isRedisConnected() ? 'connected' : 'unavailable',
    },
    version: process.version,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificatesRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB first (required), then Redis (optional — degrades gracefully)
  await connectDB();
  await connectRedis();

  const server = app.listen(PORT, () =>
    logger.info(`🚀 Techiz server running on port ${PORT} [PID: ${process.pid}]`)
  );

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  // WHY: When PM2 restarts a worker, it sends SIGTERM. Without this handler,
  // the process dies instantly, dropping all in-flight requests. With it,
  // Node.js stops accepting new connections and waits for current ones to finish.
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      logger.info('HTTP server closed');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });

    // Force-kill after 30s if requests are still pending
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
