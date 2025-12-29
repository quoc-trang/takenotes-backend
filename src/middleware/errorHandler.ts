import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  logger.error(`Request: ${req.method} ${req.url} - ${req.ip}`);
  
  if (err.name === 'ValidationError') {
    logger.warn(`Validation error: ${err.message}`);
    return res.status(400).json({ message: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    logger.warn(`Unauthorized access attempt: ${req.ip}`);
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  logger.error('Internal server error occurred');
  res.status(500).json({ message: 'Internal server error' });
}; 