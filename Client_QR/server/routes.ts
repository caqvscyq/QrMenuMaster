import type { Express } from "express";
import { createServer, type Server } from "http";
import { databaseStorage as storage } from "./database";
import { insertCartItemSchema, insertOrderSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all menu items
  app.get("/api/menu", async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  // Get menu items by category
  app.get("/api/menu/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const categoryId = parseInt(category);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      const items = await storage.getMenuItemsByCategory(categoryId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items by category:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  // Search menu items
  app.get("/api/menu/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const items = await storage.searchMenuItems(q);
      res.json(items);
    } catch (error) {
      console.error("Error searching menu items:", error);
      res.status(500).json({ message: "Failed to search menu items" });
    }
  });

  // Get similar menu items (based on category)
  app.get("/api/menu/:id/similar", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getMenuItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      const similarItems = await storage.getMenuItemsByCategory(item.categoryId || 1);
      // Filter out the current item and limit to 3 similar items
      const filtered = similarItems
        .filter(i => i.id !== itemId)
        .slice(0, 3);
      
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching similar items:", error);
      res.status(500).json({ message: "Failed to fetch similar items" });
    }
  });

  // Get cart items
  app.get("/api/cart/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const items = await storage.getCartItems(sessionId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  // Add item to cart
  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      await storage.addToCart(validatedData);
      // Return the full cart for the session
      const items = await storage.getCartItems(validatedData.sessionId);
      res.json(items);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: "Failed to add item to cart" });
    }
  });

  // Update cart item quantity
  app.patch("/api/cart/:sessionId/:menuItemId", async (req, res) => {
    try {
      const { sessionId, menuItemId } = req.params;
      const { quantity } = req.body;
      
      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const cartItem = await storage.updateCartItemQuantity(
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

  // Remove item from cart
  app.delete("/api/cart/:sessionId/:menuItemId", async (req, res) => {
    try {
      const { sessionId, menuItemId } = req.params;
      const success = await storage.removeFromCart(sessionId, parseInt(menuItemId));
      
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

  // Clear cart
  app.delete("/api/cart/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.clearCart(sessionId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(400).json({ message: "Failed to clear cart" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const { order, items } = req.body;
      
      if (!order || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid order data" });
      }
      
      const validatedOrder = insertOrderSchema.parse(order);
      const createdOrder = await storage.createOrder(validatedOrder, items);
      
      res.json(createdOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  // Get orders by session ID
  app.get("/api/orders/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      const orders = await storage.getOrdersBySession(sessionId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders by session:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
