import 'express';

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
      username?: string;
    }
  }
}
