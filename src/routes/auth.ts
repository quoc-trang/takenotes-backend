import { Router, Response, Request } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req: Request, res: Response) => {
  try {
    logger.info(`Registration attempt for email: ${req.body.email}`);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Registration validation failed: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      logger.warn(`Registration failed - user already exists: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    logger.info(`User registered successfully: ${email} (ID: ${user.id})`);
    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    logger.error(`Registration error: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
], async (req: Request, res: Response) => {
  try {
    logger.info(`Login attempt for email: ${req.body.email}`);
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      logger.warn(`Login validation failed: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      logger.warn(`Login failed - user not found: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Login failed - invalid password for user: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    logger.info(`User logged in successfully: ${email} (ID: ${user.id})`);
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token
    });
  } catch (error) {
    logger.error(`Login error: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find user to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });

    if (!user) {
      logger.warn(`Token refresh failed - user not found: ${req.user.id}`);
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    logger.info(`Token refreshed successfully for user: ${user.email} (ID: ${user.id})`);
    res.json({
      message: 'Token refreshed successfully',
      user,
      token: newToken
    });
  } catch (error) {
    logger.error(`Token refresh error: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout endpoint (optional - for server-side logout tracking)
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    logger.info(`User logged out: ${req.user.email} (ID: ${req.user.id})`);
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error(`Logout error: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 