#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function checkCustomizations() {
  try {
    console.log('🔍 Checking customization data in database...\n');
    
    // Check all menu items
    const result = await pool.query('SELECT id, name, customization_options FROM menu_items ORDER BY id');
    
    console.log('=== Menu Items Customization Data ===');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Name: ${row.name}`);
      console.log(`Customizations Type: ${typeof row.customization_options}`);
      console.log(`Customizations Raw: ${row.customization_options}`);
      
      if (row.customization_options) {
        try {
          const parsed = typeof row.customization_options === 'string' 
            ? JSON.parse(row.customization_options) 
            : row.customization_options;
          console.log(`Customizations Parsed:`, JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(`Parse Error: ${e.message}`);
        }
      }
      console.log('---\n');
    });

    // Check data types and constraints
    console.log('=== Column Information ===');
    const columnInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' AND column_name = 'customization_options'
    `);
    console.log('Column Info:', columnInfo.rows[0]);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkCustomizations();
