#!/usr/bin/env node

/**
 * Fix Customizations Script
 * 
 * This script ensures all menu items have proper customization options
 * and fixes any null or empty customization_options fields.
 */

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function fixCustomizations() {
  try {
    console.log('🔧 Fixing menu item customizations...');

    // First, let's see what we have
    const countResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN customization_options IS NULL THEN 1 END) as null_count,
        COUNT(CASE WHEN customization_options::text = 'null' THEN 1 END) as text_null_count,
        COUNT(CASE WHEN customization_options::text = '[]' THEN 1 END) as empty_array_count
      FROM menu_items
    `);
    
    console.log('📊 Current state:', countResult.rows[0]);

    // Fix null customization_options
    console.log('🔄 Fixing null customization_options...');
    await pool.query(`
      UPDATE menu_items 
      SET customization_options = '[]'::json 
      WHERE customization_options IS NULL
    `);

    // Fix text 'null' customization_options
    console.log('🔄 Fixing text null customization_options...');
    await pool.query(`
      UPDATE menu_items 
      SET customization_options = '[]'::json 
      WHERE customization_options::text = 'null'
    `);

    // Add default customizations for items without any
    console.log('🔄 Adding default customizations for items without any...');
    await pool.query(`
      UPDATE menu_items 
      SET customization_options = '[
        {
          "id": "spice-level",
          "name": "辣度",
          "type": "radio",
          "options": [
            {"id": "mild", "name": "微辣", "price": 0},
            {"id": "medium", "name": "中辣", "price": 0},
            {"id": "hot", "name": "大辣", "price": 0}
          ]
        },
        {
          "id": "extra-portion",
          "name": "加量",
          "type": "checkbox",
          "price": 30
        }
      ]'::json
      WHERE customization_options::text = '[]' OR customization_options IS NULL
    `);

    // Add specific customizations for drinks
    console.log('🔄 Adding drink-specific customizations...');
    await pool.query(`
      UPDATE menu_items 
      SET customization_options = '[
        {
          "id": "sweetness",
          "name": "甜度",
          "type": "radio",
          "options": [
            {"id": "no-sugar", "name": "無糖", "price": 0},
            {"id": "less-sweet", "name": "微糖", "price": 0},
            {"id": "half-sweet", "name": "半糖", "price": 0},
            {"id": "regular", "name": "正常糖", "price": 0}
          ]
        },
        {
          "id": "ice-level",
          "name": "冰塊",
          "type": "radio",
          "options": [
            {"id": "no-ice", "name": "去冰", "price": 0},
            {"id": "less-ice", "name": "微冰", "price": 0},
            {"id": "regular-ice", "name": "正常冰", "price": 0}
          ]
        },
        {
          "id": "size",
          "name": "杯型",
          "type": "radio",
          "options": [
            {"id": "medium", "name": "中杯", "price": 0},
            {"id": "large", "name": "大杯", "price": 15}
          ]
        }
      ]'::json
      WHERE (name LIKE '%茶%' OR name LIKE '%飲%' OR name LIKE '%汁%' OR name LIKE '%水%')
      AND (customization_options::text = '[]' OR customization_options IS NULL)
    `);

    // Check final state
    const finalResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN customization_options IS NULL THEN 1 END) as null_count,
        COUNT(CASE WHEN customization_options::text = 'null' THEN 1 END) as text_null_count,
        COUNT(CASE WHEN customization_options::text = '[]' THEN 1 END) as empty_array_count,
        COUNT(CASE WHEN jsonb_array_length(customization_options::jsonb) > 0 THEN 1 END) as with_customizations
      FROM menu_items
    `);
    
    console.log('📊 Final state:', finalResult.rows[0]);

    // Show some examples
    console.log('📋 Sample menu items with customizations:');
    const sampleResult = await pool.query(`
      SELECT id, name, customization_options
      FROM menu_items 
      WHERE jsonb_array_length(customization_options::jsonb) > 0
      LIMIT 3
    `);
    
    sampleResult.rows.forEach(row => {
      console.log(`  ${row.id}: ${row.name}`);
      console.log(`    Customizations: ${JSON.stringify(row.customization_options, null, 2)}`);
    });

    console.log('✅ Customizations fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing customizations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line execution
if (require.main === module) {
  fixCustomizations().catch(console.error);
}

module.exports = { fixCustomizations };
