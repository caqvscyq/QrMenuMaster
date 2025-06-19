import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { databaseStorage as storage } from "./database";
import { 
  insertUserSchema, 
  insertMenuItemSchema, 
  insertOrderSchema, 
  insertCategorySchema,
  insertCartItemSchema,
  type User,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import pg from 'pg';

interface AuthRequest extends Request {
  user?: User;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const authMiddleware = (requireAdminRole = false) => async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.headers.authorization?.replace('Bearer ', '');
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(401).json({ error: "Invalid token or user not found" });
      }

      if (requireAdminRole && user.role !== 'admin' && user.role !== 'staff') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      if (!user.shopId) {
        return res.status(403).json({ error: "User is not associated with a shop" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Internal server error during authentication" });
    }
  };

  // Add CORS headers middleware for authentication endpoints
  const addAuthCorsHeaders = (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  };

  // Database status endpoint
  app.get("/api/db-status", addAuthCorsHeaders, async (req, res) => {
    try {
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      });
      
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      
      res.json({ 
        connected: true, 
        url: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@') // Hide password in URL
      });
    } catch (error) {
      console.error("Database connection check failed:", error);
      res.json({ 
        connected: false, 
        error: (error as Error).message,
        url: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@') // Hide password in URL
      });
    }
  });

  // Stats endpoint
  app.get("/api/stats", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const stats = await storage.getStats(req.user!.shopId!);
      res.set('Cache-Control', 'no-store');
      res.json(stats);
    } catch (error) {
      console.error("Failed to get stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Menu items endpoint (without auth for dashboard display)
  app.get("/api/menu-items", authMiddleware(false), async (req: AuthRequest, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const menuItems = await storage.getMenuItems(req.user!.shopId!, categoryId);
      res.set('Cache-Control', 'no-store');
      res.json(menuItems);
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  // Orders endpoint (without auth for dashboard display)
  app.get("/api/orders", authMiddleware(false), async (req: AuthRequest, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const orders = await storage.getOrders(req.user!.shopId!, status);
      res.set('Cache-Control', 'no-store');
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Admin Auth routes
  app.post("/api/admin/auth/login", addAuthCorsHeaders, async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      console.log("[DEBUG] Login attempt:", { username, password, user });
      if (!user) {
        console.log("[DEBUG] No user found for username:", username);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log("[DEBUG] bcrypt.compare result:", passwordMatch, "(input:", `'${password}'`, `length:${password.length}`, ", hash:", `'${user.password}'`, `length:${user.password.length}`, ")");
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Set session cookie with long expiration
      const token = user.id.toString();
      
      res.json({ 
        user: { ...user, password: undefined },
        token: token
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existing = await storage.getUserByUsername(userData.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ 
        user: { ...user, password: undefined },
        token: user.id.toString() 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.get("/api/admin/auth/me", addAuthCorsHeaders, authMiddleware(false), async (req: AuthRequest, res) => {
    try {
      res.json({ ...req.user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Admin Categories routes
  app.get("/api/admin/categories", authMiddleware(true), async (req: AuthRequest, res) => {
    try {
      const categories = await storage.getCategories(req.user!.shopId!);
      res.set('Cache-Control', 'no-store');
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse({ ...req.body, shopId: req.user!.shopId! });
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Admin Menu items routes
  app.get("/api/admin/menu-items", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const menuItems = await storage.getMenuItems(req.user!.shopId!, categoryId);
      res.set('Cache-Control', 'no-store');
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.get("/api/admin/menu-items/:id", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const menuItem = await storage.getMenuItem(id, req.user!.shopId!);
      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.set('Cache-Control', 'no-store');
      res.json(menuItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu item" });
    }
  });

  app.post("/api/admin/menu-items", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const menuItemData = insertMenuItemSchema.parse({ ...req.body, shopId: req.user!.shopId! });
      const menuItem = await storage.createMenuItem(menuItemData);
      res.json(menuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid menu item data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  app.put("/api/admin/menu-items/:id", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const menuItem = await storage.updateMenuItem(id, req.user!.shopId!, updateData);
      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json(menuItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update menu item" });
    }
  });

  app.delete("/api/admin/menu-items/:id", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenuItem(id, req.user!.shopId!);
      if (!success) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // Admin Orders routes
  app.get("/api/admin/orders", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      let orders;
      if (user.role === 'admin' || user.role === 'staff') {
        const status = req.query.status as string | undefined;
        orders = await storage.getOrders(user.shopId!, status);
      } else {
        orders = await storage.getUserOrders(user.id, user.shopId!);
      }
      
      res.set('Cache-Control', 'no-store');
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/orders/:id", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id, req.user!.shopId!);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const user = req.user!;

      // Check if user can access this order
      if (user.role === 'customer' && order.customerId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.set('Cache-Control', 'no-store');
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Client Menu routes
  app.get("/api/menu", async (req, res) => {
    try {
      // Get shopId from query parameter or default to 1
      const shopId = req.query.shopId ? parseInt(req.query.shopId as string) : 1;
      const items = await storage.getMenuItems(shopId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      // Get shopId from query parameter or default to 1
      const shopId = req.query.shopId ? parseInt(req.query.shopId as string) : 1;
      const categoryId = parseInt(category);
      const items = await storage.getMenuItems(shopId, categoryId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items by category:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu/search", async (req, res) => {
    try {
      const { q } = req.query;
      // Get shopId from query parameter or default to 1
      const shopId = req.query.shopId ? parseInt(req.query.shopId as string) : 1;
      
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const items = await storage.searchMenuItems(q, shopId);
      res.json(items);
    } catch (error) {
      console.error("Error searching menu items:", error);
      res.status(500).json({ message: "Failed to search menu items" });
    }
  });

  app.get("/api/menu/:id/similar", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      // Get shopId from query parameter or default to 1
      const shopId = req.query.shopId ? parseInt(req.query.shopId as string) : 1;
      const item = await storage.getMenuItem(itemId, shopId);
      
      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }
        
      const similarItems = await storage.getMenuItems(shopId, item.categoryId || undefined);
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

  // Client Cart routes
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

  app.post("/api/cart", async (req, res) => {
    try {
      const cartItemData = insertCartItemSchema.parse(req.body);
      await storage.addToCart(cartItemData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put("/api/cart", async (req, res) => {
    try {
      const { sessionId, menuItemId, quantity } = req.body;
      const item = await storage.updateCartItemQuantity(sessionId, menuItemId, quantity);
      res.json(item);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      const { sessionId, menuItemId } = req.body;
      const success = await storage.removeFromCart(sessionId, menuItemId);
      res.json({ success });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Client Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      const { orderData, items } = req.body;
      const order = await storage.createOrder(orderData, items);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id/status", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await storage.updateOrderStatus(parseInt(id), req.user!.shopId!, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Categories endpoint
  app.get("/api/categories", authMiddleware(false), async (req: AuthRequest, res: Response) => {
    try {
      const categories = await storage.getCategories(req.user!.shopId!);
      res.set('Cache-Control', 'no-store');
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Table/Desk Management routes
  app.get("/api/admin/desks", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      // First update table statuses based on orders
      await storage.updateTableStatusesBasedOnOrders(req.user!.shopId!);
      
      // Then fetch the updated desk data
      const desks = await storage.getDesks(req.user!.shopId!);
      res.set('Cache-Control', 'no-store');
      res.json(desks);
    } catch (error) {
      console.error("Failed to fetch desks:", error);
      res.status(500).json({ error: "Failed to fetch desks" });
    }
  });
  
  // Endpoint to manually check and update table statuses
  app.post("/api/admin/desks/check-status", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      await storage.updateTableStatusesBasedOnOrders(req.user!.shopId!);
      res.json({ success: true, message: "Table statuses updated based on orders" });
    } catch (error) {
      console.error("Failed to update table statuses:", error);
      res.status(500).json({ error: "Failed to update table statuses" });
    }
  });

  app.get("/api/admin/desks/:id", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const desk = await storage.getDesk(id, req.user!.shopId!);
      if (!desk) {
        return res.status(404).json({ error: "Desk not found" });
      }
      res.set('Cache-Control', 'no-store');
      res.json(desk);
    } catch (error) {
      console.error("Failed to fetch desk:", error);
      res.status(500).json({ error: "Failed to fetch desk" });
    }
  });

  app.post("/api/admin/desks", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const deskData = {
        ...req.body,
        shopId: req.user!.shopId!
      };
      const desk = await storage.createDesk(deskData);
      res.json(desk);
    } catch (error) {
      console.error("Failed to create desk:", error);
      res.status(500).json({ error: "Failed to create desk" });
    }
  });

  app.put("/api/admin/desks/:id", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const desk = await storage.updateDesk(id, req.user!.shopId!, updateData);
      if (!desk) {
        return res.status(404).json({ error: "Desk not found" });
      }
      res.json(desk);
    } catch (error) {
      console.error("Failed to update desk:", error);
      res.status(500).json({ error: "Failed to update desk" });
    }
  });

  app.delete("/api/admin/desks/:id", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDesk(id, req.user!.shopId!);
      if (!success) {
        return res.status(404).json({ error: "Desk not found or could not be deleted" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to delete desk:", error);
      if (error instanceof Error && error.message === "Cannot delete desk with associated orders") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete desk" });
    }
  });

  app.post("/api/admin/desks/:id/toggle-status", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (status !== 'available' && status !== 'occupied') {
        return res.status(400).json({ error: "Invalid status. Must be 'available' or 'occupied'" });
      }
      
      const desk = await storage.toggleDeskStatus(id, req.user!.shopId!, status);
      
      if (!desk) {
        return res.status(404).json({ error: "Desk not found" });
      }
      
      res.json({ 
        success: true,
        message: `Table ${desk.number} has been marked as ${status}`,
        desk
      });
    } catch (error) {
      console.error("Failed to toggle desk status:", error);
      res.status(500).json({ error: "Failed to toggle desk status" });
    }
  });

  app.post("/api/admin/desks/:id/release", authMiddleware(true), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the desk first to check if it exists
      const desk = await storage.getDesk(id, req.user!.shopId!);
      if (!desk) {
        return res.status(404).json({ error: "Desk not found" });
      }
      
      // Complete and pay all orders for this desk (but preserve order history)
      const completedOrders = await storage.completeAndPayDeskOrders(id);
      
      // Update the desk status to available
      await storage.updateDesk(id, req.user!.shopId!, { isOccupied: false });
      
      res.json({
        success: true,
        message: `Table ${desk.number} has been released and is now available`,
        completedOrders
      });
    } catch (error) {
      console.error("Failed to release desk:", error);
      res.status(500).json({ error: "Failed to release desk" });
    }
  });

  const server = createServer(app);
  return server;
}
