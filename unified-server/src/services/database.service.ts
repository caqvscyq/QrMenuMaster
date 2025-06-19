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

  private async seedData() {
    try {
      logger.info('Seeding database...');
      // Clear existing data
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
    const cacheKey = `menuItems:${shopId}:${categoryId || 'all'}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

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
    
    await cacheSet(cacheKey, finalResult, 3600); // Cache for 1 hour

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

    const existingItem = await db.select().from(cartItems).where(and(
      eq(cartItems.sessionId, cartItem.sessionId),
      eq(cartItems.menuItemId, cartItem.menuItemId)
    )).limit(1);

    if (existingItem.length > 0) {
      await db.update(cartItems)
        .set({ quantity: existingItem[0].quantity + cartItem.quantity })
        .where(eq(cartItems.id, existingItem[0].id));
    } else {
      await db.insert(cartItems).values(cartItem);
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

    const results = await db.select().from(orders).where(eq(orders.sessionId, sessionId)).orderBy(desc(orders.createdAt));
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
        const otherOrders = await db.select().from(orders).where(and(
          eq(orders.deskId, order.deskId),
          not(eq(orders.id, order.id)),
          inArray(orders.status, ['pending', 'preparing', 'ready'])
        )).limit(1);

        if (otherOrders.length === 0) {
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
    
    const activeOrders = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.shopId, shopId),
        inArray(orders.status, ['pending', 'preparing', 'ready']),
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
      return {
        ...desk,
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrdersQuery = db.select({ count: sql`count(*)` }).from(orders)
      .where(and(
        eq(orders.shopId, shopId),
        gte(orders.createdAt, today),
        eq(orders.paid, true)
      ));
      
    const revenueQuery = db.select({ total: sql`sum(${orders.total})` }).from(orders)
      .where(and(
        eq(orders.shopId, shopId),
        gte(orders.createdAt, today),
        eq(orders.paid, true)
      ));
      
    const activeCustomersQuery = db.select({ count: sql`count(distinct ${orders.customerId})` }).from(orders)
      .where(and(
        eq(orders.shopId, shopId),
        gte(orders.createdAt, today)
      ));
      
    const menuItemsCountQuery = db.select({ count: sql`count(*)` }).from(menuItems)
      .where(eq(menuItems.shopId, shopId));
      
    const [
      todayOrdersResult,
      revenueResult,
      activeCustomersResult,
      menuItemsCountResult
    ] = await Promise.all([
      todayOrdersQuery,
      revenueQuery,
      activeCustomersQuery,
      menuItemsCountQuery
    ]);

    return {
      todayOrders: Number(todayOrdersResult[0].count) || 0,
      revenue: parseFloat(revenueResult[0].total as string) || 0,
      activeCustomers: Number(activeCustomersResult[0].count) || 0,
      menuItemsCount: Number(menuItemsCountResult[0].count) || 0,
    };
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