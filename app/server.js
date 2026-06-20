// Load environment variables before anything else
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./src/config/socket');
const env = require('./src/config/env');
const { testConnection: testDb } = require('./src/config/db');
const { redis, testConnection: testRedis } = require('./src/config/redis');
const authRoutes        = require('./src/routes/auth.routes');
const trainRoutes       = require('./src/routes/train.routes');
const tatkalRoutes      = require('./src/routes/tatkal.routes');
const adminRoutes       = require('./src/routes/admin.routes');
const reservationRoutes = require('./src/routes/reservation.routes');
const paymentRoutes     = require('./src/routes/payment.routes');
const bookingRoutes     = require('./src/routes/booking.routes');
const { loadInventoryIntoRedis } = require('./src/services/inventory.service');
const { startPaymentChecker } = require('./src/services/payment.checker');
// Importing the worker module starts it immediately — BullMQ connects and
// begins listening for jobs as soon as this module is required.
const { bookingWorker } = require('./src/workers/booking.worker');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth',        authRoutes);
app.use('/trains',      trainRoutes);
app.use('/tatkal',      tatkalRoutes);
app.use('/admin',       adminRoutes);
app.use('/reservation', reservationRoutes);
app.use('/payments',    paymentRoutes);
app.use('/bookings',    bookingRoutes);

/**
 * GET /health
 * Returns the liveness status of the server along with
 * connectivity checks for PostgreSQL and Redis.
 */
app.get('/health', async (req, res) => {
  let postgresStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await testDb();
    postgresStatus = 'connected';
  } catch (err) {
    console.error('[Health] Postgres check failed:', err.message);
  }

  try {
    await testRedis();
    redisStatus = 'connected';
  } catch (err) {
    console.error('[Health] Redis check failed:', err.message);
  }

  const allHealthy = postgresStatus === 'connected' && redisStatus === 'connected';

  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    postgres: postgresStatus,
    redis: redisStatus,
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Catches any unhandled errors thrown in route handlers.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Startup ─────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    // 1. Connect Redis first — reservation service depends on it
    await redis.connect();

    // 2. Preload PostgreSQL seat inventory into Redis.
    //    This ensures the Lua reservation script finds valid keys from the start.
    //    A warning is logged (not an error) if no rows exist yet.
    await loadInventoryIntoRedis();

    // 3. Start accepting HTTP requests via the HTTP server (which includes Socket.io)
    server.listen(env.port, () => {
      console.log(`[Server] Running on port ${env.port} (${env.nodeEnv})`);
      console.log(`[BookingWorker] Worker active — listening for booking jobs.`);
      
      // Start background polling for expired payment holds
      startPaymentChecker();
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
};

start();
