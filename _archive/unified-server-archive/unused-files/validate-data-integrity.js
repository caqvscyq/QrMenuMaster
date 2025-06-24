const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function validateDataIntegrity() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Starting comprehensive data integrity validation...\n');
    
    // 1. Database Structure Validation
    console.log('📋 Step 1: Database Structure Validation');
    
    const expectedTables = [
      'shops', 'users', 'categories', 'menu_items', 
      'cart_items', 'orders', 'order_items', 'desks', 'shop_admins'
    ];
    
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    
    const actualTables = tablesResult.rows.map(row => row.table_name);
    
    for (const table of expectedTables) {
      if (actualTables.includes(table)) {
        console.log(`  ✅ Table '${table}' exists`);
      } else {
        console.log(`  ❌ Table '${table}' missing`);
      }
    }
    
    // 2. Data Consistency Validation
    console.log('\n📋 Step 2: Data Consistency Validation');
    
    // Check shop data
    const shopResult = await client.query('SELECT COUNT(*) as count FROM shops');
    console.log(`  ✅ Shops: ${shopResult.rows[0].count} records`);
    
    // Check user data
    const userResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`  ✅ Users: ${userResult.rows[0].count} records`);
    
    // Check admin user exists
    const adminResult = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin'
    `);
    console.log(`  ✅ Admin users: ${adminResult.rows[0].count} records`);
    
    // Check categories
    const categoryResult = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log(`  ✅ Categories: ${categoryResult.rows[0].count} records`);
    
    // Check menu items
    const menuResult = await client.query('SELECT COUNT(*) as count FROM menu_items');
    console.log(`  ✅ Menu items: ${menuResult.rows[0].count} records`);
    
    // Check desks
    const deskResult = await client.query('SELECT COUNT(*) as count FROM desks');
    console.log(`  ✅ Desks: ${deskResult.rows[0].count} records`);
    
    // 3. Foreign Key Integrity
    console.log('\n📋 Step 3: Foreign Key Integrity Validation');
    
    const fkChecks = [
      {
        name: 'Users -> Shops',
        query: `SELECT COUNT(*) as count FROM users u 
                LEFT JOIN shops s ON u.shop_id = s.id 
                WHERE u.shop_id IS NOT NULL AND s.id IS NULL`
      },
      {
        name: 'Categories -> Shops',
        query: `SELECT COUNT(*) as count FROM categories c 
                LEFT JOIN shops s ON c.shop_id = s.id 
                WHERE c.shop_id IS NOT NULL AND s.id IS NULL`
      },
      {
        name: 'Menu Items -> Shops',
        query: `SELECT COUNT(*) as count FROM menu_items m 
                LEFT JOIN shops s ON m.shop_id = s.id 
                WHERE m.shop_id IS NOT NULL AND s.id IS NULL`
      },
      {
        name: 'Menu Items -> Categories',
        query: `SELECT COUNT(*) as count FROM menu_items m 
                LEFT JOIN categories c ON m.category_id = c.id 
                WHERE m.category_id IS NOT NULL AND c.id IS NULL`
      },
      {
        name: 'Orders -> Shops',
        query: `SELECT COUNT(*) as count FROM orders o 
                LEFT JOIN shops s ON o.shop_id = s.id 
                WHERE o.shop_id IS NOT NULL AND s.id IS NULL`
      },
      {
        name: 'Desks -> Shops',
        query: `SELECT COUNT(*) as count FROM desks d 
                LEFT JOIN shops s ON d.shop_id = s.id 
                WHERE d.shop_id IS NOT NULL AND s.id IS NULL`
      }
    ];
    
    for (const check of fkChecks) {
      const result = await client.query(check.query);
      const orphanedCount = parseInt(result.rows[0].count);
      
      if (orphanedCount === 0) {
        console.log(`  ✅ ${check.name}: No orphaned records`);
      } else {
        console.log(`  ❌ ${check.name}: ${orphanedCount} orphaned records`);
      }
    }
    
    // 4. API Endpoint Validation
    console.log('\n📋 Step 4: API Endpoint Validation');
    
    try {
      // Test customer endpoints
      const menuResponse = await axios.get('http://localhost:5000/api/customer/menu');
      console.log(`  ✅ Customer menu API: ${menuResponse.data.length} items returned`);
      
      // Test admin login
      const loginResponse = await axios.post('http://localhost:5000/api/admin/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      const token = loginResponse.data.token;
      console.log('  ✅ Admin login API: Authentication successful');
      
      // Test admin endpoints
      const adminCategoriesResponse = await axios.get('http://localhost:5000/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`  ✅ Admin categories API: ${adminCategoriesResponse.data.length} categories returned`);
      
      const adminMenuResponse = await axios.get('http://localhost:5000/api/admin/menu-items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`  ✅ Admin menu items API: ${adminMenuResponse.data.length} items returned`);
      
      const adminDesksResponse = await axios.get('http://localhost:5000/api/admin/desks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`  ✅ Admin desks API: ${adminDesksResponse.data.length} desks returned`);
      
    } catch (apiError) {
      console.log(`  ❌ API validation failed: ${apiError.message}`);
    }
    
    // 5. Data Sample Validation
    console.log('\n📋 Step 5: Data Sample Validation');
    
    // Check if we have sample data
    const sampleChecks = [
      {
        name: 'Sample Categories',
        query: 'SELECT name FROM categories LIMIT 3',
        field: 'name'
      },
      {
        name: 'Sample Menu Items',
        query: 'SELECT name FROM menu_items LIMIT 3',
        field: 'name'
      },
      {
        name: 'Sample Desks',
        query: 'SELECT name FROM desks LIMIT 3',
        field: 'name'
      }
    ];
    
    for (const check of sampleChecks) {
      const result = await client.query(check.query);
      if (result.rows.length > 0) {
        const samples = result.rows.map(row => row[check.field]).join(', ');
        console.log(`  ✅ ${check.name}: ${samples}`);
      } else {
        console.log(`  ⚠️  ${check.name}: No sample data found`);
      }
    }
    
    console.log('\n🎉 Data integrity validation completed!');
    
    // Final summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM shops) as shops,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM menu_items) as menu_items,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM desks) as desks,
        (SELECT COUNT(*) FROM cart_items) as cart_items,
        (SELECT COUNT(*) FROM order_items) as order_items
    `);
    
    console.log('\n📊 Final Data Summary:');
    const data = summary.rows[0];
    Object.entries(data).forEach(([key, value]) => {
      console.log(`  ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
    });
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Run validation if called directly
if (require.main === module) {
  validateDataIntegrity().catch(console.error);
}

module.exports = { validateDataIntegrity };
