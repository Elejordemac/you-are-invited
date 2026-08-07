import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireAuth } from './auth';

// Mock the auth service
vi.mock('../services/auth', () => ({
  authService: {
    verifyToken: vi.fn(),
  },
}));

import { authService } from '../services/auth';

const mockVerifyToken = authService.verifyToken as ReturnType<typeof vi.fn>;

function createApp() {
  const app = express();
  app.use(express.json());

  // Protected route using the auth middleware
  app.get('/api/admin/guests', requireAuth, (req, res) => {
    res.status(200).json({
      adminId: req.adminId,
      username: req.username,
    });
  });

  return app;
}

describe('requireAuth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no Authorization header is present', async () => {
    const app = createApp();
    const res = await request(app).get('/api/admin/guests');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });

  it('returns 401 when Authorization header does not use Bearer scheme', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/admin/guests')
      .set('Authorization', 'Basic abc123');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });

  it('returns 401 when token is invalid', async () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const app = createApp();
    const res = await request(app)
      .get('/api/admin/guests')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });

  it('returns 401 when token is expired', async () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const app = createApp();
    const res = await request(app)
      .get('/api/admin/guests')
      .set('Authorization', 'Bearer expired-token');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });

  it('calls next() and attaches admin info when token is valid', async () => {
    mockVerifyToken.mockReturnValue({ adminId: 'uuid-admin-1', username: 'admin' });

    const app = createApp();
    const res = await request(app)
      .get('/api/admin/guests')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ adminId: 'uuid-admin-1', username: 'admin' });
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-token');
  });

  it('returns 401 when Authorization header is "Bearer " with empty token', async () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error('jwt must be provided');
    });

    const app = createApp();
    const res = await request(app)
      .get('/api/admin/guests')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });
});
