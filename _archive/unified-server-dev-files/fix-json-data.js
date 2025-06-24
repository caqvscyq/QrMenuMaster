#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function fixJSONData() {
  try {
    console.log('🔧 Fixing JSON Data Issues...\n');

    // Clear all existing customization data first
    console.log('🗑️ Clearing existing invalid data...');
    await pool.query(`UPDATE menu_items SET customization_options = NULL`);

    // Define proper drink customizations
    const drinkCustomizations = [
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
      },
      {
        "id": "extra-pearls",
        "name": "加珍珠",
        "type": "checkbox",
        "price": 10
      }
    ];

    // Define proper food customizations
    const foodCustomizations = [
      {
        "id": "spice-level",
        "name": "辣度",
        "type": "radio",
        "options": [
          {"id": "mild", "name": "微辣", "price": 0},
          {"id": "medium", "name": "中辣", "price": 0},
          {"id": "hot", "name": "大辣", "price": 0},
          {"id": "extra-hot", "name": "特辣", "price": 5}
        ]
      },
      {
        "id": "noodle-type",
        "name": "麵條",
        "type": "radio",
        "options": [
          {"id": "thin", "name": "細麵", "price": 0},
          {"id": "thick", "name": "粗麵", "price": 0},
          {"id": "flat", "name": "寬麵", "price": 5}
        ]
      },
      {
        "id": "extra-portion",
        "name": "加量",
        "type": "checkbox",
        "price": 30
      },
      {
        "id": "extra-meat",
        "name": "加肉",
        "type": "checkbox",
        "price": 50
      }
    ];

    // Update drinks with proper JSON
    console.log('🍹 Updating drink customizations...');
    const drinkJSON = JSON.stringify(drinkCustomizations);
    await pool.query(`
      UPDATE menu_items 
      SET customization_options = $1
      WHERE name IN ('珍珠奶茶', '冬瓜茶')
    `, [drinkJSON]);

    // Update food with proper JSON
    console.log('🍜 Updating food customizations...');
    const foodJSON = JSON.stringify(foodCustomizations);
    await pool.query(`
      UPDATE menu_items 
      SET customization_options = $1
      WHERE name NOT IN ('珍珠奶茶', '冬瓜茶')
    `, [foodJSON]);

    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const testResult = await pool.query(`
      SELECT id, name, customization_options 
      FROM menu_items 
      WHERE name = '珍珠奶茶'
    `);

    if (testResult.rows.length > 0) {
      const item = testResult.rows[0];
      console.log(`✅ ${item.name}:`);
      console.log(`   Raw value: ${typeof item.customization_options}`);
      
      if (typeof item.customization_options === 'object') {
        console.log(`   Parsed successfully: ${JSON.stringify(item.customization_options, null, 2)}`);
      } else {
        console.log(`   Value: ${item.customization_options}`);
      }
    }

    // Test all items
    console.log('\n📊 Final verification:');
    const allItems = await pool.query(`
      SELECT id, name, 
        CASE 
          WHEN customization_options IS NULL THEN 'NULL'
          WHEN jsonb_array_length(customization_options::jsonb) > 0 THEN 'VALID_JSON'
          ELSE 'INVALID'
        END as status
      FROM menu_items 
      ORDER BY id
    `);

    allItems.rows.forEach(item => {
      console.log(`   ${item.id}. ${item.name}: ${item.status}`);
    });

    console.log('\n✅ JSON data fix completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixJSONData();
