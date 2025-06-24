const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'qrmenu',
  password: '2025',
  port: 5432,
});

async function checkTables() {
  try {
    console.log('=== DATABASE INVESTIGATION ===');

    // Check if tables exist
    console.log('\n1. CHECKING TABLE EXISTENCE:');
    const tableCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('orders', 'order_items', 'desks', 'cart_items')
      ORDER BY table_name;
    `);
    console.log('Existing tables:', tableCheck.rows.map(r => r.table_name));

    // Check orders table structure and content
    console.log('\n2. ORDERS TABLE:');
    try {
      const ordersCount = await pool.query('SELECT COUNT(*) as count FROM orders');
      console.log(`Total orders: ${ordersCount.rows[0].count}`);

      if (ordersCount.rows[0].count > 0) {
        const orders = await pool.query('SELECT id, table_number, session_id, status, created_at, customer_name FROM orders ORDER BY created_at DESC LIMIT 10');
        orders.rows.forEach(order => {
          console.log(`  Order ${order.id}: Table="${order.table_number}", Session="${order.session_id}", Status="${order.status}", Customer="${order.customer_name}"`);
        });
      } else {
        console.log('  No orders found in database!');
      }
    } catch (err) {
      console.log('  Error accessing orders table:', err.message);
    }

    // Check order_items table
    console.log('\n3. ORDER_ITEMS TABLE:');
    try {
      const orderItemsCount = await pool.query('SELECT COUNT(*) as count FROM order_items');
      console.log(`Total order items: ${orderItemsCount.rows[0].count}`);

      if (orderItemsCount.rows[0].count > 0) {
        const orderItems = await pool.query('SELECT id, order_id, menu_item_id, quantity, price FROM order_items ORDER BY id DESC LIMIT 10');
        orderItems.rows.forEach(item => {
          console.log(`  Item ${item.id}: Order=${item.order_id}, MenuItem=${item.menu_item_id}, Qty=${item.quantity}, Price=${item.price}`);
        });
      } else {
        console.log('  No order items found in database!');
      }
    } catch (err) {
      console.log('  Error accessing order_items table:', err.message);
    }

    // Check cart_items table
    console.log('\n4. CART_ITEMS TABLE:');
    try {
      const cartItemsCount = await pool.query('SELECT COUNT(*) as count FROM cart_items');
      console.log(`Total cart items: ${cartItemsCount.rows[0].count}`);

      if (cartItemsCount.rows[0].count > 0) {
        const cartItems = await pool.query('SELECT id, session_id, menu_item_id, quantity FROM cart_items ORDER BY created_at DESC LIMIT 10');
        cartItems.rows.forEach(item => {
          console.log(`  Cart ${item.id}: Session="${item.session_id}", MenuItem=${item.menu_item_id}, Qty=${item.quantity}`);
        });
      } else {
        console.log('  No cart items found in database!');
      }
    } catch (err) {
      console.log('  Error accessing cart_items table:', err.message);
    }

    // Check desks table
    console.log('\n5. DESKS TABLE:');
    const desks = await pool.query('SELECT id, name, status, capacity FROM desks ORDER BY id');
    console.log(`Total desks: ${desks.rows.length}`);
    desks.rows.slice(0, 5).forEach(desk => {
      console.log(`  Desk ${desk.id}: Name="${desk.name}", Status="${desk.status}", Capacity=${desk.capacity}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkTables();