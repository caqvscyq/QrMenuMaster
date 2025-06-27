import { db } from '../config/database';
import { logger } from '../config/logger';
import {
  users, shops, categories, menuItems, cartItems, orders, orderItems, desks, shopAdmins, sessions,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type MenuItem, type InsertMenuItem,
  type CartItem, type InsertCartItem,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Desk, type InsertDesk,
  type Session, type InsertSession,
  type MenuItemWithCategory,
  type OrderWithItems,
  type DeskWithStatus
} from '../shared/schema';
import { eq, and, gte, like, or, desc, inArray, not, isNull, sql, SQL } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { cacheSet, cacheGet, cacheDelete } from '../config/redis';
import { calculateCustomizationPrice, calculateItemTotalPrice } from '../utils/customization-calculator';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  getUsers(shopId: number): Promise<User[]>;
  
  // Category methods
  getCategories(shopId: number): Promise<Category[]>;
  getCategory(id: number, shopId: number): Promise<Category | undefined>;
  createCategory(categoryData: InsertCategory): Promise<Category>;
  updateCategory(id: number, shopId: number, updateData: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number, shopId: number): Promise<boolean>;
  
  // Menu Item methods
  getMenuItems(shopId: number, categoryId?: number): Promise<MenuItemWithCategory[]>;
  getMenuItem(id: number, shopId: number): Promise<MenuItemWithCategory | undefined>;
  createMenuItem(menuItemData: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, shopId: number, updateData: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number, shopId: number): Promise<boolean>;
  searchMenuItems(query: string, shopId: number): Promise<MenuItem[]>;
  getPopularMenuItems(shopId: number, limit: number): Promise<any[]>;
  getWeeklyTopSalesItems(shopId: number, limit: number): Promise<any[]>;
  
  // Cart methods
  getCartItems(sessionId: string): Promise<(CartItem & { menuItem: MenuItem })[]>;
  addToCart(cartItem: InsertCartItem): Promise<void>;
  updateCartItemQuantity(sessionId: string, menuItemId: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(sessionId: string, menuItemId: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<void>;
  
  // Order methods
  getOrders(shopId: number, status?: string): Promise<OrderWithItems[]>;
  getOrder(id: number, shopId: number): Promise<OrderWithItems | undefined>;
  getUserOrders(userId: number, shopId: number): Promise<OrderWithItems[]>;
  getOrdersBySession(sessionId: string): Promise<OrderWithItems[]>;
  createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(id: number, shopId: number, status: string): Promise<Order | undefined>;
  
  // Desk methods
  getDesks(shopId: number): Promise<DeskWithStatus[]>;
  getDesk(id: number, shopId: number): Promise<Desk | undefined>;
  createDesk(deskData: InsertDesk): Promise<Desk>;
  updateDesk(id: number, shopId: number, updateData: Partial<InsertDesk>): Promise<Desk | undefined>;
  deleteDesk(id: number, shopId: number): Promise<boolean>;
  toggleDeskStatus(id: number, shopId: number, newStatus: 'available' | 'occupied'): Promise<Desk | undefined>;
  completeAndPayDeskOrders(deskId: number): Promise<Order[]>;

  // Session methods
  getSessions(shopId: number): Promise<Session[]>;
  deleteSession(sessionId: string): Promise<boolean>;

  // User methods
  getUsers(shopId: number): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>; // Legacy signature
  getUser(id: number, shopId: number): Promise<User | undefined>; // New signature
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, shopId: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number, shopId: number): Promise<boolean>;

  // Stats methods
  getStats(shopId: number): Promise<{
    todayOrders: number;
    revenue: number;
    activeCustomers: number;
    menuItemsCount: number;
  }>;

  // Utility methods
  resetTable(tableNumber: string, shopId: number): Promise<{ success: boolean; message: string }>;

  // Database connection test
  testConnection(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {

  /**
   * Validate session ID format - supports both old and new formats
   * @param sessionId - The session ID to validate
   * @returns true if valid, false otherwise
   */
  private validateSessionId(sessionId: string): boolean {
    if (!sessionId) return false;

    // New format: session-{table}-{timestamp}-{random}
    const newFormatPattern = /^session-[A-Za-z0-9_-]+-\d{13}-[A-Za-z0-9]{6,15}$/;
    // Old format: session-{timestamp}-{random} (for backward compatibility)
    const oldFormatPattern = /^session-\d{13}-[A-Za-z0-9]{6,15}$/;

    const isValid = newFormatPattern.test(sessionId) || oldFormatPattern.test(sessionId);

    if (!isValid) {
      logger.warn(`Invalid session ID format: ${sessionId}`);
    } else if (oldFormatPattern.test(sessionId)) {
      logger.warn(`Using old session ID format: ${sessionId} - consider updating to new format`);
    }

    return isValid;
  }

  private async runCustomizationMigration() {
    try {
      logger.info('Running customization migration...');

      // Add customization options to menu items
      await db.execute(sql`
        ALTER TABLE menu_items
        ADD COLUMN IF NOT EXISTS customization_options JSON DEFAULT '[]'
      `);

      // Add customizations and special instructions to cart items
      await db.execute(sql`
        ALTER TABLE cart_items
        ADD COLUMN IF NOT EXISTS customizations JSON DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS special_instructions TEXT
      `);

      // Add customizations and special instructions to order items
      await db.execute(sql`
        ALTER TABLE order_items
        ADD COLUMN IF NOT EXISTS customizations JSON DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS special_instructions TEXT
      `);

      logger.info('Customization migration completed successfully!');
    } catch (error) {
      logger.error('Customization migration failed:', error);
      // Don't throw error to allow seeding to continue
    }
  }

  private async seedData() {
    try {
      logger.info('Force seeding database (destructive operation)...');

      // Run migration first
      await this.runCustomizationMigration();
      // Clear existing data
      logger.warn('Clearing all existing data...');
      await db.delete(orderItems);
      await db.delete(orders);
      await db.delete(cartItems);
      await db.delete(menuItems);
      await db.delete(categories);
      await db.delete(shopAdmins);
      await db.delete(users);
      await db.delete(desks);
      await db.delete(shops);

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
      const returnedShops = await db.insert(shops).values([
        { name: 'Afly Restaurant' }
      ]).returning();
      const shopId = returnedShops[0].id;

      // Seed Categories
      const returnedCategories = await db.insert(categories).values([
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
      const menuItemsData: (Omit<InsertMenuItem, 'categoryId' | 'shopId'> & {categoryName: string})[] = [
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
            customizationOptions: [
              {
                id: 'spice-level',
                name: 'Spice Level',
                type: 'radio',
                options: [
                  { id: 'mild', name: 'Mild', price: 0 },
                  { id: 'medium', name: 'Medium', price: 0 },
                  { id: 'hot', name: 'Hot', price: 0 }
                ]
              },
              {
                id: 'extra-meat',
                name: 'Extra Meat',
                type: 'checkbox',
                price: 50
              }
            ]
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
            customizationOptions: [
              {
                id: 'spice-level',
                name: 'Spice Level',
                type: 'radio',
                options: [
                  { id: 'mild', name: 'Mild', price: 0 },
                  { id: 'medium', name: 'Medium', price: 0 },
                  { id: 'hot', name: 'Hot', price: 0 },
                  { id: 'extra-hot', name: 'Extra Hot', price: 10 }
                ]
              },
              {
                id: 'extra-peanuts',
                name: 'Extra Peanuts',
                type: 'checkbox',
                price: 15
              }
            ]
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
            customizationOptions: [
              {
                id: 'spice-level',
                name: '辣度',
                type: 'radio',
                options: [
                  { id: 'mild', name: '微辣', price: 0 },
                  { id: 'medium', name: '中辣', price: 0 },
                  { id: 'hot', name: '大辣', price: 0 },
                  { id: 'extra-hot', name: '特辣', price: 5 }
                ]
              },
              {
                id: 'extra-crispy',
                name: '加酥脆',
                type: 'checkbox',
                price: 20
              },
              {
                id: 'portion-size',
                name: '份量',
                type: 'radio',
                options: [
                  { id: 'small', name: '小份', price: -20 },
                  { id: 'regular', name: '正常', price: 0 },
                  { id: 'large', name: '大份', price: 30 }
                ]
              }
            ]
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
            customizationOptions: [
              {
                id: 'sweetness',
                name: '甜度',
                type: 'radio',
                options: [
                  { id: 'no-sugar', name: '無糖', price: 0 },
                  { id: 'less-sweet', name: '微糖', price: 0 },
                  { id: 'half-sweet', name: '半糖', price: 0 },
                  { id: 'regular', name: '正常糖', price: 0 },
                  { id: 'extra-sweet', name: '全糖', price: 0 }
                ]
              },
              {
                id: 'ice-level',
                name: '冰塊',
                type: 'radio',
                options: [
                  { id: 'no-ice', name: '去冰', price: 0 },
                  { id: 'less-ice', name: '微冰', price: 0 },
                  { id: 'regular-ice', name: '正常冰', price: 0 },
                  { id: 'extra-ice', name: '多冰', price: 0 }
                ]
              },
              {
                id: 'extra-pearls',
                name: '加珍珠',
                type: 'checkbox',
                price: 10
              },
              {
                id: 'size',
                name: '杯型',
                type: 'radio',
                options: [
                  { id: 'medium', name: '中杯', price: 0 },
                  { id: 'large', name: '大杯', price: 15 }
                ]
              }
            ]
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
            customizationOptions: [
              {
                id: 'noodle-type',
                name: '麵條種類',
                type: 'radio',
                options: [
                  { id: 'thin', name: '細麵', price: 0 },
                  { id: 'thick', name: '粗麵', price: 0 },
                  { id: 'flat', name: '寬麵', price: 5 }
                ]
              },
              {
                id: 'extra-meat',
                name: '加肉',
                type: 'checkbox',
                price: 50
              },
              {
                id: 'extra-vegetables',
                name: '加青菜',
                type: 'checkbox',
                price: 20
              },
              {
                id: 'soup-richness',
                name: '湯頭濃度',
                type: 'radio',
                options: [
                  { id: 'light', name: '清淡', price: 0 },
                  { id: 'regular', name: '正常', price: 0 },
                  { id: 'rich', name: '濃郁', price: 10 }
                ]
              }
            ]
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
            customizationOptions: [
              {
                id: 'wonton-count',
                name: '餛飩數量',
                type: 'radio',
                options: [
                  { id: 'regular', name: '正常 (6顆)', price: 0 },
                  { id: 'extra', name: '加量 (8顆)', price: 25 },
                  { id: 'double', name: '雙倍 (12顆)', price: 50 }
                ]
              },
              {
                id: 'noodle-type',
                name: '麵條種類',
                type: 'radio',
                options: [
                  { id: 'thin', name: '細麵', price: 0 },
                  { id: 'thick', name: '粗麵', price: 0 }
                ]
              },
              {
                id: 'extra-vegetables',
                name: '加青菜',
                type: 'checkbox',
                price: 15
              }
            ]
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
            customizationOptions: [
              {
                id: 'sauce-level',
                name: '醬汁濃度',
                type: 'radio',
                options: [
                  { id: 'light', name: '清淡', price: 0 },
                  { id: 'regular', name: '正常', price: 0 },
                  { id: 'rich', name: '濃郁', price: 5 }
                ]
              },
              {
                id: 'spice-level',
                name: '辣度',
                type: 'radio',
                options: [
                  { id: 'no-spice', name: '不辣', price: 0 },
                  { id: 'mild', name: '微辣', price: 0 },
                  { id: 'medium', name: '中辣', price: 0 },
                  { id: 'hot', name: '大辣', price: 0 }
                ]
              },
              {
                id: 'extra-meat-sauce',
                name: '加肉燥',
                type: 'checkbox',
                price: 30
              },
              {
                id: 'add-egg',
                name: '加蛋',
                type: 'checkbox',
                price: 15
              }
            ]
          },
          {
            name: "麻辣牛肉麵",
            description: "香辣過癮，牛肉軟嫩",
            price: "320.00",
            categoryName: '麵食類',
            imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.9",
            reviewCount: 198,
            isPopular: true,
            isAvailable: true,
            status: 'available',
            customizationOptions: [
              {
                id: 'spice-level',
                name: '辣度',
                type: 'radio',
                options: [
                  { id: 'mild', name: '微辣', price: 0 },
                  { id: 'medium', name: '中辣', price: 0 },
                  { id: 'hot', name: '大辣', price: 0 },
                  { id: 'extra-hot', name: '特辣', price: 10 },
                  { id: 'super-hot', name: '變態辣', price: 20 }
                ]
              },
              {
                id: 'extra-meat',
                name: '加肉',
                type: 'checkbox',
                price: 60
              },
              {
                id: 'noodle-firmness',
                name: '麵條軟硬',
                type: 'radio',
                options: [
                  { id: 'soft', name: '軟', price: 0 },
                  { id: 'regular', name: '正常', price: 0 },
                  { id: 'firm', name: '硬', price: 0 }
                ]
              }
            ]
          },
          {
            name: "蝦仁炒飯",
            description: "新鮮蝦仁，粒粒分明",
            price: "220.00",
            categoryName: '飯類',
            imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.5",
            reviewCount: 112,
            isPopular: false,
            isAvailable: true,
            status: 'available',
            customizationOptions: [
              {
                id: 'extra-shrimp',
                name: '加蝦仁',
                type: 'checkbox',
                price: 40
              },
              {
                id: 'add-egg',
                name: '加蛋',
                type: 'checkbox',
                price: 15
              },
              {
                id: 'spice-level',
                name: '辣度',
                type: 'radio',
                options: [
                  { id: 'no-spice', name: '不辣', price: 0 },
                  { id: 'mild', name: '微辣', price: 0 },
                  { id: 'medium', name: '中辣', price: 0 }
                ]
              }
            ]
          },
          {
            name: "可樂",
            description: "冰涼暢快，經典口味",
            price: "35.00",
            categoryName: '飲料',
            imageUrl: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.2",
            reviewCount: 87,
            isPopular: false,
            isAvailable: true,
            status: 'available',
            customizationOptions: [
              {
                id: 'size',
                name: '杯型',
                type: 'radio',
                options: [
                  { id: 'small', name: '小杯', price: 0 },
                  { id: 'medium', name: '中杯', price: 10 },
                  { id: 'large', name: '大杯', price: 20 }
                ]
              },
              {
                id: 'ice-level',
                name: '冰塊',
                type: 'radio',
                options: [
                  { id: 'no-ice', name: '去冰', price: 0 },
                  { id: 'less-ice', name: '微冰', price: 0 },
                  { id: 'regular-ice', name: '正常冰', price: 0 }
                ]
              }
            ]
          },
          {
            name: "炸雞翅",
            description: "金黃酥脆，香嫩多汁",
            price: "150.00",
            categoryName: '開胃菜',
            imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.6",
            reviewCount: 156,
            isPopular: false,
            isAvailable: true,
            status: 'available',
            customizationOptions: [
              {
                id: 'quantity',
                name: '數量',
                type: 'radio',
                options: [
                  { id: '4-pieces', name: '4隻', price: 0 },
                  { id: '6-pieces', name: '6隻', price: 50 },
                  { id: '8-pieces', name: '8隻', price: 100 }
                ]
              },
              {
                id: 'sauce',
                name: '醬料',
                type: 'radio',
                options: [
                  { id: 'original', name: '原味', price: 0 },
                  { id: 'honey-mustard', name: '蜂蜜芥末', price: 5 },
                  { id: 'bbq', name: 'BBQ醬', price: 5 },
                  { id: 'spicy', name: '辣醬', price: 5 }
                ]
              },
              {
                id: 'extra-crispy',
                name: '加酥脆',
                type: 'checkbox',
                price: 15
              }
            ]
          }
      ];

      const menuItemsToInsert = menuItemsData.map(item => {
        const { categoryName, customizationOptions, ...rest } = item;
        return {
          ...rest,
          shopId: shopId,
          categoryId: categoryMap[categoryName],
          customizationOptions: customizationOptions ? JSON.stringify(customizationOptions) : null,
        }
      });

      await db.insert(menuItems).values(menuItemsToInsert as any);

      logger.info('Database seeded successfully!');
    } catch (error) {
      logger.error("Failed to seed database:", error);
    }
  }

  // Method to reset the database
  async resetAndSeedDatabase() {
    logger.warn('Database reset and seed initiated.');
    await this.seedData();
  }

  // Public method to run migration only
  async runMigration() {
    await this.runCustomizationMigration();
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      logger.error("Database connection test failed:", error);
      return false;
    }
  }

  // User methods (legacy - for backward compatibility)
  async getUser(id: number): Promise<User | undefined>;
  async getUser(id: number, shopId?: number): Promise<User | undefined> {
    if (shopId !== undefined) {
      // New signature with shopId
      const result = await db.select().from(users).where(and(eq(users.id, id), eq(users.shopId, shopId))).limit(1);
      return result[0];
    } else {
      // Legacy signature without shopId
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  // Category methods
  async getCategories(shopId: number): Promise<Category[]> {
    const cacheKey = `categories:${shopId}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const result = await db.select().from(categories).where(eq(categories.shopId, shopId));
    await cacheSet(cacheKey, result, 3600); // Cache for 1 hour
    
    return result;
  }
  
  async getCategory(id: number, shopId: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(and(eq(categories.id, id), eq(categories.shopId, shopId))).limit(1);
    return result[0];
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(categoryData as any).returning();
    const cacheKey = `categories:${categoryData.shopId}`;
    await cacheDelete(cacheKey); // Invalidate cache
    return result[0];
  }

  async updateCategory(id: number, shopId: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories).set(updateData).where(and(eq(categories.id, id), eq(categories.shopId, shopId))).returning();
    const cacheKey = `categories:${shopId}`;
    await cacheDelete(cacheKey); // Invalidate cache
    return result[0];
  }

  async deleteCategory(id: number, shopId: number): Promise<boolean> {
    const result = await db.delete(categories).where(and(eq(categories.id, id), eq(categories.shopId, shopId))).returning();
    const cacheKey = `categories:${shopId}`;
    await cacheDelete(cacheKey); // Invalidate cache
    return result.length > 0;
  }
  
  // Menu Item methods
  async getMenuItems(shopId: number, categoryId?: number): Promise<MenuItemWithCategory[]> {
    // Cache disabled temporarily for customization updates
    // const cacheKey = `menuItems:${shopId}:${categoryId || 'all'}`;
    // const cached = await cacheGet(cacheKey);

    // if (cached) {
    //   return cached;
    // }

    const query = db.select({
        menuItem: menuItems,
        category: categories
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(eq(menuItems.shopId, shopId))
      .orderBy(desc(menuItems.isPopular), desc(menuItems.createdAt));

    if (categoryId) {
      query.where(eq(menuItems.categoryId, categoryId));
    }

    const result = await query;

    const finalResult = result.map(r => ({
      ...r.menuItem,
      category: r.category || undefined,
    }));

    // await cacheSet(cacheKey, finalResult, 3600); // Cache for 1 hour

    return finalResult;
  }
  
  async getMenuItem(id: number, shopId: number): Promise<MenuItemWithCategory | undefined> {
    const result = await db.select({
        menuItem: menuItems,
        category: categories
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(and(eq(menuItems.id, id), eq(menuItems.shopId, shopId)))
      .limit(1);
      
    if (result.length === 0) {
      return undefined;
    }
    
    return {
      ...result[0].menuItem,
      category: result[0].category || undefined,
    };
  }
  
  async createMenuItem(menuItemData: InsertMenuItem): Promise<MenuItem> {
    const result = await db.insert(menuItems).values(menuItemData as any).returning();
    const cacheKey = `menuItems:${menuItemData.shopId}:${menuItemData.categoryId || 'all'}`;
    await cacheDelete(cacheKey); // Invalidate cache
    await cacheDelete(`menuItems:${menuItemData.shopId}:all`); // Invalidate all items cache
    return result[0];
  }
  
  async updateMenuItem(id: number, shopId: number, updateData: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const currentItem = await this.getMenuItem(id, shopId);

    const result = await db.update(menuItems).set(updateData).where(and(eq(menuItems.id, id), eq(menuItems.shopId, shopId))).returning();
    
    if (result.length > 0) {
      if (currentItem) {
        const oldCacheKey = `menuItems:${shopId}:${currentItem.categoryId || 'all'}`;
        await cacheDelete(oldCacheKey);
      }
      if (updateData.categoryId) {
        const newCacheKey = `menuItems:${shopId}:${updateData.categoryId || 'all'}`;
        await cacheDelete(newCacheKey);
      }
      await cacheDelete(`menuItems:${shopId}:all`);
    }
    
    return result[0];
  }
  
  async deleteMenuItem(id: number, shopId: number): Promise<boolean> {
    const currentItem = await this.getMenuItem(id, shopId);

    const result = await db.delete(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.shopId, shopId))).returning();
    
    if (result.length > 0 && currentItem) {
      const cacheKey = `menuItems:${shopId}:${currentItem.categoryId || 'all'}`;
      await cacheDelete(cacheKey);
      await cacheDelete(`menuItems:${shopId}:all`);
    }
    
    return result.length > 0;
  }

  async getPopularMenuItems(shopId: number, limit: number = 5): Promise<any[]> {
    const cacheKey = `popularMenuItems:${shopId}:${limit}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        imageUrl: menuItems.imageUrl,
        price: menuItems.price,
        orderCount: sql<number>`count(${orderItems.id})`.mapWith(Number),
      })
      .from(menuItems)
      .leftJoin(orderItems, eq(menuItems.id, orderItems.menuItemId))
      .where(eq(menuItems.shopId, shopId))
      .groupBy(menuItems.id, menuItems.name, menuItems.imageUrl, menuItems.price)
      .orderBy(desc(sql`count(${orderItems.id})`))
      .limit(limit);

    await cacheSet(cacheKey, result, 3600);

    return result;
  }

  async getWeeklyTopSalesItems(shopId: number, limit: number = 5): Promise<any[]> {
    // Use PostgreSQL-specific date functions to get current week (Monday to Sunday)
    // This matches the SQL query provided by the user
    const result = await db
      .select({
        id: orderItems.menuItemId,
        name: orderItems.itemName,
        imageUrl: menuItems.imageUrl,
        price: menuItems.price,
        orderCount: sql<number>`sum(${orderItems.quantity})`.mapWith(Number),
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(and(
        eq(orders.shopId, shopId),
        eq(orders.paid, true), // Only count paid orders
        sql`${orderItems.createdAt} >= date_trunc('day', NOW() - (EXTRACT(ISODOW FROM NOW())::integer % 7) * interval '1 day')`,
        sql`${orderItems.createdAt} < date_trunc('day', NOW() - (EXTRACT(ISODOW FROM NOW())::integer % 7) * interval '1 day') + interval '7 days'`
      ))
      .groupBy(orderItems.itemName, orderItems.menuItemId, menuItems.imageUrl, menuItems.price)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(limit);

    // Transform the result to match the expected format for the frontend
    const transformedResult = result.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl || '',
      price: item.price?.toString() || '0',
      orderCount: item.orderCount,
    }));

    return transformedResult;
  }

  async searchMenuItems(query: string, shopId: number): Promise<MenuItem[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const results = await db
      .select()
      .from(menuItems)
      .where(
        and(
          eq(menuItems.shopId, shopId),
          or(
            like(menuItems.name, searchTerm),
            like(menuItems.description, searchTerm)
          )
        )
      );
    return results;
  }

  // Cart methods
  async getCartItems(sessionId: string): Promise<(CartItem & { menuItem: MenuItem })[]> {
    // Validate session ID format to prevent injection
    if (!this.validateSessionId(sessionId)) {
      throw new Error('Invalid session ID format');
    }

    const results = await db
      .select({
        cartItem: cartItems,
        menuItem: menuItems,
      })
      .from(cartItems)
      .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
      .where(eq(cartItems.sessionId, sessionId));

    return results.map(r => ({ ...r.cartItem, menuItem: r.menuItem }));
  }

  async addToCart(cartItem: InsertCartItem): Promise<void> {
    // Validate session ID format to prevent injection
    if (!this.validateSessionId(cartItem.sessionId)) {
      throw new Error('Invalid session ID format');
    }

    // Get menu item to calculate customization cost
    const menuItem = await db.select().from(menuItems).where(eq(menuItems.id, cartItem.menuItemId)).limit(1);
    if (menuItem.length === 0) {
      throw new Error('Menu item not found');
    }

    // Calculate customization cost
    let customizationCost = 0;
    if (menuItem[0].customizationOptions && cartItem.customizations) {
      const customizationOptions = menuItem[0].customizationOptions as any[];
      const selectedCustomizations = cartItem.customizations as any;

      customizationOptions.forEach(option => {
        const selectedValue = selectedCustomizations[option.id];

        if (option.type === 'checkbox' && selectedValue) {
          customizationCost += option.price || 0;
        } else if (option.type === 'radio' && selectedValue && option.options) {
          const selectedOption = option.options.find((opt: any) => opt.id === selectedValue);
          if (selectedOption) {
            customizationCost += selectedOption.price || 0;
          }
        }
      });
    }

    // Check for existing item with same customizations
    const existingItems = await db.select().from(cartItems).where(and(
      eq(cartItems.sessionId, cartItem.sessionId),
      eq(cartItems.menuItemId, cartItem.menuItemId)
    ));

    // Find exact match including customizations
    const exactMatch = existingItems.find(item => {
      const existingCustomizations = JSON.stringify(item.customizations || {});
      const newCustomizations = JSON.stringify(cartItem.customizations || {});
      const existingInstructions = item.specialInstructions || '';
      const newInstructions = cartItem.specialInstructions || '';

      return existingCustomizations === newCustomizations &&
             existingInstructions === newInstructions;
    });

    if (exactMatch) {
      // Update quantity for exact match
      await db.update(cartItems)
        .set({ quantity: exactMatch.quantity + cartItem.quantity })
        .where(eq(cartItems.id, exactMatch.id));
    } else {
      // Insert as new item (different customizations) with calculated cost
      const cartItemWithCost = {
        ...cartItem,
        customizationCost: customizationCost.toString()
      };
      await db.insert(cartItems).values(cartItemWithCost as any);
    }
  }

  async updateCartItemQuantity(sessionId: string, menuItemId: number, quantity: number): Promise<CartItem | undefined> {
    // Validate session ID format to prevent injection
    if (!this.validateSessionId(sessionId)) {
      throw new Error('Invalid session ID format');
    }

    if (quantity <= 0) {
      await this.removeFromCart(sessionId, menuItemId);
      return undefined;
    }

    const result = await db.update(cartItems)
      .set({ quantity })
      .where(and(
        eq(cartItems.sessionId, sessionId),
        eq(cartItems.menuItemId, menuItemId)
      ))
      .returning();
      
    return result[0];
  }

  async removeFromCart(sessionId: string, menuItemId: number): Promise<boolean> {
    // Validate session ID format to prevent injection
    if (!this.validateSessionId(sessionId)) {
      throw new Error('Invalid session ID format');
    }

    const result = await db.delete(cartItems)
      .where(and(
        eq(cartItems.sessionId, sessionId),
        eq(cartItems.menuItemId, menuItemId)
      ))
      .returning();
      
    return result.length > 0;
  }

  async clearCart(sessionId: string): Promise<void> {
    // Validate session ID format to prevent injection
    if (!this.validateSessionId(sessionId)) {
      throw new Error('Invalid session ID format');
    }

    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }
  
  // Order methods
  async getOrders(shopId: number, status?: string): Promise<OrderWithItems[]> {
    const conditions: (SQL | undefined)[] = [eq(orders.shopId, shopId)];
    
    if (status) {
      conditions.push(eq(orders.status, status));
    }
    
    const results = await db.select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));
      
    const ordersWithItems: OrderWithItems[] = await Promise.all(
      results.map(order => this.populateOrder(order))
    );
      
    return ordersWithItems;
  }

  async getOrder(id: number, shopId: number): Promise<OrderWithItems | undefined> {
    const result = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.shopId, shopId))).limit(1);
    
    if (result.length > 0) {
      return this.populateOrder(result[0]);
    }
    
    return undefined;
  }

  async getUserOrders(userId: number, shopId: number): Promise<OrderWithItems[]> {
    const results = await db.select().from(orders).where(and(eq(orders.customerId, userId), eq(orders.shopId, shopId))).orderBy(desc(orders.createdAt));
    return Promise.all(
      results.map(order => this.populateOrder(order))
    );
  }

  async getOrdersBySession(sessionId: string): Promise<OrderWithItems[]> {
    // Validate session ID format to prevent injection
    if (!this.validateSessionId(sessionId)) {
      throw new Error('Invalid session ID format');
    }

    // Filter out paid orders (completed orders that have been released by admin)
    const results = await db.select().from(orders).where(
      and(
        eq(orders.sessionId, sessionId),
        eq(orders.paid, false)
      )
    ).orderBy(desc(orders.createdAt));
    return Promise.all(
      results.map(order => this.populateOrder(order))
    );
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    return db.transaction(async (tx) => {
      const newOrderArr = await tx.insert(orders).values(orderData as any).returning();
      const newOrder = newOrderArr[0];

      if (orderData.tableNumber) {
        const desk = await tx.select().from(desks).where(and(
          eq(desks.name, orderData.tableNumber),
          eq(desks.shopId, orderData.shopId)
        )).limit(1);
        
        if (desk.length > 0) {
          await tx.update(orders).set({ deskId: desk[0].id }).where(eq(orders.id, newOrder.id));
          await tx.update(desks).set({ status: 'occupied' }).where(eq(desks.id, desk[0].id));
          newOrder.deskId = desk[0].id;
        }
      }

      const orderItemsToInsert = items.map(item => ({
        ...item,
        orderId: newOrder.id
      }));
      await tx.insert(orderItems).values(orderItemsToInsert as any);

      if (orderData.sessionId) {
        await tx.delete(cartItems).where(eq(cartItems.sessionId, orderData.sessionId));
      }

      const populatedOrder = await this.populateOrder(newOrder);
      
      return populatedOrder;
    });
  }
  
  async updateOrderStatus(id: number, shopId: number, status: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status })
      .where(and(eq(orders.id, id), eq(orders.shopId, shopId)))
      .returning();

    if (result.length > 0 && ['completed', 'cancelled'].includes(status)) {
      const order = result[0];
      if (order.deskId) {
        // Check if there are any other orders that would keep the desk occupied
        // (orders that are not cancelled and not paid)
        const otherActiveOrders = await db.select().from(orders).where(and(
          eq(orders.deskId, order.deskId),
          not(eq(orders.id, order.id)),
          not(eq(orders.status, 'cancelled')),
          eq(orders.paid, false)
        )).limit(1);

        if (otherActiveOrders.length === 0) {
          await db.update(desks).set({ status: 'available' }).where(eq(desks.id, order.deskId));
        }
      }
    }

    return result[0];
  }
  
  private async populateOrder(order: Order): Promise<OrderWithItems> {
    const items = await db.select({
      orderItem: orderItems,
      menuItem: menuItems
    })
    .from(orderItems)
    .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, order.id));
    
    const customer = order.customerId
      ? await this.getUser(order.customerId)
      : undefined;
      
    const desk = order.deskId
      ? await this.getDesk(order.deskId, order.shopId)
      : undefined;

    return {
      ...order,
      items: items.map(i => ({...i.orderItem, menuItem: i.menuItem || undefined })),
      customer,
      desk
    };
  }

  // Desk methods
  async getDesks(shopId: number): Promise<DeskWithStatus[]> {
    const allDesks = await db.select().from(desks).where(eq(desks.shopId, shopId)).orderBy(desks.name);

    // Find orders that make a desk occupied: status != 'cancelled' AND paid != true
    const activeOrders = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.shopId, shopId),
        not(eq(orders.status, 'cancelled')),
        eq(orders.paid, false),
        not(isNull(orders.deskId))
      ));

    const ordersByDesk = activeOrders.reduce((acc, order) => {
      if (order.deskId) {
        if (!acc[order.deskId]) {
          acc[order.deskId] = [];
        }
        acc[order.deskId].push(order);
      }
      return acc;
    }, {} as Record<number, Order[]>);

    const desksWithStatus: DeskWithStatus[] = allDesks.map(desk => {
      const deskOrders = ordersByDesk[desk.id] || [];
      const hasActiveOrders = deskOrders.length > 0;

      return {
        ...desk,
        // Desk status logic: occupied if there are orders with status != 'cancelled' AND paid != true
        status: hasActiveOrders ? 'occupied' : 'available',
        // Transform status field to isOccupied boolean for frontend compatibility
        isOccupied: hasActiveOrders,
        orderCount: deskOrders.length,
        currentOrder: deskOrders.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())[0] || undefined,
      };
    });

    return desksWithStatus;
  }
  
  async getDesk(id: number, shopId: number): Promise<Desk | undefined> {
    const result = await db.select().from(desks).where(and(eq(desks.id, id), eq(desks.shopId, shopId))).limit(1);
    return result[0];
  }

  async createDesk(deskData: InsertDesk): Promise<Desk> {
    const result = await db.insert(desks).values(deskData as any).returning();
    return result[0];
  }

  async updateDesk(id: number, shopId: number, updateData: Partial<InsertDesk>): Promise<Desk | undefined> {
    const result = await db.update(desks).set(updateData).where(and(eq(desks.id, id), eq(desks.shopId, shopId))).returning();
    return result[0];
  }

  async deleteDesk(id: number, shopId: number): Promise<boolean> {
    const result = await db.delete(desks).where(and(eq(desks.id, id), eq(desks.shopId, shopId))).returning();
    return result.length > 0;
  }

  async toggleDeskStatus(id: number, shopId: number, newStatus: 'available' | 'occupied'): Promise<Desk | undefined> {
    const result = await db.update(desks).set({ status: newStatus }).where(and(eq(desks.id, id), eq(desks.shopId, shopId))).returning();
    return result[0];
  }

  async completeAndPayDeskOrders(deskId: number): Promise<Order[]> {
    try {
      logger.info(`Starting completeAndPayDeskOrders for desk ${deskId}`);

      // Get all orders for this desk that are not cancelled and not already paid
      const ordersToUpdate = await db.select().from(orders).where(and(
        eq(orders.deskId, deskId),
        not(eq(orders.status, 'cancelled')),
        eq(orders.paid, false)
      ));

      logger.info(`Found ${ordersToUpdate.length} orders to complete and pay for desk ${deskId}`);

      if (ordersToUpdate.length === 0) {
        logger.info(`No orders to update for desk ${deskId}`);
        return [];
      }

      // Update all non-cancelled, unpaid orders to completed and paid
      const completedOrders = await db.update(orders)
        .set({
          status: 'completed',
          paid: true
        })
        .where(and(
          eq(orders.deskId, deskId),
          not(eq(orders.status, 'cancelled')),
          eq(orders.paid, false)
        ))
        .returning();

      logger.info(`Completed and paid ${completedOrders.length} orders for desk ${deskId}`);
      return completedOrders;
    } catch (error) {
      logger.error(`Error completing orders for desk ${deskId}:`, error);
      throw error;
    }
  }

  // Table reset functionality
  async resetTable(tableNumber: string, shopId: number = 1): Promise<{ success: boolean; message: string }> {
    try {
      await db.transaction(async (tx) => {
        // Get all sessions for this table
        const tableOrders = await tx
          .select({ sessionId: orders.sessionId })
          .from(orders)
          .where(and(
            eq(orders.tableNumber, tableNumber),
            eq(orders.shopId, shopId)
          ))
          .groupBy(orders.sessionId);

        const sessionIds = tableOrders.map(order => order.sessionId);

        if (sessionIds.length > 0) {
          // Clear cart items for all sessions at this table
          await tx.delete(cartItems).where(
            inArray(cartItems.sessionId, sessionIds.filter(id => id !== null))
          );

          // Update all pending orders to cancelled
          await tx
            .update(orders)
            .set({
              status: 'cancelled'
            })
            .where(and(
              eq(orders.tableNumber, tableNumber),
              eq(orders.shopId, shopId),
              eq(orders.status, 'pending')
            ));
        }

        // Clear any cached data for this table
        const cacheKeys = [
          `cart:*:${tableNumber}`,
          `orders:${tableNumber}`,
          `table:${tableNumber}:*`
        ];

        for (const pattern of cacheKeys) {
          await cacheDelete(pattern);
        }
      });

      return {
        success: true,
        message: `Table ${tableNumber} has been reset successfully`
      };
    } catch (error) {
      console.error('Error resetting table:', error);
      return {
        success: false,
        message: `Failed to reset table ${tableNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Session methods
  async getSessions(shopId: number): Promise<Session[]> {
    const results = await db.select().from(sessions).where(eq(sessions.shopId, shopId));
    return results;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    // Validate session ID format to prevent injection
    if (!this.validateSessionId(sessionId)) {
      throw new Error('Invalid session ID format');
    }

    const result = await db.delete(sessions).where(eq(sessions.id, sessionId)).returning();
    return result.length > 0;
  }

  // User methods
  async getUsers(shopId: number): Promise<User[]> {
    const results = await db.select().from(users).where(eq(users.shopId, shopId));
    return results;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: number, shopId: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(and(eq(users.id, id), eq(users.shopId, shopId)))
      .returning();
    return result[0];
  }

  async deleteUser(id: number, shopId: number): Promise<boolean> {
    const result = await db.delete(users).where(and(eq(users.id, id), eq(users.shopId, shopId))).returning();
    return result.length > 0;
  }

  // Stats methods
  async getStats(shopId: number): Promise<{
    todayOrders: number;
    revenue: number;
    activeCustomers: number;
    menuItemsCount: number;
  }> {
    // Get today's date in YYYY-MM-DD format
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    logger.info(`Getting stats for shop ${shopId}, today: ${todayStr}`);

    // Use raw SQL for better date handling
    const todayOrdersQuery = sql`
      SELECT COUNT(*) as count
      FROM orders
      WHERE shop_id = ${shopId}
        AND DATE(created_at) = DATE(${todayStr})
        AND paid = true
    `;

    const revenueQuery = sql`
      SELECT COALESCE(SUM(total), 0) as total
      FROM orders
      WHERE shop_id = ${shopId}
        AND DATE(created_at) = DATE(${todayStr})
        AND paid = true
    `;

    const activeCustomersQuery = sql`
      SELECT COUNT(DISTINCT customer_id) as count
      FROM orders
      WHERE shop_id = ${shopId}
        AND DATE(created_at) = DATE(${todayStr})
    `;

    const menuItemsCountQuery = db.select({ count: sql`count(*)` }).from(menuItems)
      .where(eq(menuItems.shopId, shopId));

    const [
      todayOrdersResult,
      revenueResult,
      activeCustomersResult,
      menuItemsCountResult
    ] = await Promise.all([
      db.execute(todayOrdersQuery),
      db.execute(revenueQuery),
      db.execute(activeCustomersQuery),
      menuItemsCountQuery
    ]);

    const stats = {
      todayOrders: Number(todayOrdersResult.rows[0]?.count) || 0,
      revenue: parseFloat(todayOrdersResult.rows[0]?.total || revenueResult.rows[0]?.total) || 0,
      activeCustomers: Number(activeCustomersResult.rows[0]?.count) || 0,
      menuItemsCount: Number(menuItemsCountResult[0].count) || 0,
    };

    logger.info(`Stats result: ${JSON.stringify(stats)}`);
    return stats;
  }

  // Mark table as occupied by table number
  async markTableOccupiedByNumber(tableNumber: string, shopId: number): Promise<void> {
    try {
      // First, try to find existing desk by table number
      const existingDesk = await db.select().from(desks).where(and(
        eq(desks.name, tableNumber),
        eq(desks.shopId, shopId)
      )).limit(1);

      if (existingDesk.length > 0) {
        // Update existing desk to occupied
        await db.update(desks).set({ status: 'occupied' }).where(eq(desks.id, existingDesk[0].id));
      } else {
        // Create new desk if it doesn't exist
        await db.insert(desks).values({
          name: tableNumber,
          shopId: shopId,
          status: 'occupied',
          capacity: 4, // Default capacity
        });
      }
    } catch (error) {
      console.error(`Error marking table ${tableNumber} as occupied:`, error);
      throw error;
    }
  }
}

export const databaseStorage = new DatabaseStorage(); 