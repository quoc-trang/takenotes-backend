import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn(`Authentication failed - no token provided from IP: ${req.ip}`);
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string };
    req.user = decoded;
    logger.debug(`Authentication successful for user: ${decoded.email} (ID: ${decoded.id})`);
    next();
  } catch (error) {
    logger.warn(`Authentication failed - invalid token from IP: ${req.ip}`);
    return res.status(403).json({ message: 'Invalid token' });
  }
}; 