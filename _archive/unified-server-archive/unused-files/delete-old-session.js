// Delete the problematic old session
const { db } = require('./dist/config/database');
const { sessions } = require('./dist/shared/schema');
const { eq } = require('drizzle-orm');

async function deleteOldSession() {
  try {
    console.log('🗑️ Deleting old problematic session...');
    
    const oldSessionId = 'session-1750269477313-sbfn9f5xr';
    
    // Delete from database
    const deleted = await db
      .delete(sessions)
      .where(eq(sessions.id, oldSessionId))
      .returning();
    
    if (deleted.length > 0) {
      console.log(`✅ Deleted session from database: ${oldSessionId}`);
    } else {
      console.log(`ℹ️ Session not found in database: ${oldSessionId}`);
    }
    
    // Also delete any other legacy format sessions
    console.log('🧹 Cleaning up all legacy format sessions...');
    
    const legacySessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.status, 'active'));
    
    let deletedCount = 0;
    for (const session of legacySessions) {
      // Check if it's legacy format (doesn't match new format)
      const newFormatPattern = /^session-[A-Za-z0-9_-]+-\d{13}-[A-Za-z0-9]{6,15}$/;
      if (!newFormatPattern.test(session.id)) {
        await db.delete(sessions).where(eq(sessions.id, session.id));
        console.log(`🗑️ Deleted legacy session: ${session.id}`);
        deletedCount++;
      }
    }
    
    console.log(`✅ Cleaned up ${deletedCount} legacy sessions`);
    console.log('✅ Old session cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error deleting old session:', error);
  } finally {
    process.exit(0);
  }
}

deleteOldSession();
