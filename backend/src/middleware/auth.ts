import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';

/**
 * Express middleware that validates JWT tokens on admin routes.
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches adminId and username to the request.
 *
 * Returns 401 for missing, invalid, or expired tokens.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const payload = authService.verifyToken(token);
    req.adminId = payload.adminId;
    req.username = payload.username;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication required' });
  }
}
