// Reset script to clear existing orders and recreate sample data
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { orders, orderItems } = require('./shared/schema');

async function resetData() {
  console.log('Connecting to database...');
  
  const sql = postgres('postgresql://postgres:2025@localhost:5432/qrmenu');
  const db = drizzle(sql);
  
  try {
    console.log('Clearing existing orders and order items...');
    
    // Clear order items first (foreign key constraint)
    await db.delete(orderItems);
    console.log('✓ Cleared order items');
    
    // Clear orders
    await db.delete(orders);
    console.log('✓ Cleared orders');
    
    console.log('✅ Data reset complete! Restart the server to recreate sample data.');
    
  } catch (error) {
    console.error('❌ Error resetting data:', error);
  } finally {
    await sql.end();
  }
}

resetData(); 