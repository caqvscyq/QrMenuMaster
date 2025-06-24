#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function checkCurrentCartStatus() {
  try {
    console.log('🔍 Checking Current Cart Status\n');

    // Check all cart items with details
    const allItems = await pool.query(`
      SELECT ci.*, mi.name as menu_item_name, mi.customization_options,
             s.table_number, s.status as session_status
      FROM cart_items ci
      JOIN menu_items mi ON ci.menu_item_id = mi.id
      LEFT JOIN sessions s ON ci.session_id = s.id
      ORDER BY ci.created_at DESC
    `);

    console.log(`Found ${allItems.rows.length} cart items:\n`);

    allItems.rows.forEach((item, index) => {
      console.log(`📦 Item ${index + 1}: ${item.menu_item_name}`);
      console.log(`   Session: ${item.session_id} (Table: ${item.table_number || 'N/A'})`);
      console.log(`   Session Status: ${item.session_status || 'N/A'}`);
      console.log(`   Quantity: ${item.quantity}`);
      console.log(`   Created: ${item.created_at}`);
      console.log(`   Customizations: ${JSON.stringify(item.customizations)}`);
      console.log(`   Special Instructions: ${item.special_instructions || 'null'}`);
      console.log(`   Customization Cost: $${item.customization_cost || '0.00'}`);
      
      // Check if this item has customization options available
      if (item.customization_options && Array.isArray(item.customization_options)) {
        console.log(`   Available Options: ${item.customization_options.length} options`);
        item.customization_options.forEach(opt => {
          console.log(`     - ${opt.name} (${opt.type})`);
        });
      } else {
        console.log(`   Available Options: None`);
      }
      console.log('');
    });

    // Check if there are any items with empty customizations
    const emptyCustomizations = allItems.rows.filter(item => 
      !item.customizations || 
      JSON.stringify(item.customizations) === '{}' ||
      Object.keys(item.customizations || {}).length === 0
    );

    if (emptyCustomizations.length > 0) {
      console.log(`⚠️  Found ${emptyCustomizations.length} items with empty customizations:`);
      emptyCustomizations.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.menu_item_name} (Created: ${item.created_at})`);
      });
      
      console.log('\n🧹 Would you like to clear these old items? (They seem to be from before the fix)');
      console.log('   Run: DELETE FROM cart_items WHERE customizations::text = \'{}\' OR customizations IS NULL;');
    } else {
      console.log('✅ All cart items have proper customizations!');
    }

    // Check active sessions
    console.log('\n📱 Active Sessions:');
    const activeSessions = await pool.query(`
      SELECT id, table_number, status, created_at, expires_at
      FROM sessions 
      WHERE status = 'active' AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (activeSessions.rows.length > 0) {
      activeSessions.rows.forEach((session, index) => {
        console.log(`   ${index + 1}. ${session.id}`);
        console.log(`      Table: ${session.table_number}`);
        console.log(`      Status: ${session.status}`);
        console.log(`      Created: ${session.created_at}`);
        console.log(`      Expires: ${session.expires_at}`);
      });
    } else {
      console.log('   No active sessions found');
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. If you see items with empty customizations, they are old items');
    console.log('   2. Try adding a new item through the frontend with customizations');
    console.log('   3. The new item should have proper customizations and cost');
    console.log('   4. Use an active session from the list above for testing');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkCurrentCartStatus();
