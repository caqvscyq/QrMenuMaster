import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { logger } from './logger';

// Log the database connection string (with password masked)
const connectionString = process.env.DATABASE_URL;
if (connectionString) {
  const maskedConnectionString = connectionString.replace(/:([^:@]+)@/, ':***@');
  logger.info(`Connecting to database: ${maskedConnectionString}`);
} else {
  logger.error('DATABASE_URL environment variable is not set!');
}

// Create a PostgreSQL connection pool with more detailed configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
});

// Add error handler to the pool
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

// Initialize drizzle with the PostgreSQL pool
export const db = drizzle(pool);

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now');
    logger.info(`Database connected successfully at ${result.rows[0].now}`);
    
    // Check if we can access the tables
    try {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      logger.info(`Found ${tablesResult.rows.length} tables in database`);
    } catch (tableErr) {
      logger.error('Error checking database tables:', tableErr);
    }
    
    client.release();
    return true;
  } catch (error) {
    logger.error("Database connection failed:", error);
    return false;
  }
};

export { pool };
