#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function checkRecentOrdersWithCustomizationCost() {
  try {
    console.log('🔍 Checking Recent Orders with Customization Cost Data\n');
    
    const result = await pool.query(`
      SELECT 
        o.id as order_id,
        o.created_at,
        o.table_number,
        o.total as order_total,
        oi.item_name,
        oi.price as item_price,
        oi.customization_cost,
        oi.customizations,
        (oi.price::numeric - COALESCE(oi.customization_cost::numeric, 0)) as base_price
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.item_name = '紅燒牛肉麵'
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    
    console.log('📋 Recent 紅燒牛肉麵 Orders (with customization cost breakdown):');
    
    result.rows.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ID: ${order.order_id}`);
      console.log(`   Created: ${order.created_at}`);
      console.log(`   Table: ${order.table_number}`);
      console.log(`   Order Total: $${order.order_total}`);
      console.log(`   Item Price: $${order.item_price}`);
      console.log(`   Customization Cost: $${order.customization_cost || '0.00'}`);
      console.log(`   Base Price: $${order.base_price}`);
      
      if (order.customizations && Object.keys(order.customizations).length > 0) {
        console.log(`   Customizations: ${JSON.stringify(order.customizations)}`);
      } else {
        console.log(`   Customizations: None`);
      }
      
      // Check if this order has proper customization cost tracking
      const customizationCost = parseFloat(order.customization_cost || '0');
      if (customizationCost > 0) {
        console.log(`   ✅ HAS customization cost tracking!`);
      } else if (order.customizations && Object.keys(order.customizations).length > 0) {
        console.log(`   ⚠️  Has customizations but no cost tracking (old format)`);
      } else {
        console.log(`   ℹ️  No customizations`);
      }
    });
    
    // Summary
    const withCustomizationCost = result.rows.filter(r => parseFloat(r.customization_cost || '0') > 0);
    const withCustomizationsButNoCost = result.rows.filter(r => 
      r.customizations && 
      Object.keys(r.customizations).length > 0 && 
      parseFloat(r.customization_cost || '0') === 0
    );
    
    console.log('\n📊 Summary:');
    console.log(`   Total orders: ${result.rows.length}`);
    console.log(`   With customization cost tracking: ${withCustomizationCost.length} ✅`);
    console.log(`   With customizations but no cost tracking: ${withCustomizationsButNoCost.length} ⚠️`);
    console.log(`   Without customizations: ${result.rows.length - withCustomizationCost.length - withCustomizationsButNoCost.length}`);
    
    if (withCustomizationCost.length > 0) {
      console.log('\n🎉 SUCCESS: New orders are properly storing customization costs!');
    } else {
      console.log('\n⚠️  No orders with customization cost tracking found yet.');
      console.log('   Try adding a customized item through the frontend and creating an order.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkRecentOrdersWithCustomizationCost();
