#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function checkOrderItemsSchema() {
  try {
    console.log('🔍 Checking order_items table schema...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current order_items columns:');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    });
    
    // Check if customization_cost exists
    const hasCustomizationCost = result.rows.some(col => col.column_name === 'customization_cost');
    console.log(`\n❓ Has customization_cost column: ${hasCustomizationCost ? 'YES ✅' : 'NO ❌'}`);
    
    if (!hasCustomizationCost) {
      console.log('\n🔧 Need to add customization_cost column to order_items table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrderItemsSchema();
