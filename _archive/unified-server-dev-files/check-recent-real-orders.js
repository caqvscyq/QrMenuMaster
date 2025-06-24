#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function testRealOrder() {
  try {
    console.log('🔍 Checking for recent orders with customization cost...\n');
    
    // Check the most recent orders
    const result = await pool.query(`
      SELECT 
        o.id,
        o.created_at,
        o.table_number,
        oi.item_name,
        oi.price,
        oi.customization_cost,
        oi.customizations
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.created_at > NOW() - INTERVAL '1 hour'
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No recent orders found in the last hour');
      console.log('   Please create an order through the frontend first');
      return;
    }
    
    console.log('📋 Recent orders (last hour):');
    result.rows.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ID: ${order.id}`);
      console.log(`   Created: ${order.created_at}`);
      console.log(`   Table: ${order.table_number}`);
      console.log(`   Item: ${order.item_name}`);
      console.log(`   Price: $${order.price}`);
      console.log(`   Customization Cost: $${order.customization_cost || '0.00'}`);
      
      if (order.customizations && Object.keys(order.customizations).length > 0) {
        console.log(`   Customizations: ${JSON.stringify(order.customizations)}`);
      }
      
      if (parseFloat(order.customization_cost || '0') > 0) {
        console.log(`   ✅ HAS customization cost tracking!`);
      } else if (order.customizations && Object.keys(order.customizations).length > 0) {
        console.log(`   ⚠️  Has customizations but no cost tracking`);
      } else {
        console.log(`   ℹ️  No customizations`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testRealOrder();
