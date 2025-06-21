import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../src/utils/logger';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'qrmenu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

async function runCustomizationMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    logger.info('Starting customization migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/add-all-customizations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    logger.info('Customization migration completed successfully!');
    
    // Verify the migration by checking a few items
    const result = await pool.query(`
      SELECT name, customization_options 
      FROM menu_items 
      WHERE customization_options IS NOT NULL 
      AND customization_options != '[]'::json
      LIMIT 5
    `);
    
    logger.info(`Migration verification: ${result.rows.length} items have customization options`);
    result.rows.forEach(row => {
      logger.info(`- ${row.name}: ${JSON.stringify(row.customization_options).substring(0, 100)}...`);
    });
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runCustomizationMigration()
    .then(() => {
      logger.info('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { runCustomizationMigration };
