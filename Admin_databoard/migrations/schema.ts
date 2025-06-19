import { pgTable, foreignKey, serial, integer, numeric, text, timestamp, boolean, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const orderItems = pgTable("order_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id"),
	menuItemId: integer("menu_item_id"),
	quantity: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	itemName: text("item_name").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.menuItemId],
			foreignColumns: [menuItems.id],
			name: "order_items_menu_item_id_menu_items_id_fk"
		}),
]);

export const cartItems = pgTable("cart_items", {
	id: serial().primaryKey().notNull(),
	sessionId: text("session_id").notNull(),
	menuItemId: integer("menu_item_id"),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	deskId: integer("desk_id"),
}, (table) => [
	foreignKey({
			columns: [table.menuItemId],
			foreignColumns: [menuItems.id],
			name: "cart_items_menu_item_id_menu_items_id_fk"
		}),
	foreignKey({
			columns: [table.deskId],
			foreignColumns: [desks.id],
			name: "cart_items_desk_id_desks_id_fk"
		}),
]);

export const desks = pgTable("desks", {
	id: serial().primaryKey().notNull(),
	shopId: integer("shop_id"),
	number: text().notNull(),
	name: text(),
	capacity: integer().default(4).notNull(),
	area: text(),
	isActive: boolean("is_active").default(true),
	isOccupied: boolean("is_occupied").default(false),
	qrCode: text("qr_code"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.shopId],
			foreignColumns: [shops.id],
			name: "desks_shop_id_shops_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	role: text().default('customer').notNull(),
	email: text(),
	phone: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const menuItems = pgTable("menu_items", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	categoryId: integer("category_id"),
	imageUrl: text("image_url").notNull(),
	status: text().default('available').notNull(),
	rating: numeric({ precision: 3, scale:  1 }).default('0.0').notNull(),
	reviewCount: integer("review_count").default(0).notNull(),
	isPopular: boolean("is_popular").default(false).notNull(),
	isAvailable: boolean("is_available").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	shopId: integer("shop_id"),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "menu_items_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.shopId],
			foreignColumns: [shops.id],
			name: "menu_items_shop_id_shops_id_fk"
		}),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	shopId: integer("shop_id"),
}, (table) => [
	foreignKey({
			columns: [table.shopId],
			foreignColumns: [shops.id],
			name: "categories_shop_id_shops_id_fk"
		}),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	customerId: integer("customer_id"),
	sessionId: text("session_id"),
	tableNumber: text("table_number"),
	status: text().default('pending').notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	serviceFee: numeric("service_fee", { precision: 10, scale:  2 }).default('0.00').notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	customerName: text("customer_name"),
	customerPhone: text("customer_phone"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	shopId: integer("shop_id"),
	deskId: integer("desk_id"),
	paid: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [users.id],
			name: "orders_customer_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.shopId],
			foreignColumns: [shops.id],
			name: "orders_shop_id_shops_id_fk"
		}),
	foreignKey({
			columns: [table.deskId],
			foreignColumns: [desks.id],
			name: "orders_desk_id_desks_id_fk"
		}),
]);

export const shops = pgTable("shops", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	address: text(),
	phone: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("shops_name_unique").on(table.name),
]);

export const shopAdmins = pgTable("shop_admins", {
	id: serial().primaryKey().notNull(),
	shopId: integer("shop_id"),
	userId: integer("user_id"),
	role: text().default('manager').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.shopId],
			foreignColumns: [shops.id],
			name: "shop_admins_shop_id_shops_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "shop_admins_user_id_users_id_fk"
		}),
]);
