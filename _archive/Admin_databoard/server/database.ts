import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import { 
  users, categories, menuItems, orders, orderItems, shops, desks,
  type User, type InsertUser, 
  type Category, type InsertCategory,
  type MenuItem, type InsertMenuItem,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type MenuItemWithCategory,
  type OrderWithItems,
  type CartItem,
  type InsertCartItem,
  type Desk,
  type InsertDesk
} from "@shared/schema";
import { eq, and, gte, like, or, desc, inArray, not, isNull } from "drizzle-orm";
import type { IStorage } from "./storage";
import bcrypt from "bcrypt";

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
      // Create tables and seed data
      await this.seedData();
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  }

  private async seedData() {
    try {
      // Check if shop exists, if not create one
      let shop = (await db.select().from(shops).limit(1))[0];
      if (!shop) {
        console.log("[SEED] No shops found, creating a default shop.");
        shop = (await db.insert(shops).values({ name: "My Awesome Restaurant" }).returning())[0];
      }
      
      // Check if admin user exists
      const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
      
      if (existingAdmin.length === 0) {
        // Create default admin user
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await db.insert(users).values({
          username: "admin",
          password: hashedPassword,
          role: "admin",
          email: "admin@aflymails.com",
          phone: "+1234567890",
          shopId: shop.id,
        });

        // Create sample categories
        const categoriesData = [
          {
            name: "Appetizers",
            description: "Start your meal with these delicious appetizers",
            isActive: true,
            shopId: shop.id,
          },
          {
            name: "Main Courses",
            description: "Hearty and satisfying main dishes",
            isActive: true,
            shopId: shop.id,
          },
          {
            name: "Desserts",
            description: "Sweet treats to end your meal",
            isActive: true,
            shopId: shop.id,
          },
          {
            name: "Beverages",
            description: "Refreshing drinks and beverages",
            isActive: true,
            shopId: shop.id,
          },
        ];

        const insertedCategories = await db.insert(categories).values(categoriesData).returning();

        const sampleItems = [
          {
            name: "Grilled Salmon",
            description: "Fresh Atlantic salmon with seasonal vegetables and herbs",
            price: "24.99",
            categoryId: insertedCategories[1].id, // Main Courses
            imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            status: "available",
            shopId: shop.id,
          },
          {
            name: "Margherita Pizza",
            description: "Traditional pizza with fresh mozzarella and basil",
            price: "18.99",
            categoryId: insertedCategories[1].id, // Main Courses
            imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            status: "available",
            shopId: shop.id,
          },
          {
            name: "Caesar Salad",
            description: "Crisp romaine lettuce with classic Caesar dressing",
            price: "12.99",
            categoryId: insertedCategories[0].id, // Appetizers
            imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            status: "available",
            shopId: shop.id,
          },
          {
            name: "Classic Beef Burger",
            description: "Juicy beef patty with lettuce, tomato, and cheese",
            price: "16.99",
            categoryId: insertedCategories[1].id, // Main Courses
            imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            status: "available",
            shopId: shop.id,
          },
          {
            name: "Chocolate Cake",
            description: "Rich chocolate cake with fresh berries",
            price: "8.99",
            categoryId: insertedCategories[2].id, // Desserts
            imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            status: "out_of_stock",
            shopId: shop.id,
          },
          {
            name: "Tropical Smoothie",
            description: "Fresh mango, pineapple, and coconut blend",
            price: "7.99",
            categoryId: insertedCategories[3].id, // Beverages
            imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            status: "available",
            shopId: shop.id,
          },
        ];

        await db.insert(menuItems).values(sampleItems);
        console.log("Database seeded successfully");
      } else {
        // If admin exists, ensure it has a shopId
        const admin = existingAdmin[0];
        if (!admin.shopId) {
          await db.update(users).set({ shopId: shop.id }).where(eq(users.id, admin.id));
          console.log(`[SEED] Assigned shopId ${shop.id} to admin user.`);
        }
        // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 chars long
        const isBcrypt = typeof admin.password === 'string' && admin.password.length === 60 && admin.password.startsWith('$2');
        if (!isBcrypt) {
          const hashedPassword = await bcrypt.hash("admin123", 10);
          await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.username, "admin"));
          console.log("[SEED] Updated admin password to bcrypt hash.");
        }
      }
    } catch (error) {
      console.error("Failed to seed database:", error);
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...userData,
      role: userData.role || "customer",
    }).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Categories
  async getCategories(shopId: number): Promise<Category[]> {
    return await db.select().from(categories).where(
      and(
        eq(categories.isActive, true),
        eq(categories.shopId, shopId)
      )
    );
  }

  async getCategory(id: number, shopId: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(
      and(
        eq(categories.id, id),
        eq(categories.shopId, shopId)
      )
    ).limit(1);
    return result[0];
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values({
      ...categoryData,
      isActive: categoryData.isActive ?? true,
    }).returning();
    return result[0];
  }

  async updateCategory(id: number, shopId: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories).set(updateData).where(
      and(
        eq(categories.id, id),
        eq(categories.shopId, shopId)
      )
    ).returning();
    return result[0];
  }

  async deleteCategory(id: number, shopId: number): Promise<boolean> {
    const result = await db.delete(categories).where(
      and(
        eq(categories.id, id),
        eq(categories.shopId, shopId)
      )
    ).returning();
    return result.length > 0;
  }

  // Menu Items
  async getMenuItems(shopId: number, categoryId?: number): Promise<MenuItemWithCategory[]> {
    let query = db.select({
      ...menuItems,
      category: categories
    })
    .from(menuItems)
    .leftJoin(categories, eq(menuItems.categoryId, categories.id))
    .where(eq(menuItems.shopId, shopId));

    if (categoryId) {
      query = query.where(eq(menuItems.categoryId, categoryId));
    }
    
    // No limit on the number of menu items returned
    return await query;
  }

  async getMenuItem(id: number, shopId: number): Promise<MenuItemWithCategory | undefined> {
    const result = await db.select({
      ...menuItems,
      category: categories
    })
    .from(menuItems)
    .leftJoin(categories, eq(menuItems.categoryId, categories.id))
    .where(and(
      eq(menuItems.id, id),
      eq(menuItems.shopId, shopId)
    ))
    .limit(1);
    
    return result[0];
  }

  async createMenuItem(menuItemData: InsertMenuItem): Promise<MenuItem> {
    const result = await db.insert(menuItems).values({
      ...menuItemData,
      status: menuItemData.status || "available",
    }).returning();
    return result[0];
  }

  async updateMenuItem(id: number, shopId: number, updateData: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const result = await db.update(menuItems).set(updateData).where(
      and(
        eq(menuItems.id, id),
        eq(menuItems.shopId, shopId)
      )
    ).returning();
    return result[0];
  }

  async deleteMenuItem(id: number, shopId: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(
      and(
        eq(menuItems.id, id),
        eq(menuItems.shopId, shopId)
      )
    ).returning();
    return result.length > 0;
  }

  async searchMenuItems(query: string, shopId: number): Promise<MenuItem[]> {
    return await db.select().from(menuItems).where(
      and(
        eq(menuItems.shopId, shopId),
        or(
          like(menuItems.name, `%${query}%`),
          like(menuItems.description, `%${query}%`)
        )
      )
    );
  }

  // Cart Operations - using database instead of in-memory storage
  async getCartItems(sessionId: string): Promise<CartItem[]> {
    // For this admin dashboard, we might want to implement cart operations differently
    // For now, return empty array as admin typically doesn't manage customer carts
    return [];
  }

  async addToCart(cartItem: InsertCartItem): Promise<void> {
    // Admin dashboard typically doesn't need cart functionality
    // This is mainly for the customer-facing Client_QR app
    console.warn("Cart operations are not implemented for admin dashboard");
  }

  async updateCartItemQuantity(sessionId: string, menuItemId: number, quantity: number): Promise<CartItem | undefined> {
    console.warn("Cart operations are not implemented for admin dashboard");
    return undefined;
  }

  async removeFromCart(sessionId: string, menuItemId: number): Promise<boolean> {
    console.warn("Cart operations are not implemented for admin dashboard");
    return false;
  }

  async clearCart(sessionId: string): Promise<void> {
    console.warn("Cart operations are not implemented for admin dashboard");
  }

  // Orders
  async getOrders(shopId: number, status?: string): Promise<OrderWithItems[]> {
    const filters = [eq(orders.shopId, shopId)];
    if (status) {
      filters.push(eq(orders.status, status));
    }
    const result = await db.select().from(orders).where(and(...filters)).orderBy(desc(orders.createdAt));
    const populatedOrders = await Promise.all(result.map(order => this.populateOrder(order)));
    return populatedOrders;
  }

  async getOrder(id: number, shopId: number): Promise<OrderWithItems | undefined> {
    const result = await db.select().from(orders).where(
      and(
        eq(orders.id, id),
        eq(orders.shopId, shopId)
      )
    ).limit(1);

    const order = result[0];
    if (!order) return undefined;
    return this.populateOrder(order);
  }

  async getUserOrders(userId: number, shopId: number): Promise<OrderWithItems[]> {
    const ordersResult = await db.select().from(orders).where(
      and(
        eq(orders.customerId, userId),
        eq(orders.shopId, shopId)
      )
    );
    return Promise.all(ordersResult.map(order => this.populateOrder(order)));
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const result = await db.insert(orders).values(orderData).returning();
    const order = result[0];

    await db.insert(orderItems).values(
      items.map(item => ({
        ...item,
        orderId: order.id,
      }))
    );

    // Automatically mark the table as occupied when an order is created
    if (order.deskId) {
      console.log(`Auto-marking desk ${order.deskId} as occupied due to new order ${order.id}`);
      try {
        await db.update(desks)
          .set({ isOccupied: true })
          .where(eq(desks.id, order.deskId));
      } catch (err) {
        console.error(`Error updating desk ${order.deskId} status:`, err);
        // Continue even if desk update fails
      }
    } else if (order.tableNumber) {
      // If we have a table number but no desk ID, try to find the desk by table number
      console.log(`Looking for desk with table number ${order.tableNumber} to mark as occupied`);
      try {
        const deskResult = await db.select()
          .from(desks)
          .where(
            and(
              eq(desks.number, order.tableNumber),
              eq(desks.shopId, order.shopId)
            )
          )
          .limit(1);
        
        if (deskResult.length > 0) {
          const deskId = deskResult[0].id;
          console.log(`Found desk ID ${deskId} for table number ${order.tableNumber}, marking as occupied`);
          await db.update(desks)
            .set({ isOccupied: true })
            .where(eq(desks.id, deskId));
          
          // Also update the order with the desk ID for future reference
          await db.update(orders)
            .set({ deskId: deskId })
            .where(eq(orders.id, order.id));
        } else {
          console.log(`No desk found for table number ${order.tableNumber}, creating a new desk record`);
          // Create a new desk record if one doesn't exist
          try {
            const newDesk = await db.insert(desks).values({
              number: order.tableNumber,
              shopId: order.shopId,
              isOccupied: true,
              capacity: 4, // Default capacity
              name: `Table ${order.tableNumber}`
            }).returning();
            
            if (newDesk.length > 0) {
              console.log(`Created new desk with ID ${newDesk[0].id} for table ${order.tableNumber}`);
              // Update the order with the new desk ID
              await db.update(orders)
                .set({ deskId: newDesk[0].id })
                .where(eq(orders.id, order.id));
            }
          } catch (createErr) {
            console.error(`Error creating new desk for table ${order.tableNumber}:`, createErr);
          }
        }
      } catch (err) {
        console.error(`Error finding/updating desk for table number ${order.tableNumber}:`, err);
        // Continue even if desk update fails
      }
    }

    return this.populateOrder(order);
  }

  async updateOrderStatus(id: number, shopId: number, status: string): Promise<Order | undefined> {
    const result = await db.update(orders).set({ status }).where(
      and(
        eq(orders.id, id),
        eq(orders.shopId, shopId)
      )
    ).returning();
    return result[0];
  }

  private async populateOrder(order: Order): Promise<OrderWithItems> {
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        menuItemId: orderItems.menuItemId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        itemName: orderItems.itemName,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      items,
    };
  }

  // Stats
  async getStats(shopId: number): Promise<{
    todayOrders: number;
    revenue: number;
    activeCustomers: number;
    menuItemsCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, revenue, activeCustomers, menuItemsCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(
          gte(orders.createdAt, today),
          eq(orders.shopId, shopId)
        ))
        .then(result => result[0].count),
      
      db.select({ total: sql<number>`sum(total::numeric)` })
        .from(orders)
        .where(and(
          gte(orders.createdAt, today),
          eq(orders.shopId, shopId)
        ))
        .then(result => result[0].total || 0),
      
      db.select({ count: sql<number>`count(distinct customer_id)` })
        .from(orders)
        .where(and(
          gte(orders.createdAt, today),
          eq(orders.shopId, shopId)
        ))
        .then(result => result[0].count),
      
      db.select({ count: sql<number>`count(*)` })
        .from(menuItems)
        .where(eq(menuItems.shopId, shopId))
        .then(result => result[0].count),
    ]);

    return {
      todayOrders,
      revenue,
      activeCustomers,
      menuItemsCount,
    };
  }

  // Method to update table statuses based on orders
  async updateTableStatusesBasedOnOrders(shopId: number): Promise<void> {
    try {
      console.log(`Checking for tables with active orders in shop ${shopId}`);
      
      // Find all active orders with table numbers
      const activeOrders = await db.select({
        id: orders.id,
        tableNumber: orders.tableNumber,
        deskId: orders.deskId,
        shopId: orders.shopId
      }).from(orders).where(
        and(
          eq(orders.shopId, shopId),
          eq(orders.paid, false),
          or(
            eq(orders.status, "pending"),
            eq(orders.status, "preparing"),
            eq(orders.status, "ready")
          ),
          not(isNull(orders.tableNumber))
        )
      );
      
      console.log(`Found ${activeOrders.length} active orders with table numbers`);
      
      // Process each order to ensure its table is marked as occupied
      for (const order of activeOrders) {
        if (order.tableNumber) {
          // Find the desk by table number
          const deskResult = await db.select().from(desks).where(
            and(
              eq(desks.number, order.tableNumber),
              eq(desks.shopId, shopId)
            )
          ).limit(1);
          
          if (deskResult.length > 0) {
            const desk = deskResult[0];
            
            // If desk exists but is not marked as occupied, update it
            if (!desk.isOccupied) {
              console.log(`Marking desk ${desk.id} (table ${order.tableNumber}) as occupied due to order ${order.id}`);
              await db.update(desks)
                .set({ isOccupied: true })
                .where(eq(desks.id, desk.id));
                
              // If order doesn't have deskId, update it
              if (!order.deskId) {
                await db.update(orders)
                  .set({ deskId: desk.id })
                  .where(eq(orders.id, order.id));
              }
            }
          } else {
            // Table doesn't exist yet, create it
            console.log(`Creating new desk for table ${order.tableNumber} with active order ${order.id}`);
            const newDesk = await db.insert(desks).values({
              number: order.tableNumber,
              shopId: shopId,
              isOccupied: true,
              capacity: 4, // Default capacity
              name: `Table ${order.tableNumber}`
            }).returning();
            
            if (newDesk.length > 0) {
              // Update the order with the new desk ID
              await db.update(orders)
                .set({ deskId: newDesk[0].id })
                .where(eq(orders.id, order.id));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating table statuses based on orders:", error);
    }
  }

  // Table/Desk Management
  async getDesks(shopId: number): Promise<Desk[]> {
    try {
      console.log(`Fetching desks for shop ${shopId}`);
      const desksResult = await db.select().from(desks).where(eq(desks.shopId, shopId));
      
      // First, check for any tables that have orders but are not marked as occupied
      await this.updateTableStatusesBasedOnOrders(shopId);
      
      // For each desk, get its current order and order count
      const desksWithStatus = await Promise.all(desksResult.map(async (desk) => {
        try {
          // Get current active orders for this desk by desk ID or table number
          const currentOrderResult = await db.select().from(orders).where(
            and(
              or(
                eq(orders.deskId, desk.id),
                eq(orders.tableNumber, desk.number)
              ),
              eq(orders.shopId, shopId),
              eq(orders.paid, false),
              or(
                eq(orders.status, "pending"),
                eq(orders.status, "preparing"),
                eq(orders.status, "ready")
              )
            )
          ).limit(1);
          
          // Get total order count for this desk
          const orderCountResult = await db.select({
            count: sql<number>`count(*)`
          }).from(orders).where(
            and(
              or(
                eq(orders.deskId, desk.id),
                eq(orders.tableNumber, desk.number)
              ),
              eq(orders.shopId, shopId)
            )
          );
          
          // Set isOccupied to true if there are any active orders
          const hasActiveOrders = currentOrderResult.length > 0;
          if (hasActiveOrders && !desk.isOccupied) {
            // Update the desk in the database to match reality
            await db.update(desks)
              .set({ isOccupied: true })
              .where(eq(desks.id, desk.id));
            
            console.log(`Updated desk ${desk.id} to occupied status due to active orders`);
            // Update the local desk object too
            desk.isOccupied = true;
          }

          return {
            ...desk,
            currentOrder: currentOrderResult[0] || undefined,
            orderCount: orderCountResult[0].count || 0,
          };
        } catch (err) {
          console.error(`Error processing desk ${desk.id}:`, err);
          // Return the desk with default values if there's an error
          return {
            ...desk,
            currentOrder: undefined,
            orderCount: 0,
          };
        }
      }));
      
      return desksWithStatus;
    } catch (error) {
      console.error("Error fetching desks:", error);
      throw error;
    }
  }

  async getDesk(id: number, shopId: number): Promise<Desk | undefined> {
    try {
      const result = await db.select().from(desks).where(
        and(
          eq(desks.id, id),
          eq(desks.shopId, shopId)
        )
      ).limit(1);
      
      if (result.length === 0) return undefined;
      
      const desk = result[0];
      
      // Get current active order for this desk
      const currentOrderResult = await db.select().from(orders).where(
        and(
          eq(orders.deskId, desk.id),
          eq(orders.paid, false),
          or(
            eq(orders.status, "pending"),
            eq(orders.status, "preparing"),
            eq(orders.status, "ready")
          )
        )
      ).limit(1);
      
      // Get total order count for this desk
      const orderCountResult = await db.select({
        count: sql<number>`count(*)`
      }).from(orders).where(
        or(
          eq(orders.deskId, desk.id),
          eq(orders.tableNumber, desk.number)
        )
      );
      
      return {
        ...desk,
        currentOrder: currentOrderResult[0] || undefined,
        orderCount: orderCountResult[0].count || 0,
      };
    } catch (error) {
      console.error(`Error fetching desk ${id}:`, error);
      throw error;
    }
  }

  async createDesk(deskData: InsertDesk): Promise<Desk> {
    try {
      const result = await db.insert(desks).values(deskData).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating desk:", error);
      throw error;
    }
  }

  async updateDesk(id: number, shopId: number, updateData: Partial<InsertDesk>): Promise<Desk | undefined> {
    try {
      const result = await db.update(desks).set(updateData).where(
        and(
          eq(desks.id, id),
          eq(desks.shopId, shopId)
        )
      ).returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating desk ${id}:`, error);
      throw error;
    }
  }

  async deleteDesk(id: number, shopId: number): Promise<boolean> {
    try {
      // Check if desk has any orders
      const orderCount = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.deskId, id))
        .then(result => result[0].count);
      
      if (orderCount > 0) {
        throw new Error("Cannot delete desk with associated orders");
      }
      
      const result = await db.delete(desks).where(
        and(
          eq(desks.id, id),
          eq(desks.shopId, shopId)
        )
      ).returning();
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting desk ${id}:`, error);
      throw error;
    }
  }

  async toggleDeskStatus(id: number, shopId: number, newStatus: 'available' | 'occupied'): Promise<Desk | undefined> {
    try {
      console.log(`Toggling desk ${id} status to ${newStatus}`);
      
      const isOccupied = newStatus === 'occupied';
      
      const result = await db.update(desks)
        .set({ isOccupied })
        .where(
          and(
            eq(desks.id, id),
            eq(desks.shopId, shopId)
          )
        )
        .returning();
      
      if (result.length === 0) return undefined;
      
      return result[0];
    } catch (error) {
      console.error(`Error toggling desk ${id} status:`, error);
      throw error;
    }
  }

  async completeAndPayDeskOrders(deskId: number): Promise<Order[]> {
    try {
      console.log(`[DEBUG] Starting release process for desk ${deskId}`);
      
      // Get the desk number for this desk ID
      const deskResult = await db
        .select()
        .from(desks)
        .where(eq(desks.id, deskId))
        .limit(1);
      
      let tableNumber = null;
      if (deskResult.length > 0) {
        tableNumber = deskResult[0].number;
        console.log(`[DEBUG] Found table number ${tableNumber} for desk ${deskId}`);
      } else {
        console.log(`[ERROR] Could not find desk with ID ${deskId}`);
      }
      
      // Get active orders for this desk
      const activeOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            or(
              eq(orders.deskId, deskId),
              tableNumber ? eq(orders.tableNumber, tableNumber) : sql`false`
            ),
            eq(orders.paid, false),
            or(
              eq(orders.status, "pending"),
              eq(orders.status, "preparing"),
              eq(orders.status, "ready")
            )
          )
        );
      console.log(`[DEBUG] Found ${activeOrders.length} active orders for desk ${deskId}`);
      
      // Begin transaction for update operations
      await db.execute(sql`BEGIN TRANSACTION`);
      
      try {
        // Update all active orders to completed and paid
        console.log(`[DEBUG] Marking orders as completed and paid for desk ${deskId}`);
        const updatedOrders = await db
          .update(orders)
          .set({ 
            status: "completed", 
            paid: true
          })
          .where(
            and(
              or(
                eq(orders.deskId, deskId),
                tableNumber ? eq(orders.tableNumber, tableNumber) : sql`false`
              ),
              eq(orders.paid, false),
              or(
                eq(orders.status, "pending"),
                eq(orders.status, "preparing"),
                eq(orders.status, "ready")
              )
            )
          )
          .returning();
        
        console.log(`[DEBUG] Marked ${updatedOrders.length} orders as completed and paid`);
        
        // Commit transaction
        await db.execute(sql`COMMIT`);
        console.log(`[DEBUG] Transaction committed successfully`);
      } catch (txError) {
        // Rollback transaction on error
        await db.execute(sql`ROLLBACK`);
        console.error(`[ERROR] Transaction failed, rolling back:`, txError);
        throw txError; // Re-throw to be caught by the outer try-catch
      }
      
      console.log(`[DEBUG] Completed order processing for desk ${deskId}`);
      
      return activeOrders;
    } catch (error) {
      console.error("[ERROR] Error completing desk orders:", error);
      return [];
    }
  }
}

export const databaseStorage = new DatabaseStorage();