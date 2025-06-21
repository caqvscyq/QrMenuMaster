#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function clearOldCartItems() {
  try {
    console.log('🧹 Clearing old cart items with empty customizations...');
    
    const result = await pool.query(`
      DELETE FROM cart_items 
      WHERE customizations::text = '{}' OR customizations IS NULL
    `);
    
    console.log(`✅ Cleared ${result.rowCount} old cart items`);
    
    // Check remaining items
    const remaining = await pool.query('SELECT COUNT(*) as count FROM cart_items');
    console.log(`📦 Remaining cart items: ${remaining.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

clearOldCartItems();
