#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function checkCurrentState() {
  try {
    console.log('🔍 Current Database State Summary\n');
    
    // Check all orders from today
    const todayOrders = await pool.query(`
      SELECT 
        o.id,
        o.created_at,
        o.table_number,
        oi.item_name,
        oi.price,
        oi.customization_cost,
        CASE 
          WHEN oi.customization_cost IS NULL THEN 'NULL'
          WHEN oi.customization_cost::numeric = 0 THEN 'ZERO'
          ELSE 'HAS_VALUE'
        END as cost_status,
        CASE 
          WHEN oi.customizations IS NULL OR oi.customizations::text = '{}' THEN 'NO_CUSTOMIZATIONS'
          ELSE 'HAS_CUSTOMIZATIONS'
        END as customization_status
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.created_at::date = CURRENT_DATE
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    
    console.log('📋 Today\'s Orders Summary:');
    console.log('   Total orders today:', todayOrders.rows.length);
    
    const withCustomizationCost = todayOrders.rows.filter(r => r.cost_status === 'HAS_VALUE');
    const withCustomizations = todayOrders.rows.filter(r => r.customization_status === 'HAS_CUSTOMIZATIONS');
    const withCustomizationsButNoCost = todayOrders.rows.filter(r => 
      r.customization_status === 'HAS_CUSTOMIZATIONS' && r.cost_status !== 'HAS_VALUE'
    );
    
    console.log('   With customization cost: ' + withCustomizationCost.length + ' ✅');
    console.log('   With customizations: ' + withCustomizations.length);
    console.log('   With customizations but no cost: ' + withCustomizationsButNoCost.length + ' ⚠️');
    
    if (withCustomizationCost.length > 0) {
      console.log('\n🎉 SUCCESS: Found orders with customization cost tracking!');
      withCustomizationCost.forEach(order => {
        console.log(`   Order ${order.id}: $${order.price} (cost: $${order.customization_cost})`);
      });
    } else {
      console.log('\n⚠️  No orders with customization cost found yet.');
      console.log('   This means either:');
      console.log('   1. No orders with customizations have been created through the frontend');
      console.log('   2. The frontend build needs to be updated');
      console.log('   3. The frontend is not using the updated cart hook');
    }
    
    // Show recent orders details
    if (todayOrders.rows.length > 0) {
      console.log('\n📋 Recent Orders Details:');
      todayOrders.rows.slice(0, 3).forEach((order, index) => {
        console.log(`\n${index + 1}. Order ID: ${order.id}`);
        console.log(`   Table: ${order.table_number}`);
        console.log(`   Item: ${order.item_name}`);
        console.log(`   Price: $${order.price}`);
        console.log(`   Customization Cost: $${order.customization_cost || '0.00'}`);
        console.log(`   Status: ${order.cost_status} / ${order.customization_status}`);
      });
    }
    
    // Check the order_items table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'order_items' AND column_name = 'customization_cost'
    `);
    
    console.log('\n🔧 Database Schema Check:');
    if (tableInfo.rows.length > 0) {
      console.log('   ✅ customization_cost column exists in order_items table');
      console.log(`   Type: ${tableInfo.rows[0].data_type}, Default: ${tableInfo.rows[0].column_default}`);
    } else {
      console.log('   ❌ customization_cost column missing from order_items table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkCurrentState();
