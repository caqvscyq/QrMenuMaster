import { pgTable, text, serial, integer, boolean, decimal, timestamp, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define the user roles enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff', 'manager', 'customer']);

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define the users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id), // nullable to match existing DB
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define the desks table
export const desks = pgTable("desks", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  name: text("name").notNull(),
  status: text("status", { enum: ['available', 'occupied', 'reserved'] }).default('available').notNull(),
  capacity: integer("capacity").default(4),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("available"), // available, out_of_stock, disabled
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull().default("0.0"),
  reviewCount: integer("review_count").notNull().default(0),
  isPopular: boolean("is_popular").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  customizationOptions: json("customization_options").default('[]'), // Array of customization options
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  quantity: integer("quantity").notNull().default(1),
  customizations: json("customizations").default('{}'), // Selected customizations
  specialInstructions: text("special_instructions"), // Additional notes
  customizationCost: decimal("customization_cost", { precision: 10, scale: 2 }).default("0.00"), // Total cost of customizations
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  customerId: integer("customer_id").references(() => users.id),
  deskId: integer("desk_id").references(() => desks.id),
  sessionId: text("session_id"),
  tableNumber: text("table_number"),
  status: text("status").notNull().default("pending"), // pending, preparing, ready, completed, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paid: boolean("paid").default(false).notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  itemName: text("item_name").notNull(),
  customizations: json("customizations").default('{}'), // Selected customizations
  specialInstructions: text("special_instructions"), // Additional notes
  customizationCost: decimal("customization_cost", { precision: 10, scale: 2 }).default("0.00"), // Total cost of customizations
  createdAt: timestamp("created_at").defaultNow(),
});

export const shopAdmins = pgTable("shop_admins", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull().default("manager"), // owner, manager, staff
  createdAt: timestamp("created_at").defaultNow(),
});

// Sessions table for database-based session management
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  tableNumber: text("table_number").notNull(),
  deskId: integer("desk_id").references(() => desks.id),
  shopId: integer("shop_id").references(() => shops.id).notNull().default(1),
  status: text("status", { enum: ['active', 'expired', 'completed'] }).default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  metadata: json("metadata").default('{}'),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users, {
  role: z.enum(userRoleEnum.enumValues),
}).omit({
  id: true,
  createdAt: true,
});

export const insertDeskSchema = createInsertSchema(desks).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems, {
  price: z.string().refine(v => /^\d+(\.\d{1,2})?$/.test(v), {
    message: "Invalid price format"
  }),
}).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
  lastActivity: true,
});

// Select schemas
export const selectUserSchema = createSelectSchema(users);
export const selectDeskSchema = createSelectSchema(desks);
export const selectCategorySchema = createSelectSchema(categories);
export const selectMenuItemSchema = createSelectSchema(menuItems);
export const selectCartItemSchema = createSelectSchema(cartItems);
export const selectOrderSchema = createSelectSchema(orders);
export const selectOrderItemSchema = createSelectSchema(orderItems);
export const selectSessionSchema = createSelectSchema(sessions);

// Types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Desk = z.infer<typeof selectDeskSchema>;
export type InsertDesk = z.infer<typeof insertDeskSchema>;

export type Category = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type MenuItem = z.infer<typeof selectMenuItemSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type CartItem = z.infer<typeof selectCartItemSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = z.infer<typeof selectOrderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = z.infer<typeof selectOrderItemSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Session = z.infer<typeof selectSessionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Extended types for frontend
export type MenuItemWithCategory = MenuItem & {
  category?: Category;
};

export type OrderWithItems = Order & {
  items: (OrderItem & { menuItem?: MenuItem })[];
  customer?: User;
  desk?: Desk;
};

// Extended type for desk with additional status information
export type DeskWithStatus = Desk & {
  number?: string; // Frontend compatibility field (maps to name)
  currentOrder?: Order;
  orderCount?: number;
  isOccupied?: boolean; // Frontend compatibility field
};