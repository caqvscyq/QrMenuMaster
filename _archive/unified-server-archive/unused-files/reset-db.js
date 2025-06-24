require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:2025@localhost:5432/qrmenu'
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database reset...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Drop tables in the correct order (respecting foreign key constraints)
    console.log('Dropping tables...');
    await client.query('DROP TABLE IF EXISTS order_items CASCADE');
    await client.query('DROP TABLE IF EXISTS cart_items CASCADE');
    await client.query('DROP TABLE IF EXISTS orders CASCADE');
    await client.query('DROP TABLE IF EXISTS desks CASCADE');
    await client.query('DROP TABLE IF EXISTS menu_items CASCADE');
    await client.query('DROP TABLE IF EXISTS categories CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    await client.query('DROP TABLE IF EXISTS shop_admins CASCADE');
    await client.query('DROP TABLE IF EXISTS shops CASCADE');
    
    // Create tables
    console.log('Creating tables...');
    
    // Create enum type for user roles
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'staff', 'manager', 'customer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Create shops table
    await client.query(`
      CREATE TABLE shops (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        address TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER REFERENCES shops(id),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'customer',
        email TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create desks table
    await client.query(`
      CREATE TABLE desks (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER REFERENCES shops(id) NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'available' NOT NULL,
        capacity INTEGER DEFAULT 4,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Create categories table
    await client.query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        shop_id INTEGER REFERENCES shops(id) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Create menu_items table
    await client.query(`
      CREATE TABLE menu_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        shop_id INTEGER REFERENCES shops(id) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        image_url TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        rating DECIMAL(3,1) NOT NULL DEFAULT 0.0,
        review_count INTEGER NOT NULL DEFAULT 0,
        is_popular BOOLEAN NOT NULL DEFAULT FALSE,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create cart_items table
    await client.query(`
      CREATE TABLE cart_items (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        menu_item_id INTEGER REFERENCES menu_items(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create orders table
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER REFERENCES shops(id) NOT NULL,
        customer_id INTEGER REFERENCES users(id),
        desk_id INTEGER REFERENCES desks(id),
        session_id TEXT,
        table_number TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        subtotal DECIMAL(10,2) NOT NULL,
        service_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total DECIMAL(10,2) NOT NULL,
        paid BOOLEAN DEFAULT FALSE NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create order_items table
    await client.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) NOT NULL,
        menu_item_id INTEGER REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        item_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create shop_admins table
    await client.query(`
      CREATE TABLE shop_admins (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER REFERENCES shops(id),
        user_id INTEGER REFERENCES users(id),
        role TEXT NOT NULL DEFAULT 'manager',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Seed data
    console.log('Seeding data...');
    
    // Create default shop
    const shopResult = await client.query(`
      INSERT INTO shops (name) VALUES ('My Restaurant') RETURNING id
    `);
    const shopId = shopResult.rows[0].id;
    
    // Create default admin user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (username, password, role, email, phone, shop_id)
      VALUES ('admin', $1, 'admin', 'admin@example.com', '+1234567890', $2)
    `, [hashedPassword, shopId]);
    
    // Create categories
    const categoriesResult = await client.query(`
      INSERT INTO categories (name, shop_id)
      VALUES 
        ('Appetizers', $1),
        ('Main Courses', $1),
        ('Desserts', $1),
        ('Beverages', $1)
      RETURNING id, name
    `, [shopId]);
    
    const categories = categoriesResult.rows;
    
    // Create menu items
    const appetizerId = categories.find(c => c.name === 'Appetizers')?.id;
    const mainCourseId = categories.find(c => c.name === 'Main Courses')?.id;
    const dessertId = categories.find(c => c.name === 'Desserts')?.id;
    const beverageId = categories.find(c => c.name === 'Beverages')?.id;
    
    if (appetizerId) {
      await client.query(`
        INSERT INTO menu_items (name, price, category_id, shop_id)
        VALUES 
          ('Spring Rolls', 5.99, $1, $2),
          ('Garlic Bread', 4.50, $1, $2)
      `, [appetizerId, shopId]);
    }
    
    if (mainCourseId) {
      await client.query(`
        INSERT INTO menu_items (name, price, category_id, shop_id)
        VALUES 
          ('Spaghetti Carbonara', 12.99, $1, $2),
          ('Margherita Pizza', 10.50, $1, $2)
      `, [mainCourseId, shopId]);
    }
    
    if (dessertId) {
      await client.query(`
        INSERT INTO menu_items (name, price, category_id, shop_id)
        VALUES ('Chocolate Cake', 6.50, $1, $2)
      `, [dessertId, shopId]);
    }
    
    if (beverageId) {
      await client.query(`
        INSERT INTO menu_items (name, price, category_id, shop_id)
        VALUES 
          ('Coca-cola', 2.50, $1, $2),
          ('Orange Juice', 3.00, $1, $2)
      `, [beverageId, shopId]);
    }
    
    // Create desks
    await client.query(`
      INSERT INTO desks (name, capacity, shop_id, status)
      VALUES 
        ('Table 1', 4, $1, 'available'),
        ('Table 2', 2, $1, 'available'),
        ('Table 3', 6, $1, 'occupied'),
        ('Bar Seat 1', 1, $1, 'available')
    `, [shopId]);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Database reset and seed completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resetting database:', error);
  } finally {
    client.release();
    pool.end();
  }
}

resetDatabase(); 