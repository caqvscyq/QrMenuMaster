#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function addCustomizationCostColumn() {
  try {
    console.log('🔧 Adding customization_cost column to order_items table...\n');
    
    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' AND column_name = 'customization_cost'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ customization_cost column already exists!');
      return;
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE order_items 
      ADD COLUMN customization_cost DECIMAL(10,2) DEFAULT 0.00
    `);
    
    console.log('✅ Successfully added customization_cost column to order_items table');
    
    // Verify the column was added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_items' AND column_name = 'customization_cost'
    `);
    
    if (verifyResult.rows.length > 0) {
      const col = verifyResult.rows[0];
      console.log(`📋 Column added: ${col.column_name} (${col.data_type}) DEFAULT ${col.column_default}`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

addCustomizationCostColumn();
