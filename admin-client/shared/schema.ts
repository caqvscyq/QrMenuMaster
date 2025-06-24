import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // admin, staff, customer
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const desks = pgTable("desks", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id),
  number: text("number").notNull(),
  name: text("name"),
  capacity: integer("capacity").notNull().default(4),
  area: text("area"),
  isActive: boolean("is_active").default(true),
  isOccupied: boolean("is_occupied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const shopAdmins = pgTable("shop_admins", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull().default("manager"), // owner, manager, staff
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
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

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Desk = typeof desks.$inferSelect;
export type InsertDesk = z.infer<typeof insertDeskSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

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
  currentOrder?: Order;
  orderCount?: number;
};
