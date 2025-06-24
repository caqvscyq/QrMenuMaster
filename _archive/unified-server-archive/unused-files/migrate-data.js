const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting data migration and integrity check...\n');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. Ensure shop exists and get shop ID
    console.log('📋 Step 1: Ensuring shop exists...');
    let shopResult = await client.query('SELECT id FROM shops LIMIT 1');
    let shopId;
    
    if (shopResult.rows.length === 0) {
      console.log('  Creating default shop...');
      const newShop = await client.query(`
        INSERT INTO shops (name, address, phone) 
        VALUES ('QR Menu Restaurant', '123 Main St', '+1-555-0123') 
        RETURNING id
      `);
      shopId = newShop.rows[0].id;
      console.log(`  ✅ Created shop with ID: ${shopId}`);
    } else {
      shopId = shopResult.rows[0].id;
      console.log(`  ✅ Using existing shop with ID: ${shopId}`);
    }
    
    // 2. Update users to have shopId if missing
    console.log('\n📋 Step 2: Updating users with shop association...');
    const usersWithoutShop = await client.query('SELECT COUNT(*) FROM users WHERE shop_id IS NULL');
    if (parseInt(usersWithoutShop.rows[0].count) > 0) {
      await client.query('UPDATE users SET shop_id = $1 WHERE shop_id IS NULL', [shopId]);
      console.log(`  ✅ Updated ${usersWithoutShop.rows[0].count} users with shop association`);
    } else {
      console.log('  ✅ All users already have shop association');
    }
    
    // 3. Ensure admin user exists
    console.log('\n📋 Step 3: Ensuring admin user exists...');
    const adminCheck = await client.query(`
      SELECT id FROM users WHERE role = 'admin' AND shop_id = $1 LIMIT 1
    `, [shopId]);
    
    if (adminCheck.rows.length === 0) {
      console.log('  Creating admin user...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await client.query(`
        INSERT INTO users (shop_id, username, password, role, email) 
        VALUES ($1, 'admin', $2, 'admin', 'admin@restaurant.com') 
        RETURNING id
      `, [shopId, hashedPassword]);
      
      console.log(`  ✅ Created admin user with ID: ${adminUser.rows[0].id}`);
    } else {
      console.log('  ✅ Admin user already exists');
    }
    
    // 4. Update categories to have shopId if missing
    console.log('\n📋 Step 4: Updating categories with shop association...');
    const categoriesWithoutShop = await client.query('SELECT COUNT(*) FROM categories WHERE shop_id IS NULL');
    if (parseInt(categoriesWithoutShop.rows[0].count) > 0) {
      await client.query('UPDATE categories SET shop_id = $1 WHERE shop_id IS NULL', [shopId]);
      console.log(`  ✅ Updated ${categoriesWithoutShop.rows[0].count} categories with shop association`);
    } else {
      console.log('  ✅ All categories already have shop association');
    }
    
    // 5. Update menu items to have shopId if missing
    console.log('\n📋 Step 5: Updating menu items with shop association...');
    const menuItemsWithoutShop = await client.query('SELECT COUNT(*) FROM menu_items WHERE shop_id IS NULL');
    if (parseInt(menuItemsWithoutShop.rows[0].count) > 0) {
      await client.query('UPDATE menu_items SET shop_id = $1 WHERE shop_id IS NULL', [shopId]);
      console.log(`  ✅ Updated ${menuItemsWithoutShop.rows[0].count} menu items with shop association`);
    } else {
      console.log('  ✅ All menu items already have shop association');
    }
    
    // 6. Update orders to have shopId if missing
    console.log('\n📋 Step 6: Updating orders with shop association...');
    const ordersWithoutShop = await client.query('SELECT COUNT(*) FROM orders WHERE shop_id IS NULL');
    if (parseInt(ordersWithoutShop.rows[0].count) > 0) {
      await client.query('UPDATE orders SET shop_id = $1 WHERE shop_id IS NULL', [shopId]);
      console.log(`  ✅ Updated ${ordersWithoutShop.rows[0].count} orders with shop association`);
    } else {
      console.log('  ✅ All orders already have shop association');
    }
    
    // 7. Create sample desks if none exist
    console.log('\n📋 Step 7: Ensuring desks exist...');
    const deskCount = await client.query('SELECT COUNT(*) FROM desks WHERE shop_id = $1', [shopId]);
    if (parseInt(deskCount.rows[0].count) === 0) {
      console.log('  Creating sample desks...');
      const desks = [
        { name: 'Table 1', capacity: 4 },
        { name: 'Table 2', capacity: 4 },
        { name: 'Table 3', capacity: 6 },
        { name: 'Table 4', capacity: 2 },
        { name: 'Table 5', capacity: 8 }
      ];
      
      for (const desk of desks) {
        await client.query(`
          INSERT INTO desks (shop_id, name, capacity, status) 
          VALUES ($1, $2, $3, 'available')
        `, [shopId, desk.name, desk.capacity]);
      }
      console.log(`  ✅ Created ${desks.length} sample desks`);
    } else {
      console.log(`  ✅ Found ${deskCount.rows[0].count} existing desks`);
    }
    
    // 8. Data integrity check
    console.log('\n📋 Step 8: Running data integrity checks...');
    
    // Check foreign key constraints
    const checks = [
      { table: 'users', field: 'shop_id', ref: 'shops' },
      { table: 'categories', field: 'shop_id', ref: 'shops' },
      { table: 'menu_items', field: 'shop_id', ref: 'shops' },
      { table: 'menu_items', field: 'category_id', ref: 'categories' },
      { table: 'orders', field: 'shop_id', ref: 'shops' },
      { table: 'desks', field: 'shop_id', ref: 'shops' }
    ];
    
    for (const check of checks) {
      const result = await client.query(`
        SELECT COUNT(*) as orphaned FROM ${check.table} t
        LEFT JOIN ${check.ref} r ON t.${check.field} = r.id
        WHERE t.${check.field} IS NOT NULL AND r.id IS NULL
      `);
      
      if (parseInt(result.rows[0].orphaned) > 0) {
        console.log(`  ⚠️  Found ${result.rows[0].orphaned} orphaned records in ${check.table}.${check.field}`);
      } else {
        console.log(`  ✅ ${check.table}.${check.field} integrity OK`);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n🎉 Migration completed successfully!');
    
    // Final summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM shops) as shops,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM menu_items) as menu_items,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM desks) as desks
    `);
    
    console.log('\n📊 Final Database Summary:');
    console.log(`  Shops: ${summary.rows[0].shops}`);
    console.log(`  Users: ${summary.rows[0].users}`);
    console.log(`  Categories: ${summary.rows[0].categories}`);
    console.log(`  Menu Items: ${summary.rows[0].menu_items}`);
    console.log(`  Orders: ${summary.rows[0].orders}`);
    console.log(`  Desks: ${summary.rows[0].desks}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData().catch(console.error);
}

module.exports = { migrateData };
