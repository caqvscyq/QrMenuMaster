#!/usr/bin/env node

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/qrmenu',
});

async function checkExistingOrders() {
  try {
    console.log('🔍 Checking Existing Orders vs New Fixed Order\n');
    
    const result = await pool.query(`
      SELECT o.id, o.total, o.created_at, oi.item_name, oi.price, oi.customizations
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.item_name = '紅燒牛肉麵'
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
    
    console.log('📋 Recent 紅燒牛肉麵 Orders:');
    result.rows.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ID: ${order.id}`);
      console.log(`   Created: ${order.created_at}`);
      console.log(`   Item Price: $${order.price}`);
      console.log(`   Order Total: $${order.total}`);
      console.log(`   Has Customizations: ${order.customizations ? 'Yes' : 'No'}`);
      
      if (order.customizations) {
        console.log(`   Customizations: ${JSON.stringify(order.customizations)}`);
      }
      
      // Check if this looks like the fixed pricing
      const itemPrice = parseFloat(order.price);
      if (itemPrice > 300) {
        console.log(`   ✅ This appears to include customization pricing!`);
      } else if (itemPrice === 280) {
        console.log(`   ⚠️  This shows base price only (old bug)`);
      }
    });
    
    console.log('\n🎯 Summary:');
    console.log('   - Orders with $280 price = Old bug (base price only)');
    console.log('   - Orders with $370+ price = Fixed pricing (base + customizations)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkExistingOrders();
