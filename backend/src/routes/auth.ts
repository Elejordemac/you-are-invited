import { Router, Request, Response } from 'express';
import { authService } from '../services/auth';
import { LoginRequest, LoginResponse } from '../types/index';

const router = Router();

/**
 * POST /login
 * Authenticates an admin user and returns a JWT token.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const admin = await authService.verifyCredentials(username, password);

  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = authService.generateToken(admin);
  const response: LoginResponse = { token };

  return res.status(200).json(response);
});

export default router;
