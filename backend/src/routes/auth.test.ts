import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRouter from './auth';

// Mock the auth service
vi.mock('../services/auth', () => ({
  authService: {
    verifyCredentials: vi.fn(),
    generateToken: vi.fn(),
  },
}));

import { authService } from '../services/auth';

const mockAuthService = authService as unknown as {
  verifyCredentials: ReturnType<typeof vi.fn>;
  generateToken: ReturnType<typeof vi.fn>;
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', authRouter);
  return app;
}

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with token on valid credentials', async () => {
    const admin = { id: 'uuid-1', username: 'admin', passwordHash: '$2b$10$hash' };
    mockAuthService.verifyCredentials.mockResolvedValue(admin);
    mockAuthService.generateToken.mockReturnValue('jwt-token-123');

    const app = createApp();
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'jwt-token-123' });
    expect(mockAuthService.verifyCredentials).toHaveBeenCalledWith('admin', 'admin123');
    expect(mockAuthService.generateToken).toHaveBeenCalledWith(admin);
  });

  it('returns 401 on invalid credentials', async () => {
    mockAuthService.verifyCredentials.mockResolvedValue(null);

    const app = createApp();
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });

  it('returns 401 when username is missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/admin/login')
      .send({ password: 'admin123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });

  it('returns 401 when password is missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });

  it('returns 401 when body is empty', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/admin/login')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });
});
