import { db } from '../config/database';
import { logger } from '../config/logger';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import bcrypt from 'bcrypt';

// Check if database has been initialized
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // Check if shops table exists and has data
    const shopsResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_name = 'shops' AND table_schema = 'public'
    `);

    if (shopsResult.rows[0].count === '0') {
      return false;
    }

    // Check if shops table has data
    const shopsData = await db.select().from(schema.shops).limit(1);
    return shopsData.length > 0;
  } catch (error) {
    logger.debug('Database initialization check failed:', error);
    return false;
  }
}

// Initialize database schema without clearing data
export async function initializeDatabase() {
  try {
    logger.info('Initializing database schema...');

    // Create sessions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        table_number TEXT NOT NULL,
        desk_id INTEGER REFERENCES desks(id),
        shop_id INTEGER REFERENCES shops(id) NOT NULL DEFAULT 1,
        status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired', 'completed')),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_activity TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        metadata JSON DEFAULT '{}'
      );
    `);

    // Create indexes for sessions table
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sessions_table_number ON sessions(table_number);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sessions_shop_id ON sessions(shop_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);`);

    logger.info('Database schema initialized successfully!');
  } catch (error) {
    logger.error("Failed to initialize database schema:", error);
    throw error;
  }
}

// Seed database with initial data (destructive operation)
export async function seedDatabase() {
  try {
    logger.info('Seeding database with initial data...');

    // Initialize schema first
    await initializeDatabase();

    // Clear existing data
    logger.warn('Clearing existing data for fresh seed...');
    await db.execute(sql`DELETE FROM sessions;`);
    await db.delete(schema.orderItems);
    await db.delete(schema.orders);
    await db.delete(schema.cartItems);
    await db.delete(schema.menuItems);
    await db.delete(schema.categories);
    await db.delete(schema.shopAdmins);
    await db.delete(schema.users);
    await db.delete(schema.desks);
    await db.delete(schema.shops);

    // Reset sequences for all tables
    await db.execute(sql`ALTER SEQUENCE categories_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE menu_items_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE orders_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE order_items_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE desks_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE shops_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE shop_admins_id_seq RESTART WITH 1;`);


    // Seed Shops
    const returnedShops = await db.insert(schema.shops).values([
      { name: 'Afly Restaurant' }
    ]).returning();
    const shopId = returnedShops[0].id;

    // Seed Categories
    const returnedCategories = await db.insert(schema.categories).values([
      { name: '麵食類', shopId },
      { name: '飯類', shopId },
      { name: '開胃菜', shopId },
      { name: '飲料', shopId },
    ]).returning();

    const categoryMap = returnedCategories.reduce((acc, category) => {
      acc[category.name] = category.id;
      return acc;
    }, {} as Record<string, number>);

    // Seed Menu Items
    const menuItemsData: (Omit<schema.InsertMenuItem, 'categoryId' | 'shopId'> & {categoryName: string})[] = [
        {
          name: "紅燒牛肉麵",
          description: "精選牛腱肉，搭配濃郁湯頭",
          price: "280.00",
          categoryName: '麵食類',
          imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.8",
          reviewCount: 156,
          isPopular: true,
          isAvailable: true,
          status: 'available',
        },
        {
          name: "招牌炒飯",
          description: "蛋香四溢，配菜豐富",
          price: "180.00",
          categoryName: '飯類',
          imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.6",
          reviewCount: 89,
          isPopular: true,
          isAvailable: true,
          status: 'available',
        },
        {
          name: "鹽酥雞",
          description: "酥脆外皮，多汁內餡",
          price: "120.00",
          categoryName: '開胃菜',
          imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.7",
          reviewCount: 234,
          isPopular: true,
          isAvailable: true,
          status: 'available',
        },
        {
          name: "擔仔麵",
          description: "台南傳統小吃，鮮美湯頭",
          price: "150.00",
          categoryName: '麵食類',
          imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.5",
          reviewCount: 67,
          isPopular: false,
          isAvailable: true,
          status: 'available',
        },
        {
          name: "麻辣牛肉麵",
          description: "香辣過癮，牛肉軟嫩",
          price: "320.00",
          categoryName: '麵食類',
          imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.9",
          reviewCount: 198,
          isPopular: false,
          isAvailable: true,
          status: 'available',
        },
        {
          name: "珍珠奶茶",
          description: "Q彈珍珠，香濃奶茶",
          price: "65.00",
          categoryName: '飲料',
          imageUrl: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.4",
          reviewCount: 145,
          isPopular: false,
          isAvailable: true,
          status: 'available',
        },
        {
          name: "冬瓜茶",
          description: "清香甘甜，消暑解膩",
          price: "45.00",
          categoryName: '飲料',
          imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.3",
          reviewCount: 78,
          isPopular: false,
          isAvailable: true,
          status: 'available',
        },
        {
          name: "清燉牛肉麵",
          description: "清淡湯頭，牛肉鮮美",
          price: "260.00",
          categoryName: '麵食類',
          imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.6",
          reviewCount: 92,
          isPopular: false,
          isAvailable: true,
          status: 'available',
        },
        {
          name: "餛飩麵",
          description: "手工餛飩，鮮美湯頭",
          price: "180.00",
          categoryName: '麵食類',
          imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.4",
          reviewCount: 73,
          isPopular: false,
          isAvailable: true,
          status: 'available',
        },
        {
          name: "乾拌麵",
          description: "香濃肉燥，口感豐富",
          price: "160.00",
          categoryName: '麵食類',
          imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
          rating: "4.2",
          reviewCount: 54,
          isPopular: false,
          isAvailable: true,
          status: 'available',
        },
    ];

    const menuItemsToInsert = menuItemsData.map(item => {
      const { categoryName, ...rest } = item;
      return {
        ...rest,
        shopId: shopId,
        categoryId: categoryMap[categoryName],
      }
    });

    await db.insert(schema.menuItems).values(menuItemsToInsert);

    // Seed Desks
    const desksData = [];
    for (let i = 1; i <= 10; i++) {
      desksData.push({
        shopId: shopId,
        name: i.toString(),
        status: 'available' as const,
        capacity: 4
      });
    }
    await db.insert(schema.desks).values(desksData);

    // Seed Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.insert(schema.users).values([
      {
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        shopId: shopId,
        email: 'admin@restaurant.com'
      }
    ]);

    logger.info('Database seeded successfully!');
  } catch (error) {
    logger.error("Failed to seed database:", error);
    throw error;
  }
}

// Smart initialization - only seed if database is empty
export async function seed() {
  try {
    const isInitialized = await isDatabaseInitialized();

    if (!isInitialized) {
      logger.info('Database not initialized. Running full seed...');
      await seedDatabase();
    } else {
      logger.info('Database already initialized. Skipping seed to preserve data.');
      logger.info('To force reseed, use: npm run seed:force');

      // Still ensure schema is up to date
      await initializeDatabase();
    }
  } catch (error) {
    logger.error("Failed to initialize/seed database:", error);
    process.exit(1);
  }
}