import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth';
import { AdminRecord } from '../types/index';

// Mock the database pool
vi.mock('../db/index', () => ({
  default: {
    query: vi.fn(),
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
}));

import pool from '../db/index';
import bcrypt from 'bcrypt';

const mockPool = pool as unknown as { query: ReturnType<typeof vi.fn> };
const mockBcrypt = bcrypt as unknown as { compare: ReturnType<typeof vi.fn> };

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('verifyCredentials', () => {
    it('returns null when username is not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await authService.verifyCredentials('nonexistent', 'password');

      expect(result).toBeNull();
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT id, username, password_hash FROM admins WHERE username = $1',
        ['nonexistent']
      );
    });

    it('returns null when password does not match', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'uuid-1', username: 'admin', password_hash: '$2b$10$hash' }],
      });
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await authService.verifyCredentials('admin', 'wrongpassword');

      expect(result).toBeNull();
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', '$2b$10$hash');
    });

    it('returns AdminRecord when credentials are valid', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'uuid-1', username: 'admin', password_hash: '$2b$10$hash' }],
      });
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await authService.verifyCredentials('admin', 'correctpassword');

      expect(result).toEqual({
        id: 'uuid-1',
        username: 'admin',
        passwordHash: '$2b$10$hash',
      });
    });
  });

  describe('generateToken', () => {
    it('generates a valid JWT containing adminId and username', () => {
      const admin: AdminRecord = {
        id: 'uuid-1',
        username: 'admin',
        passwordHash: '$2b$10$hash',
      };

      const token = authService.generateToken(admin);

      const decoded = jwt.decode(token) as { adminId: string; username: string; exp: number };
      expect(decoded.adminId).toBe('uuid-1');
      expect(decoded.username).toBe('admin');
      expect(decoded.exp).toBeDefined();
    });

    it('generates a token that expires in 24 hours', () => {
      const admin: AdminRecord = {
        id: 'uuid-1',
        username: 'admin',
        passwordHash: '$2b$10$hash',
      };

      const token = authService.generateToken(admin);

      const decoded = jwt.decode(token) as { iat: number; exp: number };
      const duration = decoded.exp - decoded.iat;
      expect(duration).toBe(24 * 60 * 60); // 24 hours in seconds
    });
  });

  describe('verifyToken', () => {
    it('returns adminId and username for a valid token', () => {
      const admin: AdminRecord = {
        id: 'uuid-1',
        username: 'admin',
        passwordHash: '$2b$10$hash',
      };

      const token = authService.generateToken(admin);
      const result = authService.verifyToken(token);

      expect(result).toEqual({ adminId: 'uuid-1', username: 'admin' });
    });

    it('throws for an invalid token', () => {
      expect(() => authService.verifyToken('invalid-token')).toThrow();
    });

    it('throws for an expired token', () => {
      const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
      const token = jwt.sign(
        { adminId: 'uuid-1', username: 'admin' },
        secret,
        { expiresIn: '0s' }
      );

      // Small delay to ensure expiry
      expect(() => authService.verifyToken(token)).toThrow();
    });
  });
});
