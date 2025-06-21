import { relations } from "drizzle-orm/relations";
import { orders, orderItems, menuItems, cartItems, desks, shops, categories, users, shopAdmins } from "./schema";

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	menuItem: one(menuItems, {
		fields: [orderItems.menuItemId],
		references: [menuItems.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	user: one(users, {
		fields: [orders.customerId],
		references: [users.id]
	}),
	shop: one(shops, {
		fields: [orders.shopId],
		references: [shops.id]
	}),
	desk: one(desks, {
		fields: [orders.deskId],
		references: [desks.id]
	}),
}));

export const menuItemsRelations = relations(menuItems, ({one, many}) => ({
	orderItems: many(orderItems),
	cartItems: many(cartItems),
	category: one(categories, {
		fields: [menuItems.categoryId],
		references: [categories.id]
	}),
	shop: one(shops, {
		fields: [menuItems.shopId],
		references: [shops.id]
	}),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	menuItem: one(menuItems, {
		fields: [cartItems.menuItemId],
		references: [menuItems.id]
	}),
	desk: one(desks, {
		fields: [cartItems.deskId],
		references: [desks.id]
	}),
}));

export const desksRelations = relations(desks, ({one, many}) => ({
	cartItems: many(cartItems),
	shop: one(shops, {
		fields: [desks.shopId],
		references: [shops.id]
	}),
	orders: many(orders),
}));

export const shopsRelations = relations(shops, ({many}) => ({
	desks: many(desks),
	menuItems: many(menuItems),
	categories: many(categories),
	orders: many(orders),
	shopAdmins: many(shopAdmins),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	menuItems: many(menuItems),
	shop: one(shops, {
		fields: [categories.shopId],
		references: [shops.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	orders: many(orders),
	shopAdmins: many(shopAdmins),
}));

export const shopAdminsRelations = relations(shopAdmins, ({one}) => ({
	shop: one(shops, {
		fields: [shopAdmins.shopId],
		references: [shops.id]
	}),
	user: one(users, {
		fields: [shopAdmins.userId],
		references: [users.id]
	}),
}));