import { db } from '../config/database';
import { logger } from '../config/logger';
import { cacheSet, cacheGet, cacheDelete } from '../config/redis';
import { eq, and, lt, gte, desc, or, sql } from 'drizzle-orm';
import { sessions, type Session, type InsertSession } from '../shared/schema';

export interface CreateSessionData {
  tableNumber: string;
  deskId?: number;
  shopId?: number;
  expirationHours?: number;
  metadata?: Record<string, any>;
}

export class SessionService {
  private static readonly DEFAULT_EXPIRATION_HOURS = 4;
  private static readonly CACHE_TTL = 3600; // 1 hour cache
  private static readonly CACHE_PREFIX = 'session:';

  /**
   * Generate a new session ID with the correct format
   */
  static generateSessionId(tableNumber: string): string {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 11); // 9 characters
    return `session-${tableNumber}-${timestamp}-${randomPart}`;
  }

  /**
   * Validate session ID format - supports both old and new formats
   */
  static validateSessionId(sessionId: string): boolean {
    // New format: session-{table}-{timestamp}-{random}
    const newFormatPattern = /^session-[A-Za-z0-9_-]+-\d{13}-[A-Za-z0-9]{6,15}$/;
    // Old format: session-{timestamp}-{random} (for backward compatibility)
    const oldFormatPattern = /^session-\d{13}-[A-Za-z0-9]{6,15}$/;

    return newFormatPattern.test(sessionId) || oldFormatPattern.test(sessionId);
  }

  /**
   * Extract table number from session ID
   */
  static extractTableNumber(sessionId: string): string | null {
    if (!this.validateSessionId(sessionId)) {
      return null;
    }

    const parts = sessionId.split('-');

    // New format: session-{table}-{timestamp}-{random}
    if (parts.length >= 4) {
      return parts[1];
    }

    // Old format: session-{timestamp}-{random} - no table number available
    return null;
  }

  /**
   * Create a new session
   */
  static async createSession(data: CreateSessionData): Promise<Session> {
    const sessionId = this.generateSessionId(data.tableNumber);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (data.expirationHours || this.DEFAULT_EXPIRATION_HOURS));

    const sessionData = {
      id: sessionId,
      tableNumber: data.tableNumber,
      deskId: data.deskId,
      shopId: data.shopId || 1,
      status: 'active' as const,
      expiresAt,
      metadata: data.metadata || {}
    };

    try {
      const [session] = await db.insert(sessions).values(sessionData).returning();
      
      // Cache the session
      await cacheSet(
        `${this.CACHE_PREFIX}${sessionId}`, 
        JSON.stringify(session), 
        this.CACHE_TTL
      );

      logger.info(`Session created: ${sessionId} for table ${data.tableNumber}`);
      return session;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get session by ID
   */
  static async getSession(sessionId: string): Promise<Session | null> {
    if (!this.validateSessionId(sessionId)) {
      logger.warn(`Invalid session ID format: ${sessionId}`);
      return null;
    }

    // Try cache first (with fallback handling)
    try {
      const cached = await cacheGet(`${this.CACHE_PREFIX}${sessionId}`);
      if (cached) {
        const session = JSON.parse(cached);
        // Check if cached session is expired
        if (new Date(session.expiresAt) > new Date()) {
          return session;
        }
        // Remove expired session from cache
        await cacheDelete(`${this.CACHE_PREFIX}${sessionId}`);
      }
    } catch (cacheError) {
      logger.warn('Cache unavailable, falling back to database:', cacheError);
    }

    try {
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.id, sessionId),
          eq(sessions.status, 'active'),
          gte(sessions.expiresAt, new Date())
        ))
        .limit(1);

      if (session) {
        // Update cache (with error handling)
        try {
          await cacheSet(
            `${this.CACHE_PREFIX}${sessionId}`,
            JSON.stringify(session),
            this.CACHE_TTL
          );
        } catch (cacheError) {
          logger.warn('Failed to cache session, continuing without cache:', cacheError);
        }
        return session;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get session from database:', error);

      // If database is unavailable, create a temporary fallback session
      if (this.isValidSessionFormat(sessionId)) {
        logger.warn(`Database unavailable, creating fallback session for: ${sessionId}`);
        return this.createFallbackSession(sessionId);
      }

      return null;
    }
  }

  /**
   * Update session activity
   */
  static async updateActivity(sessionId: string): Promise<boolean> {
    if (!this.validateSessionId(sessionId)) {
      return false;
    }

    try {
      const [updated] = await db
        .update(sessions)
        .set({ lastActivity: new Date() })
        .where(and(
          eq(sessions.id, sessionId),
          eq(sessions.status, 'active')
        ))
        .returning();

      if (updated) {
        // Update cache
        await cacheSet(
          `${this.CACHE_PREFIX}${sessionId}`, 
          JSON.stringify(updated), 
          this.CACHE_TTL
        );
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to update session activity:', error);
      return false;
    }
  }

  /**
   * Get or create session for table
   */
  static async getOrCreateSession(tableNumber: string, shopId: number = 1): Promise<Session> {
    // First, try to find an active session for this table
    try {
      const [existingSession] = await db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.tableNumber, tableNumber),
          eq(sessions.shopId, shopId),
          eq(sessions.status, 'active'),
          gte(sessions.expiresAt, new Date())
        ))
        .orderBy(desc(sessions.lastActivity))
        .limit(1);

      if (existingSession) {
        // Update activity and return existing session
        await this.updateActivity(existingSession.id);
        return existingSession;
      }
    } catch (error) {
      logger.error('Error checking for existing session:', error);
    }

    // Create new session if none exists
    return this.createSession({ tableNumber, shopId });
  }

  /**
   * Complete session (when order is placed)
   */
  static async completeSession(sessionId: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(sessions)
        .set({ 
          status: 'completed',
          lastActivity: new Date()
        })
        .where(eq(sessions.id, sessionId))
        .returning();

      if (updated) {
        // Remove from cache
        await cacheDelete(`${this.CACHE_PREFIX}${sessionId}`);
        logger.info(`Session completed: ${sessionId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to complete session:', error);
      return false;
    }
  }

  /**
   * Cleanup expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await db
        .delete(sessions)
        .where(or(
          lt(sessions.expiresAt, new Date()),
          eq(sessions.status, 'expired')
        ))
        .returning({ id: sessions.id });

      // Clear cache for deleted sessions
      for (const session of expiredSessions) {
        await cacheDelete(`${this.CACHE_PREFIX}${session.id}`);
      }

      logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
      return expiredSessions.length;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get active sessions for a table
   */
  static async getTableSessions(tableNumber: string, shopId: number = 1): Promise<Session[]> {
    try {
      const tableSessions = await db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.tableNumber, tableNumber),
          eq(sessions.shopId, shopId),
          eq(sessions.status, 'active'),
          gte(sessions.expiresAt, new Date())
        ))
        .orderBy(desc(sessions.lastActivity));

      return tableSessions;
    } catch (error) {
      logger.error('Failed to get table sessions:', error);
      return [];
    }
  }

  /**
   * Reset table sessions (clear all active sessions for a table)
   */
  static async resetTableSessions(tableNumber: string, shopId: number = 1): Promise<number> {
    try {
      const resetSessions = await db
        .update(sessions)
        .set({
          status: 'expired',
          lastActivity: new Date()
        })
        .where(and(
          eq(sessions.tableNumber, tableNumber),
          eq(sessions.shopId, shopId),
          eq(sessions.status, 'active')
        ))
        .returning({ id: sessions.id });

      // Clear cache for reset sessions
      for (const session of resetSessions) {
        await cacheDelete(`${this.CACHE_PREFIX}${session.id}`);
      }

      logger.info(`Reset ${resetSessions.length} sessions for table ${tableNumber}`);
      return resetSessions.length;
    } catch (error) {
      logger.error('Failed to reset table sessions:', error);
      return 0;
    }
  }

  /**
   * Clean up problematic sessions that might be causing 404 errors
   * This includes sessions with invalid formats, orphaned sessions, etc.
   */
  static async cleanupProblematicSessions(): Promise<{ cleaned: number, errors: string[] }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      // Get all sessions to check for problems
      const allSessions = await db.select().from(sessions);
      const problematicSessions: string[] = [];

      for (const session of allSessions) {
        // Check for invalid session ID format
        if (!this.validateSessionId(session.id)) {
          problematicSessions.push(session.id);
          errors.push(`Invalid session ID format: ${session.id}`);
          continue;
        }

        // Check for sessions that are expired but still marked as active
        if (session.status === 'active' && new Date(session.expiresAt) < new Date()) {
          problematicSessions.push(session.id);
          errors.push(`Expired session still marked as active: ${session.id}`);
          continue;
        }

        // Check for sessions with missing or invalid table numbers
        if (!session.tableNumber || !/^[A-Za-z0-9_-]+$/.test(session.tableNumber)) {
          problematicSessions.push(session.id);
          errors.push(`Invalid table number for session: ${session.id}`);
          continue;
        }
      }

      // Clean up problematic sessions
      if (problematicSessions.length > 0) {
        const deletedSessions = await db
          .delete(sessions)
          .where(sql`${sessions.id} = ANY(${problematicSessions})`)
          .returning({ id: sessions.id });

        // Clear cache for deleted sessions
        for (const session of deletedSessions) {
          await cacheDelete(`${this.CACHE_PREFIX}${session.id}`);
        }

        cleaned = deletedSessions.length;
        logger.info(`Cleaned up ${cleaned} problematic sessions`);
      }

      return { cleaned, errors };
    } catch (error) {
      logger.error('Failed to cleanup problematic sessions:', error);
      errors.push(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
      return { cleaned, errors };
    }
  }

  /**
   * Check if session ID has valid format (for fallback validation)
   */
  static isValidSessionFormat(sessionId: string): boolean {
    // New format: session-{table}-{timestamp}-{random}
    const newFormatPattern = /^session-[A-Za-z0-9_-]+-\d{13}-[A-Za-z0-9]{6,15}$/;
    // Old format: session-{timestamp}-{random} (for backward compatibility)
    const oldFormatPattern = /^session-\d{13}-[A-Za-z0-9]{6,15}$/;

    return newFormatPattern.test(sessionId) || oldFormatPattern.test(sessionId);
  }

  /**
   * Create a temporary fallback session when database is unavailable
   */
  static createFallbackSession(sessionId: string): Session {
    const tableNumber = this.extractTableNumber(sessionId) || 'unknown';
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000));

    logger.info(`Creating fallback session: ${sessionId} for table: ${tableNumber}`);

    return {
      id: sessionId,
      tableNumber,
      deskId: null,
      shopId: 1,
      status: 'active' as const,
      createdAt: now,
      lastActivity: now,
      expiresAt,
      metadata: { fallback: true, created: now.toISOString() }
    };
  }
}
