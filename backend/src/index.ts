import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import authRouter from './routes/auth';
import guestsRouter from './routes/guests';
import adminGuestsRouter from './routes/admin-guests';
import pool from './db/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Configure CORS for frontend origin with credentials support
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// TEMPORARY: Seed admin endpoint - remove after first use
app.get('/api/seed-admin', async (_req, res) => {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query('DELETE FROM admins WHERE username = $1', ['admin']);
    await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
      ['admin', hash]
    );
    res.json({ success: true, message: 'Admin user seeded with password admin123' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public routes
app.use('/api/guests', guestsRouter);

// Admin routes
app.use('/api/admin', authRouter);
app.use('/api/admin/guests', adminGuestsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origin: ${CORS_ORIGIN}`);
});

export default app;
