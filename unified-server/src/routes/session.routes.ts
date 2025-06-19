import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';
import { SessionService } from '../services/session.service';
import { z } from 'zod';
import { db } from '../config/database';
import { sessions } from '../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Validation schemas
const createSessionSchema = z.object({
  tableNumber: z.string().regex(/^[A-Za-z0-9_-]+$/, 'Invalid table number format'),
  deskId: z.number().optional(),
  shopId: z.number().default(1),
  expirationHours: z.number().min(1).max(24).default(4),
  metadata: z.record(z.any()).default({})
});

const validateSessionSchema = z.object({
  sessionId: z.string().refine((sessionId) => {
    // New format: session-{table}-{timestamp}-{random}
    const newFormatPattern = /^session-[A-Za-z0-9_-]+-\d{13}-[A-Za-z0-9]{6,15}$/;
    // Old format: session-{timestamp}-{random} (for backward compatibility)
    const oldFormatPattern = /^session-\d{13}-[A-Za-z0-9]{6,15}$/;

    return newFormatPattern.test(sessionId) || oldFormatPattern.test(sessionId);
  }, 'Invalid session ID format')
});

/**
 * POST /api/session/create
 * Create a new session for a table
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const validatedData = createSessionSchema.parse(req.body);
    
    logger.info(`Creating session for table: ${validatedData.tableNumber}`);
    
    // Check if there's already an active session for this table
    const existingSession = await SessionService.getOrCreateSession(
      validatedData.tableNumber, 
      validatedData.shopId
    );
    
    logger.info(`Session created/retrieved: ${existingSession.id}`);
    
    res.json({
      success: true,
      session: {
        id: existingSession.id,
        tableNumber: existingSession.tableNumber,
        shopId: existingSession.shopId,
        status: existingSession.status,
        expiresAt: existingSession.expiresAt,
        createdAt: existingSession.createdAt
      }
    });
  } catch (error) {
    logger.error('Failed to create session:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create session'
    });
  }
});

/**
 * GET /api/session/:sessionId
 * Get session details
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = validateSessionSchema.parse({ sessionId: req.params.sessionId });
    
    const session = await SessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }
    
    res.json({
      success: true,
      session: {
        id: session.id,
        tableNumber: session.tableNumber,
        shopId: session.shopId,
        status: session.status,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    logger.error('Failed to get session:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get session'
    });
  }
});

/**
 * POST /api/session/:sessionId/activity
 * Update session activity (heartbeat)
 */
router.post('/:sessionId/activity', async (req: Request, res: Response) => {
  try {
    const { sessionId } = validateSessionSchema.parse({ sessionId: req.params.sessionId });
    
    const updated = await SessionService.updateActivity(sessionId);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }
    
    res.json({
      success: true,
      message: 'Session activity updated'
    });
  } catch (error) {
    logger.error('Failed to update session activity:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update session activity'
    });
  }
});

/**
 * POST /api/session/:sessionId/complete
 * Mark session as completed (when order is placed)
 */
router.post('/:sessionId/complete', async (req: Request, res: Response) => {
  try {
    const { sessionId } = validateSessionSchema.parse({ sessionId: req.params.sessionId });
    
    const completed = await SessionService.completeSession(sessionId);
    
    if (!completed) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Session completed successfully'
    });
  } catch (error) {
    logger.error('Failed to complete session:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to complete session'
    });
  }
});

/**
 * GET /api/session/table/:tableNumber
 * Get all active sessions for a table
 */
router.get('/table/:tableNumber', async (req: Request, res: Response) => {
  try {
    const tableNumber = req.params.tableNumber;
    const shopId = parseInt(req.query.shopId as string) || 1;
    
    // Validate table number format
    if (!/^[A-Za-z0-9_-]+$/.test(tableNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table number format'
      });
    }
    
    const sessions = await SessionService.getTableSessions(tableNumber, shopId);
    
    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        tableNumber: session.tableNumber,
        shopId: session.shopId,
        status: session.status,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }))
    });
  } catch (error) {
    logger.error('Failed to get table sessions:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get table sessions'
    });
  }
});

/**
 * DELETE /api/session/table/:tableNumber/reset
 * Reset all sessions for a table (admin only)
 */
router.delete('/table/:tableNumber/reset', async (req: Request, res: Response) => {
  try {
    const tableNumber = req.params.tableNumber;
    const shopId = parseInt(req.query.shopId as string) || 1;
    
    // Validate table number format
    if (!/^[A-Za-z0-9_-]+$/.test(tableNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table number format'
      });
    }
    
    const resetCount = await SessionService.resetTableSessions(tableNumber, shopId);
    
    logger.info(`Reset ${resetCount} sessions for table ${tableNumber}`);
    
    res.json({
      success: true,
      message: `Reset ${resetCount} sessions for table ${tableNumber}`,
      resetCount
    });
  } catch (error) {
    logger.error('Failed to reset table sessions:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to reset table sessions'
    });
  }
});

/**
 * POST /api/session/cleanup
 * Cleanup expired sessions (admin only)
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const cleanedCount = await SessionService.cleanupExpiredSessions();

    logger.info(`Cleaned up ${cleanedCount} expired sessions`);

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired sessions`,
      cleanedCount
    });
  } catch (error) {
    logger.error('Failed to cleanup expired sessions:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired sessions'
    });
  }
});

/**
 * POST /api/session/cleanup-problematic
 * Cleanup problematic sessions that might be causing 404 errors (admin only)
 */
router.post('/cleanup-problematic', async (req: Request, res: Response) => {
  try {
    const result = await SessionService.cleanupProblematicSessions();

    logger.info(`Cleaned up ${result.cleaned} problematic sessions`);
    if (result.errors.length > 0) {
      logger.warn('Issues found during cleanup:', result.errors);
    }

    res.json({
      success: true,
      message: `Cleaned up ${result.cleaned} problematic sessions`,
      cleanedCount: result.cleaned,
      issues: result.errors
    });
  } catch (error) {
    logger.error('Failed to cleanup problematic sessions:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to cleanup problematic sessions'
    });
  }
});

/**
 * POST /api/session/cleanup-invalid-formats
 * Cleanup sessions with invalid formats (missing table numbers)
 */
router.post('/cleanup-invalid-formats', async (req: Request, res: Response) => {
  try {
    logger.info('🧹 Starting comprehensive cleanup of invalid session formats...');

    // Get all sessions (not just active ones)
    const allSessions = await db
      .select()
      .from(sessions);

    let cleanedCount = 0;
    const cleanedSessions = [];

    for (const session of allSessions) {
      // Check if session ID has invalid format (missing table number)
      const isValidFormat = SessionService.validateSessionId(session.id);
      const parts = session.id.split('-');
      const hasTableNumber = parts.length >= 4;
      const isOldFormat = parts.length === 3 && parts[0] === 'session'; // session-timestamp-random

      if (!isValidFormat || !hasTableNumber || isOldFormat) {
        logger.warn(`Found invalid session format: ${session.id} (valid: ${isValidFormat}, hasTable: ${hasTableNumber}, oldFormat: ${isOldFormat})`);

        // Mark as expired and add cleanup metadata
        await db
          .update(sessions)
          .set({
            status: 'expired',
            lastActivity: new Date(),
            metadata: {
              ...(session.metadata || {}),
              cleanupReason: 'Invalid session format - missing table number',
              cleanupDate: new Date().toISOString(),
              originalFormat: session.id
            }
          })
          .where(eq(sessions.id, session.id));

        cleanedSessions.push({
          id: session.id,
          tableNumber: session.tableNumber,
          reason: !isValidFormat ? 'Invalid format' :
                  !hasTableNumber ? 'Missing table number' :
                  'Old format (session-timestamp-random)'
        });
        cleanedCount++;
      }
    }

    logger.info(`✅ Invalid format cleanup completed: ${cleanedCount} sessions cleaned`);

    res.json({
      success: true,
      message: `Invalid format cleanup completed: ${cleanedCount} sessions cleaned`,
      cleanedCount,
      cleanedSessions,
      totalSessionsChecked: allSessions.length
    });
  } catch (error) {
    logger.error('Error in invalid format session cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform invalid format session cleanup',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
