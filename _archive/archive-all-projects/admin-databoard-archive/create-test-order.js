import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2025@localhost:5432/qrmenu',
});

async function createTestOrder() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Creating test orders for both shops...');
    
    // Create orders for both shop IDs (1 and 2)
    for (const shopId of [1, 2]) {
      // Check if shop exists
      const shopResult = await client.query('SELECT id FROM shops WHERE id = $1', [shopId]);
      if (shopResult.rows.length === 0) {
        console.error(`Shop with ID ${shopId} not found. Skipping...`);
        continue;
      }
      
      console.log(`Creating orders for shop ID ${shopId}`);
      
      // Get menu items for this shop
      const menuItemsResult = await client.query('SELECT id, name, price FROM menu_items WHERE shop_id = $1 LIMIT 3', [shopId]);
      
      if (menuItemsResult.rows.length === 0) {
        console.error(`No menu items found for shop ID ${shopId}. Skipping...`);
        continue;
      }

      // Array of order statuses to create
      const orderStatuses = ['pending', 'preparing', 'ready', 'completed'];
      
      // Create orders with different statuses
      for (const status of orderStatuses) {
        const orderResult = await client.query(
          `INSERT INTO orders 
           (shop_id, status, subtotal, service_fee, total, paid, customer_name, customer_phone, table_number, notes, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
           RETURNING id`,
          [shopId, status, '150.00', '0.00', '150.00', status === 'completed', `Customer for ${status}`, '+1987654321', `Table-${status}`, `Test order with ${status} status for shop ${shopId}` ]
        );
        
        const orderId = orderResult.rows[0].id;
        console.log(`Created ${status} order with ID ${orderId} for shop ${shopId}`);
        
        // Add order items
        for (const menuItem of menuItemsResult.rows) {
          await client.query(
            `INSERT INTO order_items 
             (order_id, menu_item_id, quantity, price, item_name) 
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, menuItem.id, 1, menuItem.price, menuItem.name]
          );
          console.log(`Added item ${menuItem.name} to ${status} order for shop ${shopId}`);
        }
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Test orders created successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating test orders:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestOrder(); 