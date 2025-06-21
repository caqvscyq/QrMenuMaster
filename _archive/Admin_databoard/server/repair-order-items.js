// Repair utility to fix orphaned order items
// Run with Node.js: node repair-order-items.js <mode>
// Modes:
//   check - Only check for issues (default)
//   clean - Delete orphaned order items
//   reset-table <tableNumber> - Reset a specific table status and clear its orders

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });
const { Pool } = pg;

const mode = process.argv[2] || 'check';
const tableNumber = process.argv[3];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeRepair() {
  console.log(`Running repair in ${mode} mode`);
  
  try {
    // 1. Check for orphaned order items (order items with no corresponding order)
    const orphanedItemsResult = await pool.query(`
      SELECT oi.id, oi.order_id, oi.item_name 
      FROM order_items oi
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.id IS NULL
    `);
    
    console.log(`Found ${orphanedItemsResult.rows.length} orphaned order items`);
    
    if (orphanedItemsResult.rows.length > 0) {
      console.log('Sample of orphaned items:');
      orphanedItemsResult.rows.slice(0, 5).forEach(item => {
        console.log(`  - Item #${item.id}: Order #${item.order_id}, ${item.item_name}`);
      });
      
      if (mode === 'clean') {
        // Delete orphaned order items
        const deleteResult = await pool.query(`
          DELETE FROM order_items
          WHERE id IN (
            SELECT oi.id
            FROM order_items oi
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.id IS NULL
          )
          RETURNING id
        `);
        
        console.log(`✅ Deleted ${deleteResult.rows.length} orphaned order items`);
      } else {
        console.log(`ℹ️ Run with 'clean' mode to delete these orphaned items`);
      }
    }
    
    // 2. Check for tables with inconsistent status
    const inconsistentTablesResult = await pool.query(`
      SELECT d.id, d.number, d.name, d.is_occupied
      FROM desks d
      LEFT JOIN (
        SELECT desk_id, COUNT(*) as order_count
        FROM orders
        WHERE paid = false AND status IN ('pending', 'preparing', 'ready')
        GROUP BY desk_id
      ) o ON d.id = o.desk_id
      WHERE 
        (d.is_occupied = true AND o.order_count IS NULL) OR
        (d.is_occupied = false AND o.order_count > 0)
    `);
    
    console.log(`\nFound ${inconsistentTablesResult.rows.length} tables with inconsistent status`);
    
    if (inconsistentTablesResult.rows.length > 0) {
      console.log('Tables with issues:');
      inconsistentTablesResult.rows.forEach(desk => {
        console.log(`  - Table ${desk.number} (${desk.name}): Marked as ${desk.is_occupied ? 'occupied' : 'available'} but has ${desk.is_occupied ? 'no' : ''} orders`);
      });
    }
    
    // 3. Reset specific table if requested
    if (mode === 'reset-table' && tableNumber) {
      // Find the desk ID for this table number
      const deskResult = await pool.query(`
        SELECT id, number, name FROM desks WHERE number = $1
      `, [tableNumber]);
      
      if (deskResult.rows.length === 0) {
        console.log(`❌ Could not find table with number ${tableNumber}`);
        return;
      }
      
      const desk = deskResult.rows[0];
      console.log(`Found table ${desk.number} (${desk.name}) with ID ${desk.id}`);
      
      // Begin transaction
      await pool.query('BEGIN');
      
      try {
        // 1. Delete all order items for this desk's orders
        const deleteItemsResult = await pool.query(`
          DELETE FROM order_items
          WHERE order_id IN (
            SELECT id FROM orders WHERE desk_id = $1 OR table_number = $2
          )
          RETURNING id
        `, [desk.id, desk.number]);
        
        console.log(`Deleted ${deleteItemsResult.rows.length} order items`);
        
        // 2. Delete all orders for this desk
        const deleteOrdersResult = await pool.query(`
          DELETE FROM orders
          WHERE desk_id = $1 OR table_number = $2
          RETURNING id
        `, [desk.id, desk.number]);
        
        console.log(`Deleted ${deleteOrdersResult.rows.length} orders`);
        
        // 3. Reset desk status to available
        await pool.query(`
          UPDATE desks
          SET is_occupied = false
          WHERE id = $1
        `, [desk.id]);
        
        console.log(`Reset table ${desk.number} status to available`);
        
        // Commit transaction
        await pool.query('COMMIT');
        console.log(`✅ Successfully reset table ${desk.number}`);
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error during table reset:', error);
      }
    }
    
  } catch (error) {
    console.error('Error during repair:', error);
  } finally {
    await pool.end();
  }
}

if (mode === 'reset-table' && !tableNumber) {
  console.log('Error: You must provide a table number when using reset-table mode');
  console.log('Usage: node repair-order-items.js reset-table <tableNumber>');
  process.exit(1);
}

// Display instructions
console.log('Order Items Repair Utility');
console.log('========================');
console.log('Available modes:');
console.log('  check            - Only check for issues (default)');
console.log('  clean            - Delete orphaned order items');
console.log('  reset-table <n>  - Reset a specific table status and clear its orders');
console.log();

executeRepair().catch(console.error); 