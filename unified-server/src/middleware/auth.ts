import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { logger } from '../config/logger';
import { db } from '../config/database';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Extended Request interface to include user and session properties
export interface AuthRequest extends Omit<Request, 'session'> {
  user?: {
    id: number;
    username: string;
    role: string;
    shopId: number;
  };
  sessionId?: string;
  tableNumber?: string;
  session?: {
    id: string;
    tableNumber: string;
    deskId?: number;
    shopId: number;
    status: 'active' | 'expired' | 'completed';
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
    metadata: Record<string, any>;
  };
}

// JWT secret from environment variables
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: number = 86400; // 24 hours in seconds

// Generate JWT token
export const generateToken = (user: { id: number; username: string; role: string; shopId?: number }) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    shopId: user.shopId
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error('JWT verification failed:', error);
    return null;
  }
};

// Admin authentication middleware
export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Check if user exists and has admin or staff role
    const user = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    
    if (!user[0] || (user[0].role !== 'admin' && user[0].role !== 'staff')) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    // Attach user to request
    req.user = {
      id: user[0].id,
      username: user[0].username,
      role: user[0].role,
      shopId: user[0].shopId || 0
    };

    next();
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

// Customer authentication middleware (Database-based session management)
export const customerAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // For customers, we use database-stored session IDs
    const sessionId = req.headers['x-session-id'] as string;
    const tableNumber = req.headers['x-table-number'] as string;

    logger.info(`Customer auth - Session ID: "${sessionId}", Table: "${tableNumber}", URL: ${req.method} ${req.url}`);

    if (!sessionId) {
      logger.warn('Customer auth failed: No session ID provided');
      return res.status(401).json({ message: 'Session ID required' });
    }

    // Import SessionService dynamically to avoid circular dependencies
    const { SessionService } = await import('../services/session.service');

    // Validate session ID format
    if (!SessionService.validateSessionId(sessionId)) {
      logger.warn(`Invalid session ID format: "${sessionId}"`);
      return res.status(401).json({ message: 'Invalid session ID format' });
    }

    // Get session from database
    const session = await SessionService.getSession(sessionId);
    if (!session) {
      logger.warn(`Session not found or expired: "${sessionId}"`);
      return res.status(401).json({ message: 'Session not found or expired' });
    }

    // Extract table number from session ID, but fall back to database record for old format sessions
    let sessionTableNumber = SessionService.extractTableNumber(sessionId);
    if (!sessionTableNumber && session.tableNumber) {
      // For old format sessions, use the table number from the database record
      sessionTableNumber = session.tableNumber;
      logger.info(`Using table number from database record for old format session: "${sessionTableNumber}"`);
    }
    
    logger.info(`Final table number for validation: "${sessionTableNumber}"`);

    // Validate table number consistency if provided in headers
    if (tableNumber && tableNumber !== 'undefined' && sessionTableNumber && sessionTableNumber !== tableNumber) {
      logger.warn(`Table number mismatch - Session: "${sessionTableNumber}", Header: "${tableNumber}"`);
      return res.status(401).json({ message: 'Table number mismatch' });
    }

    // Update session activity
    await SessionService.updateActivity(sessionId);

    // Store session info in request for use by route handlers
    req.sessionId = sessionId;
    req.tableNumber = sessionTableNumber || session.tableNumber;
    req.session = {
      id: session.id,
      tableNumber: session.tableNumber,
      deskId: session.deskId,
      shopId: session.shopId || 1, // Default to shop 1 if not set
      status: session.status,
      createdAt: session.createdAt || new Date(),
      lastActivity: session.lastActivity || new Date(),
      expiresAt: session.expiresAt || new Date(),
      metadata: session.metadata || {}
    };

    logger.info(`Session validation successful for table: "${session.tableNumber}"`);
    logger.info('Customer auth successful - proceeding to next middleware');

    next();
  } catch (error) {
    logger.error('Customer auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

// Optional admin authentication (doesn't require admin role)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next();
    }

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    
    if (user[0]) {
      // Attach user to request
      req.user = {
        id: user[0].id,
        username: user[0].username,
        role: user[0].role,
        shopId: user[0].shopId || 0
      };
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

// Shop access middleware - ensures user has access to the specified shop
export const shopAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const shopId = parseInt(req.params.shopId || req.query.shopId as string);
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.shopId || req.user.shopId !== shopId) {
      return res.status(403).json({ message: 'Access denied: Not authorized for this shop' });
    }

    next();
  } catch (error) {
    logger.error('Shop access middleware error:', error);
    return res.status(500).json({ message: 'Authorization failed' });
  }
}; 