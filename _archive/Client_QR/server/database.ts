import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import { sql } from "drizzle-orm";
import { 
  menuItems, cartItems, orders, orderItems, categories,
  type MenuItem, type InsertMenuItem,
  type CartItem, type InsertCartItem,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Category, type InsertCategory
} from "@shared/schema";
import { eq, and, like, or, desc, not } from "drizzle-orm";
import type { IStorage } from "./storage";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

console.log("Using DATABASE_URL:", process.env.DATABASE_URL);

export class DatabaseStorage implements IStorage {
  constructor() {
    this.init();
  }

  private async init() {
    try {
      await this.seedData();
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  }

  private async seedData() {
    try {
      // Check if categories exist
      const existingCategories = await db.select().from(categories).limit(1);
      
      if (existingCategories.length === 0) {
        // Create categories
        const categoriesData = [
          { id: 1, name: "麵類", description: "各式麵條料理", isActive: true },
          { id: 2, name: "飯類", description: "美味飯類料理", isActive: true },
          { id: 3, name: "小食", description: "精緻小點心", isActive: true },
          { id: 4, name: "飲品", description: "清涼飲料", isActive: true },
        ];

        await db.insert(categories).values(categoriesData);

        // Create sample menu items with Chinese content
        const sampleItems = [
          {
            name: "紅燒牛肉麵",
            description: "精選牛腱肉，搭配濃郁湯頭",
            price: "280.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.8",
            reviewCount: 156,
            isPopular: true,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
          {
            name: "招牌炒飯",
            description: "蛋香四溢，配菜豐富",
            price: "180.00",
            categoryId: 2,
            imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.6",
            reviewCount: 89,
            isPopular: true,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
          {
            name: "鹽酥雞",
            description: "酥脆外皮，多汁內餡",
            price: "120.00",
            categoryId: 3,
            imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.7",
            reviewCount: 234,
            isPopular: true,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
          {
            name: "擔仔麵",
            description: "台南傳統小吃，鮮美湯頭",
            price: "150.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.5",
            reviewCount: 67,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
          {
            name: "麻辣牛肉麵",
            description: "香辣過癮，牛肉軟嫩",
            price: "320.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.9",
            reviewCount: 198,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
          {
            name: "珍珠奶茶",
            description: "Q彈珍珠，香濃奶茶",
            price: "65.00",
            categoryId: 4,
            imageUrl: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.4",
            reviewCount: 145,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
          {
            name: "冬瓜茶",
            description: "清香甘甜，消暑解膩",
            price: "45.00",
            categoryId: 4,
            imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.3",
            reviewCount: 78,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
          {
            name: "清燉牛肉麵",
            description: "清淡湯頭，牛肉鮮美",
            price: "260.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.6",
            reviewCount: 92,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
          {
            name: "餛飩麵",
            description: "手工餛飩，鮮美湯頭",
            price: "180.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.4",
            reviewCount: 73,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
          {
            name: "乾拌麵",
            description: "香濃肉燥，口感豐富",
            price: "160.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.2",
            reviewCount: 54,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: 'available' as const,
          },
        ];

        await db.insert(menuItems).values(sampleItems);
        console.log("Client QR Database seeded successfully with Chinese menu items");
      }
    } catch (error) {
      console.error("Failed to seed Client QR database:", error);
    }
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(eq(menuItems.shopId, 1));
  }

  async getMenuItemsByCategory(category: number): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(
      and(eq(menuItems.shopId, 1), eq(menuItems.categoryId, category))
    );
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const result = await db.select().from(menuItems).where(
      and(eq(menuItems.shopId, 1), eq(menuItems.id, id))
    ).limit(1);
    return result[0];
  }

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(menuItems).where(
      and(
        eq(menuItems.shopId, 1),
        or(
          like(menuItems.name, searchTerm),
          like(menuItems.description, searchTerm)
        )
      )
    );
  }

  // Cart Items
  async getCartItems(sessionId: string): Promise<(CartItem & { menuItem: MenuItem })[]> {
    const items = await db
      .select({
        id: cartItems.id,
        sessionId: cartItems.sessionId,
        menuItemId: cartItems.menuItemId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        menuItem: menuItems,
      })
      .from(cartItems)
      .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
      .where(eq(cartItems.sessionId, sessionId));

    return items.map(item => ({
      id: item.id,
      sessionId: item.sessionId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      menuItem: item.menuItem,
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.sessionId, item.sessionId),
          eq(cartItems.menuItemId, item.menuItemId)
        )
      )
      .limit(1);

    if (existingItem.length > 0) {
      // Update quantity
      const updated = await db
        .update(cartItems)
        .set({ quantity: existingItem[0].quantity + (item.quantity || 1) })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updated[0];
    } else {
      // Insert new cart item
      const inserted = await db.insert(cartItems).values(item).returning();
      return inserted[0];
    }
  }

  async updateCartItemQuantity(sessionId: string, menuItemId: number, quantity: number): Promise<CartItem | undefined> {
    if (quantity === 0) {
      await this.removeFromCart(sessionId, menuItemId);
      return undefined;
    }

    const updated = await db
      .update(cartItems)
      .set({ quantity })
      .where(
        and(
          eq(cartItems.sessionId, sessionId),
          eq(cartItems.menuItemId, menuItemId)
        )
      )
      .returning();

    return updated[0];
  }

  async removeFromCart(sessionId: string, menuItemId: number): Promise<boolean> {
    const deleted = await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.sessionId, sessionId),
          eq(cartItems.menuItemId, menuItemId)
        )
      )
      .returning();

    return deleted.length > 0;
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  // Orders
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Log the order and items being created
    console.log("Creating order:", order);
    console.log("Order items:", items);
    
    // Insert order first
    const inserted = await db.insert(orders).values(order).returning();
    const createdOrder = inserted[0];
    
    // Then insert order items with the order ID
    if (items.length > 0) {
      const orderItemsWithOrderId = items.map(item => ({
        orderId: createdOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        itemName: item.itemName,
      }));
      
      console.log("Inserting order items:", orderItemsWithOrderId);
      await db.insert(orderItems).values(orderItemsWithOrderId);
    }

    // Clear the cart after creating order
    if (order.sessionId) {
      await this.clearCart(order.sessionId);
    }

    return createdOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrderItems(orderId: number): Promise<(OrderItem & { menuItem: MenuItem })[]> {
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        menuItemId: orderItems.menuItemId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        itemName: orderItems.itemName,
        menuItem: menuItems,
      })
      .from(orderItems)
      .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, orderId));

    return items.map(item => ({
      id: item.id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
      itemName: item.itemName,
      menuItem: item.menuItem,
    }));
  }

  async getOrdersBySession(sessionId: string): Promise<any[]> {
    console.log("Fetching orders for session:", sessionId);
    
    // Get all orders for this session that are not completed
    const ordersList = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.sessionId, sessionId),
          not(eq(orders.status, "completed"))
        )
      )
      .orderBy(desc(orders.createdAt));
    
    console.log("Found orders:", ordersList);
    
    // For each order, get its items
    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        
        console.log(`Order ${order.id} has ${items.length} items:`, items);
        
        return {
          ...order,
          items: items
        };
      })
    );
    
    return ordersWithItems;
  }
}

export const databaseStorage = new DatabaseStorage(); 