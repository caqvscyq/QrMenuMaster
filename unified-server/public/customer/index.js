// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/database.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  // admin, staff, customer
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow()
});
var shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true)
});
var menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("available"),
  // available, out_of_stock, disabled
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull().default("0.0"),
  reviewCount: integer("review_count").notNull().default(0),
  isPopular: boolean("is_popular").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow()
});
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id),
  customerId: integer("customer_id").references(() => users.id),
  deskId: integer("desk_id"),
  sessionId: text("session_id"),
  tableNumber: text("table_number"),
  status: text("status").notNull().default("pending"),
  // pending, preparing, ready, completed, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});
var orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  itemName: text("item_name").notNull()
});
var shopAdmins = pgTable("shop_admins", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull().default("manager"),
  // owner, manager, staff
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true
});
var insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true
});
var insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true
});
var insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});

// server/database.ts
import { eq, and, like, or, desc, not } from "drizzle-orm";
var { Pool } = pkg;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool);
console.log("Using DATABASE_URL:", process.env.DATABASE_URL);
var DatabaseStorage = class {
  constructor() {
    this.init();
  }
  async init() {
    try {
      await this.seedData();
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  }
  async seedData() {
    try {
      const existingCategories = await db.select().from(categories).limit(1);
      if (existingCategories.length === 0) {
        const categoriesData = [
          { id: 1, name: "\u9EB5\u985E", description: "\u5404\u5F0F\u9EB5\u689D\u6599\u7406", isActive: true },
          { id: 2, name: "\u98EF\u985E", description: "\u7F8E\u5473\u98EF\u985E\u6599\u7406", isActive: true },
          { id: 3, name: "\u5C0F\u98DF", description: "\u7CBE\u7DFB\u5C0F\u9EDE\u5FC3", isActive: true },
          { id: 4, name: "\u98F2\u54C1", description: "\u6E05\u6DBC\u98F2\u6599", isActive: true }
        ];
        await db.insert(categories).values(categoriesData);
        const sampleItems = [
          {
            name: "\u7D05\u71D2\u725B\u8089\u9EB5",
            description: "\u7CBE\u9078\u725B\u8171\u8089\uFF0C\u642D\u914D\u6FC3\u90C1\u6E6F\u982D",
            price: "280.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.8",
            reviewCount: 156,
            isPopular: true,
            isAvailable: true,
            shopId: 1,
            status: "available"
          },
          {
            name: "\u62DB\u724C\u7092\u98EF",
            description: "\u86CB\u9999\u56DB\u6EA2\uFF0C\u914D\u83DC\u8C50\u5BCC",
            price: "180.00",
            categoryId: 2,
            imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.6",
            reviewCount: 89,
            isPopular: true,
            isAvailable: true,
            shopId: 1,
            status: "available"
          },
          {
            name: "\u9E7D\u9165\u96DE",
            description: "\u9165\u8106\u5916\u76AE\uFF0C\u591A\u6C41\u5167\u9921",
            price: "120.00",
            categoryId: 3,
            imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.7",
            reviewCount: 234,
            isPopular: true,
            isAvailable: true,
            shopId: 1,
            status: "available"
          },
          {
            name: "\u64D4\u4ED4\u9EB5",
            description: "\u53F0\u5357\u50B3\u7D71\u5C0F\u5403\uFF0C\u9BAE\u7F8E\u6E6F\u982D",
            price: "150.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.5",
            reviewCount: 67,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: "available"
          },
          {
            name: "\u9EBB\u8FA3\u725B\u8089\u9EB5",
            description: "\u9999\u8FA3\u904E\u766E\uFF0C\u725B\u8089\u8EDF\u5AE9",
            price: "320.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.9",
            reviewCount: 198,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: "available"
          },
          {
            name: "\u73CD\u73E0\u5976\u8336",
            description: "Q\u5F48\u73CD\u73E0\uFF0C\u9999\u6FC3\u5976\u8336",
            price: "65.00",
            categoryId: 4,
            imageUrl: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.4",
            reviewCount: 145,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: "available"
          },
          {
            name: "\u51AC\u74DC\u8336",
            description: "\u6E05\u9999\u7518\u751C\uFF0C\u6D88\u6691\u89E3\u81A9",
            price: "45.00",
            categoryId: 4,
            imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.3",
            reviewCount: 78,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: "available"
          },
          {
            name: "\u6E05\u71C9\u725B\u8089\u9EB5",
            description: "\u6E05\u6DE1\u6E6F\u982D\uFF0C\u725B\u8089\u9BAE\u7F8E",
            price: "260.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.6",
            reviewCount: 92,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: "available"
          },
          {
            name: "\u991B\u98E9\u9EB5",
            description: "\u624B\u5DE5\u991B\u98E9\uFF0C\u9BAE\u7F8E\u6E6F\u982D",
            price: "180.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.4",
            reviewCount: 73,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: "available"
          },
          {
            name: "\u4E7E\u62CC\u9EB5",
            description: "\u9999\u6FC3\u8089\u71E5\uFF0C\u53E3\u611F\u8C50\u5BCC",
            price: "160.00",
            categoryId: 1,
            imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
            rating: "4.2",
            reviewCount: 54,
            isPopular: false,
            isAvailable: true,
            shopId: 1,
            status: "available"
          }
        ];
        await db.insert(menuItems).values(sampleItems);
        console.log("Client QR Database seeded successfully with Chinese menu items");
      }
    } catch (error) {
      console.error("Failed to seed Client QR database:", error);
    }
  }
  // Menu Items
  async getMenuItems() {
    return await db.select().from(menuItems).where(eq(menuItems.shopId, 1));
  }
  async getMenuItemsByCategory(category) {
    return await db.select().from(menuItems).where(
      and(eq(menuItems.shopId, 1), eq(menuItems.categoryId, category))
    );
  }
  async getMenuItem(id) {
    const result = await db.select().from(menuItems).where(
      and(eq(menuItems.shopId, 1), eq(menuItems.id, id))
    ).limit(1);
    return result[0];
  }
  async searchMenuItems(query) {
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
  async getCartItems(sessionId) {
    const items = await db.select({
      id: cartItems.id,
      sessionId: cartItems.sessionId,
      menuItemId: cartItems.menuItemId,
      quantity: cartItems.quantity,
      createdAt: cartItems.createdAt,
      menuItem: menuItems
    }).from(cartItems).innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id)).where(eq(cartItems.sessionId, sessionId));
    return items.map((item) => ({
      id: item.id,
      sessionId: item.sessionId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      menuItem: item.menuItem
    }));
  }
  async addToCart(item) {
    const existingItem = await db.select().from(cartItems).where(
      and(
        eq(cartItems.sessionId, item.sessionId),
        eq(cartItems.menuItemId, item.menuItemId)
      )
    ).limit(1);
    if (existingItem.length > 0) {
      const updated = await db.update(cartItems).set({ quantity: existingItem[0].quantity + (item.quantity || 1) }).where(eq(cartItems.id, existingItem[0].id)).returning();
      return updated[0];
    } else {
      const inserted = await db.insert(cartItems).values(item).returning();
      return inserted[0];
    }
  }
  async updateCartItemQuantity(sessionId, menuItemId, quantity) {
    if (quantity === 0) {
      await this.removeFromCart(sessionId, menuItemId);
      return void 0;
    }
    const updated = await db.update(cartItems).set({ quantity }).where(
      and(
        eq(cartItems.sessionId, sessionId),
        eq(cartItems.menuItemId, menuItemId)
      )
    ).returning();
    return updated[0];
  }
  async removeFromCart(sessionId, menuItemId) {
    const deleted = await db.delete(cartItems).where(
      and(
        eq(cartItems.sessionId, sessionId),
        eq(cartItems.menuItemId, menuItemId)
      )
    ).returning();
    return deleted.length > 0;
  }
  async clearCart(sessionId) {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }
  // Orders
  async createOrder(order, items) {
    console.log("Creating order:", order);
    console.log("Order items:", items);
    const inserted = await db.insert(orders).values(order).returning();
    const createdOrder = inserted[0];
    if (items.length > 0) {
      const orderItemsWithOrderId = items.map((item) => ({
        orderId: createdOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        itemName: item.itemName
      }));
      console.log("Inserting order items:", orderItemsWithOrderId);
      await db.insert(orderItems).values(orderItemsWithOrderId);
    }
    if (order.sessionId) {
      await this.clearCart(order.sessionId);
    }
    return createdOrder;
  }
  async getOrder(id) {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }
  async getOrderItems(orderId) {
    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      menuItemId: orderItems.menuItemId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      itemName: orderItems.itemName,
      menuItem: menuItems
    }).from(orderItems).innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id)).where(eq(orderItems.orderId, orderId));
    return items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
      itemName: item.itemName,
      menuItem: item.menuItem
    }));
  }
  async getOrdersBySession(sessionId) {
    console.log("Fetching orders for session:", sessionId);
    const ordersList = await db.select().from(orders).where(
      and(
        eq(orders.sessionId, sessionId),
        not(eq(orders.status, "completed"))
      )
    ).orderBy(desc(orders.createdAt));
    console.log("Found orders:", ordersList);
    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        console.log(`Order ${order.id} has ${items.length} items:`, items);
        return {
          ...order,
          items
        };
      })
    );
    return ordersWithItems;
  }
};
var databaseStorage = new DatabaseStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/menu", async (req, res) => {
    try {
      const items = await databaseStorage.getMenuItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });
  app2.get("/api/menu/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const categoryId = parseInt(category);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      const items = await databaseStorage.getMenuItemsByCategory(categoryId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items by category:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });
  app2.get("/api/menu/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      const items = await databaseStorage.searchMenuItems(q);
      res.json(items);
    } catch (error) {
      console.error("Error searching menu items:", error);
      res.status(500).json({ message: "Failed to search menu items" });
    }
  });
  app2.get("/api/menu/:id/similar", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await databaseStorage.getMenuItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      const similarItems = await databaseStorage.getMenuItemsByCategory(item.categoryId || 1);
      const filtered = similarItems.filter((i) => i.id !== itemId).slice(0, 3);
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching similar items:", error);
      res.status(500).json({ message: "Failed to fetch similar items" });
    }
  });
  app2.get("/api/cart/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const items = await databaseStorage.getCartItems(sessionId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });
  app2.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      await databaseStorage.addToCart(validatedData);
      const items = await databaseStorage.getCartItems(validatedData.sessionId);
      res.json(items);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: "Failed to add item to cart" });
    }
  });
  app2.patch("/api/cart/:sessionId/:menuItemId", async (req, res) => {
    try {
      const { sessionId, menuItemId } = req.params;
      const { quantity } = req.body;
      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      const cartItem = await databaseStorage.updateCartItemQuantity(
        sessionId,
        parseInt(menuItemId),
        quantity
      );
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      res.status(400).json({ message: "Failed to update cart item" });
    }
  });
  app2.delete("/api/cart/:sessionId/:menuItemId", async (req, res) => {
    try {
      const { sessionId, menuItemId } = req.params;
      const success = await databaseStorage.removeFromCart(sessionId, parseInt(menuItemId));
      if (success) {
        res.json({ message: "Item removed from cart" });
      } else {
        res.status(404).json({ message: "Item not found in cart" });
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(400).json({ message: "Failed to remove item from cart" });
    }
  });
  app2.delete("/api/cart/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await databaseStorage.clearCart(sessionId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(400).json({ message: "Failed to clear cart" });
    }
  });
  app2.post("/api/orders", async (req, res) => {
    try {
      const { order, items } = req.body;
      if (!order || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid order data" });
      }
      const validatedOrder = insertOrderSchema.parse(order);
      const createdOrder = await databaseStorage.createOrder(validatedOrder, items);
      res.json(createdOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });
  app2.get("/api/orders/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      const orders2 = await databaseStorage.getOrdersBySession(sessionId);
      res.json(orders2);
    } catch (error) {
      console.error("Error fetching orders by session:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "url";
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: ["localhost", "127.0.0.1"]
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "127.0.0.1",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
