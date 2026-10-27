require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const analyzeRouter = require('./routes/analyze');
const practiceRouter = require('./routes/practice');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────────────────
// Restrict to ALLOWED_ORIGIN in production; allow all in local dev.
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
}));

// ── body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());

// ── rate limiting ─────────────────────────────────────────────────────────────
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // 10 analyze requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a minute before trying again.' },
});

const practiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a minute.' },
});

// ── routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/analyze', analyzeLimiter, analyzeRouter);
app.use('/api/practice', practiceLimiter, practiceRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route not found.' }));

// ── global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── DB + start ────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
