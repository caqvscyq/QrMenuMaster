#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function fixCustomizationsProperly() {
  try {
    console.log('🔧 Fixing customizations properly...\n');

    // Step 1: Change column type from text to json
    console.log('📝 Converting customization_options column to JSON type...');
    await pool.query(`
      ALTER TABLE menu_items 
      ALTER COLUMN customization_options 
      TYPE json USING customization_options::json
    `);
    console.log('✅ Column type converted to JSON\n');

    // Step 2: Fix drink customizations (珍珠奶茶, 冬瓜茶)
    console.log('🍹 Updating drink customizations...');
    const drinkCustomizations = {
      "sweetness": {
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
      "ice-level": {
        "id": "ice-level",
        "name": "冰塊",
        "type": "radio",
        "options": [
          {"id": "no-ice", "name": "去冰", "price": 0},
          {"id": "less-ice", "name": "微冰", "price": 0},
          {"id": "regular-ice", "name": "正常冰", "price": 0}
        ]
      },
      "size": {
        "id": "size",
        "name": "杯型",
        "type": "radio",
        "options": [
          {"id": "medium", "name": "中杯", "price": 0},
          {"id": "large", "name": "大杯", "price": 15}
        ]
      },
      "extra-pearls": {
        "id": "extra-pearls",
        "name": "加珍珠",
        "type": "checkbox",
        "price": 10
      }
    };

    const drinkCustomizationArray = [
      drinkCustomizations.sweetness,
      drinkCustomizations["ice-level"],
      drinkCustomizations.size,
      drinkCustomizations["extra-pearls"]
    ];

    await pool.query(`
      UPDATE menu_items
      SET customization_options = $1
      WHERE name IN ('珍珠奶茶', '冬瓜茶')
    `, [JSON.stringify(drinkCustomizationArray)]);
    console.log('✅ Drink customizations updated\n');

    // Step 3: Update food customizations to be more appropriate
    console.log('🍜 Updating food customizations...');
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

    await pool.query(`
      UPDATE menu_items
      SET customization_options = $1
      WHERE name NOT IN ('珍珠奶茶', '冬瓜茶')
    `, [JSON.stringify(foodCustomizations)]);
    console.log('✅ Food customizations updated\n');

    // Step 4: Verify the changes
    console.log('🔍 Verifying changes...');
    const result = await pool.query(`
      SELECT id, name, customization_options 
      FROM menu_items 
      ORDER BY id
    `);

    result.rows.forEach(row => {
      console.log(`${row.id}. ${row.name}`);
      const customizations = row.customization_options;
      if (customizations && customizations.length > 0) {
        customizations.forEach(option => {
          console.log(`   - ${option.name} (${option.type})`);
          if (option.options) {
            option.options.forEach(opt => {
              const priceText = opt.price > 0 ? ` (+$${opt.price})` : '';
              console.log(`     • ${opt.name}${priceText}`);
            });
          } else if (option.price) {
            console.log(`     • +$${option.price}`);
          }
        });
      }
      console.log('');
    });

    // Step 5: Check column type
    const columnInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' AND column_name = 'customization_options'
    `);
    console.log('📊 Column Info:', columnInfo.rows[0]);

    console.log('\n✅ All customizations fixed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Column type: text → json');
    console.log('- Drinks: Now have sweetness, ice level, size, extra pearls');
    console.log('- Food: Enhanced with noodle type, extra meat options');
    console.log('- All items: Have proper customization options');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixCustomizationsProperly();
