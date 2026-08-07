import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/index';
import { AdminRecord } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

export class AuthService {
  /**
   * Looks up an admin by username and verifies the password against the stored bcrypt hash.
   * Returns the AdminRecord on success, or null if credentials are invalid.
   */
  async verifyCredentials(username: string, password: string): Promise<AdminRecord | null> {
    const result = await pool.query(
      'SELECT id, username, password_hash FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const isValid = await bcrypt.compare(password, row.password_hash);

    if (!isValid) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
    };
  }

  /**
   * Generates a JWT token for an authenticated admin.
   * Token contains adminId and username, expires in 24 hours.
   */
  generateToken(admin: AdminRecord): string {
    return jwt.sign(
      { adminId: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Verifies and decodes a JWT token.
   * Throws if token is invalid or expired.
   */
  verifyToken(token: string): { adminId: string; username: string } {
    const payload = jwt.verify(token, JWT_SECRET) as { adminId: string; username: string };
    return { adminId: payload.adminId, username: payload.username };
  }
}

export const authService = new AuthService();
