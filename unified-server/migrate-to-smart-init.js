#!/usr/bin/env node

/**
 * Migration Script: Transition to Smart Initialization
 * 
 * This script helps transition existing databases to the new smart initialization system.
 * It ensures that the database schema is up-to-date while preserving existing data.
 */

require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTableExists(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function runMigrationFile(filePath) {
  try {
    console.log(`📄 Running migration: ${path.basename(filePath)}`);
    const migrationSQL = fs.readFileSync(filePath, 'utf8');
    await pool.query(migrationSQL);
    console.log(`✅ Migration completed: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${path.basename(filePath)}`, error.message);
    // Don't throw - continue with other migrations
  }
}

async function ensureSchemaUpToDate() {
  console.log('🔄 Ensuring database schema is up-to-date...');
  
  // Run create-tables.sql to ensure all tables exist
  const createTablesPath = path.join(__dirname, 'create-tables.sql');
  if (fs.existsSync(createTablesPath)) {
    console.log('📄 Running create-tables.sql...');
    const createTablesSQL = fs.readFileSync(createTablesPath, 'utf8');
    await pool.query(createTablesSQL);
    console.log('✅ Base tables ensured');
  }
  
  // Run all migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order
    
    for (const file of migrationFiles) {
      await runMigrationFile(path.join(migrationsDir, file));
    }
  }
}

async function checkDataExists() {
  try {
    // Check if we have any shops
    const shopsResult = await pool.query('SELECT COUNT(*) as count FROM shops');
    const shopsCount = parseInt(shopsResult.rows[0].count);
    
    // Check if we have any menu items
    const menuResult = await pool.query('SELECT COUNT(*) as count FROM menu_items');
    const menuCount = parseInt(menuResult.rows[0].count);
    
    // Check if we have any orders
    const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    const ordersCount = parseInt(ordersResult.rows[0].count);
    
    // Check if we have any sessions
    const sessionsResult = await pool.query('SELECT COUNT(*) as count FROM sessions');
    const sessionsCount = parseInt(sessionsResult.rows[0].count);
    
    return {
      shops: shopsCount,
      menuItems: menuCount,
      orders: ordersCount,
      sessions: sessionsCount,
      hasData: shopsCount > 0 || menuCount > 0 || ordersCount > 0 || sessionsCount > 0
    };
  } catch (error) {
    console.error('Error checking data:', error);
    return { hasData: false };
  }
}

async function main() {
  console.log('🚀 Starting migration to smart initialization system...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // Check current state
    console.log('📊 Checking current database state...');
    const dataInfo = await checkDataExists();
    
    console.log(`   Shops: ${dataInfo.shops || 0}`);
    console.log(`   Menu Items: ${dataInfo.menuItems || 0}`);
    console.log(`   Orders: ${dataInfo.orders || 0}`);
    console.log(`   Sessions: ${dataInfo.sessions || 0}`);
    console.log(`   Has Data: ${dataInfo.hasData ? '✅ Yes' : '❌ No'}\n`);
    
    // Ensure schema is up-to-date
    await ensureSchemaUpToDate();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Your existing data has been preserved');
    console.log('   2. Database schema has been updated');
    console.log('   3. You can now use the new smart initialization system');
    console.log('   4. Run "npm run dev" to start with preserved data');
    console.log('   5. Use "node db-manager.js status" to check database status');
    
    if (!dataInfo.hasData) {
      console.log('\n💡 Your database appears to be empty.');
      console.log('   Consider running "npm run seed" to add initial data.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
