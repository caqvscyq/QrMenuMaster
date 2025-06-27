import express from 'express';
import { logger } from '../config/logger';
import { DatabaseStorage } from '../services/database.service';
import { adminAuth } from '../middleware/auth';

const router = express.Router();
const dbService = new DatabaseStorage();

// Database status endpoint
router.get('/db-status', adminAuth, async (req, res) => {
  try {
    logger.info('Admin: Getting database status');

    // Test database connection and get actual counts
    const orders = await dbService.getOrders(1);
    const menuItems = await dbService.getMenuItems(1);
    const categories = await dbService.getCategories(1);
    const users = await dbService.getUsers(1);

    // Return format expected by frontend
    const stats = {
      connected: true,
      url: 'Database connection active',
      timestamp: new Date().toISOString(),
      // Legacy format for backward compatibility
      status: 'connected',
      tables: {
        orders: orders.length,
        menuItems: menuItems.length,
        categories: categories.length,
        users: users.length
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Admin: Error getting database status:', error);
    res.status(500).json({
      connected: false,
      error: 'Database connection failed',
      message: 'Internal server error'
    });
  }
});

// Get all orders
router.get('/orders', adminAuth, async (req, res) => {
  try {
    logger.info('Admin: Getting all orders');
    const orders = await dbService.getOrders(1); // Default to shop 1
    res.json(orders);
  } catch (error) {
    logger.error('Admin: Error getting orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status
router.patch('/orders/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    logger.info(`Admin: Updating order ${id} status to ${status}`);
    const updatedOrder = await dbService.updateOrderStatus(parseInt(id), 1, status);

    if (updatedOrder) {
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    logger.error('Admin: Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status (alternative endpoint for frontend compatibility)
router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    logger.info(`Admin: Updating order ${id} status to ${status} (via PATCH /status endpoint)`);
    const updatedOrder = await dbService.updateOrderStatus(parseInt(id), 1, status);

    if (updatedOrder) {
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    logger.error('Admin: Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status (PUT method for frontend compatibility)
router.put('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    logger.info(`Admin: Updating order ${id} status to ${status} (via PUT /status endpoint)`);
    const updatedOrder = await dbService.updateOrderStatus(parseInt(id), 1, status);

    if (updatedOrder) {
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    logger.error('Admin: Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get categories
router.get('/categories', adminAuth, async (req, res) => {
  try {
    logger.info('Admin: Getting categories');
    const categories = await dbService.getCategories(1); // Default to shop 1
    res.json(categories);
  } catch (error) {
    logger.error('Admin: Error getting categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get menu items
router.get('/menu-items', adminAuth, async (req, res) => {
  try {
    logger.info('Admin: Getting menu items');
    const menuItems = await dbService.getMenuItems(1); // Default to shop 1
    res.json(menuItems);
  } catch (error) {
    logger.error('Admin: Error getting menu items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get popular menu items
router.get('/menu-items/popular', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    logger.info(`Admin: Getting popular menu items (limit: ${limit})`);

    const popularItems = await dbService.getPopularMenuItems(1, limit); // Default to shop 1
    res.json(popularItems);
  } catch (error) {
    logger.error('Admin: Error getting popular menu items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Compatibility route for old frontend that calls /api/admin/popular
router.get('/popular', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    logger.info(`Admin: Getting popular menu items via compatibility route (limit: ${limit})`);

    const popularItems = await dbService.getPopularMenuItems(1, limit); // Default to shop 1
    res.json(popularItems);
  } catch (error) {
    logger.error('Admin: Error getting popular menu items via compatibility route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get weekly top sales items
router.get('/menu-items/weekly-top-sales', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    logger.info(`Admin: Getting weekly top sales items (limit: ${limit})`);

    const weeklyTopSales = await dbService.getWeeklyTopSalesItems(1, limit); // Default to shop 1
    res.json(weeklyTopSales);
  } catch (error) {
    logger.error('Admin: Error getting weekly top sales items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Session cleanup endpoint
router.post('/cleanup-sessions', adminAuth, async (req, res) => {
  try {
    logger.info('Admin: Starting session cleanup');

    // Get all sessions
    const sessions = await dbService.getSessions(1);

    // Identify old format sessions (session-timestamp-random without table number)
    const oldFormatSessions = sessions.filter((session: any) =>
      /^session-\d{13}-[A-Za-z0-9]{6,15}$/.test(session.id)
    );

    // Identify expired sessions (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredSessions = sessions.filter((session: any) =>
      new Date(session.createdAt) < oneDayAgo
    );

    const cleanupResults = {
      totalSessions: sessions.length,
      oldFormatSessions: oldFormatSessions.length,
      expiredSessions: expiredSessions.length,
      cleanedUp: 0,
      errors: [] as string[]
    };

    // Clean up old format sessions
    for (const session of oldFormatSessions) {
      try {
        await dbService.deleteSession(session.id);
        cleanupResults.cleanedUp++;
        logger.info(`Cleaned up old format session: ${session.id}`);
      } catch (error) {
        const errorMsg = `Failed to clean up session ${session.id}: ${error instanceof Error ? error.message : String(error)}`;
        cleanupResults.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    // Clean up expired sessions
    for (const session of expiredSessions) {
      try {
        if (!oldFormatSessions.find((s: any) => s.id === session.id)) { // Don't double-delete
          await dbService.deleteSession(session.id);
          cleanupResults.cleanedUp++;
          logger.info(`Cleaned up expired session: ${session.id}`);
        }
      } catch (error) {
        const errorMsg = `Failed to clean up expired session ${session.id}: ${error instanceof Error ? error.message : String(error)}`;
        cleanupResults.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    logger.info(`Admin: Session cleanup completed. Cleaned up ${cleanupResults.cleanedUp} sessions`);
    res.json(cleanupResults);
  } catch (error) {
    logger.error('Admin: Error during session cleanup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add menu item
router.post('/menu-items', adminAuth, async (req, res) => {
  try {
    logger.info('Admin: Adding menu item');
    const menuItemData = { ...req.body, shopId: 1 }; // Default to shop 1
    const newMenuItem = await dbService.createMenuItem(menuItemData);
    res.json(newMenuItem);
  } catch (error) {
    logger.error('Admin: Error adding menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update menu item
router.patch('/menu-items/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Admin: Updating menu item ${id}`);

    const updatedMenuItem = await dbService.updateMenuItem(parseInt(id), 1, req.body);

    if (updatedMenuItem) {
      res.json(updatedMenuItem);
    } else {
      res.status(404).json({ message: 'Menu item not found' });
    }
  } catch (error) {
    logger.error('Admin: Error updating menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete menu item
router.delete('/menu-items/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Admin: Deleting menu item ${id}`);

    const deleted = await dbService.deleteMenuItem(parseInt(id), 1);

    if (deleted) {
      res.json({ message: 'Menu item deleted successfully' });
    } else {
      res.status(404).json({ message: 'Menu item not found' });
    }
  } catch (error) {
    logger.error('Admin: Error deleting menu item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get desks
router.get('/desks', adminAuth, async (req, res) => {
  try {
    logger.info('Admin: Getting desks');
    const desks = await dbService.getDesks(1); // Default to shop 1
    res.json(desks);
  } catch (error) {
    logger.error('Admin: Error getting desks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new desk/table
router.post('/desks', adminAuth, async (req, res) => {
  try {
    const { number, name, capacity, area } = req.body;

    logger.info(`Admin: Creating new desk/table: ${name || number}`);

    // Validate required fields
    if (!number && !name) {
      return res.status(400).json({ error: 'Table number or name is required' });
    }

    // Create the desk data
    const deskData = {
      name: name || number, // Use name if provided, otherwise use number
      shopId: 1, // Default to shop 1
      capacity: capacity || 4,
      status: 'available' as const,
    };

    const newDesk = await dbService.createDesk(deskData);

    logger.info(`Admin: Created desk/table: ${newDesk.name} (ID: ${newDesk.id})`);

    res.status(201).json(newDesk);
  } catch (error) {
    logger.error('Admin: Error creating desk:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle table status (available/occupied)
router.post('/desks/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const deskId = parseInt(req.params.id);
    const { status } = req.body;

    logger.info(`Admin: Toggling table ${deskId} status to ${status}`);

    if (!status || !['available', 'occupied'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "available" or "occupied"' });
    }

    // Get the desk first to check if it exists
    const desk = await dbService.getDesk(deskId, 1);
    if (!desk) {
      return res.status(404).json({ error: "Desk not found" });
    }

    // Update the desk status
    const updatedDesk = await dbService.toggleDeskStatus(deskId, 1, status);

    if (!updatedDesk) {
      return res.status(404).json({ error: "Failed to update desk status" });
    }

    logger.info(`Admin: Updated table ${desk.name} status to ${status}`);

    res.json({
      success: true,
      message: `Table ${desk.name} has been marked as ${status}`,
      desk: updatedDesk
    });
  } catch (error) {
    logger.error('Admin: Error toggling table status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Release table (complete orders and mark as available)
router.post('/desks/:id/release', adminAuth, async (req, res) => {
  try {
    const deskId = parseInt(req.params.id);
    logger.info(`Admin: Releasing table ${deskId}`);

    // Get the desk first to check if it exists
    const desk = await dbService.getDesk(deskId, 1);
    if (!desk) {
      return res.status(404).json({ error: "Desk not found" });
    }

    // Complete all pending orders for this desk
    const completedOrders = await dbService.completeAndPayDeskOrders(deskId);

    // Update the desk status to available
    await dbService.updateDesk(deskId, 1, { status: 'available' });

    logger.info(`Admin: Released table ${desk.name}, completed ${completedOrders.length} orders`);

    res.json({
      success: true,
      message: `Table ${desk.name} has been released and is now available`,
      completedOrders: completedOrders.length
    });
  } catch (error) {
    logger.error('Admin: Error releasing table:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get analytics/stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    logger.info('Admin: Getting statistics');

    // Use the more accurate SQL-based stats calculation
    const stats = await dbService.getStats(1);

    // Get additional data for backward compatibility if needed
    const orders = await dbService.getOrders(1);
    const categories = await dbService.getCategories(1);

    const extendedStats = {
      // Primary stats from accurate SQL queries
      ...stats,
      // Keep backward compatibility with additional stats
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0),
      activeOrders: orders.filter((order: any) => order.status === 'pending' || order.status === 'preparing').length,
      completedOrders: orders.filter((order: any) => order.status === 'completed').length,
      totalMenuItems: stats.menuItemsCount, // Use the accurate count
      totalCategories: categories.length
    };

    res.json(extendedStats);
  } catch (error) {
    logger.error('Admin: Error getting statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Authentication endpoints
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    logger.info(`Admin: Login attempt for username: ${username}`);

    // Get user from database
    const user = await dbService.getUserByUsername(username);
    if (!user) {
      logger.warn(`Login failed: User not found for username: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logger.warn(`Login failed: Invalid password for username: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user has admin/staff role
    if (user.role !== 'admin' && user.role !== 'staff') {
      logger.warn(`Login failed: User ${username} does not have admin privileges`);
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    // Generate JWT token
    const { generateToken } = await import('../middleware/auth');
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      shopId: user.shopId || 1
    });

    logger.info(`Login successful for admin user: ${username}`);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        shopId: user.shopId || 1
      }
    });
  } catch (error) {
    logger.error('Admin: Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/auth/me', adminAuth, async (req: any, res) => {
  try {
    logger.info('Admin: Getting current user info');

    // User info is attached to request by adminAuth middleware
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    res.json({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      shopId: req.user.shopId
    });
  } catch (error) {
    logger.error('Admin: Error getting user info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/auth/logout', adminAuth, async (req, res) => {
  try {
    logger.info('Admin: User logout');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Admin: Error during logout:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Run migration endpoint
router.post('/run-migration', async (req, res) => {
  try {
    logger.info('Admin: Running database migration');
    await dbService.runMigration();
    res.json({ message: 'Migration completed successfully' });
  } catch (error) {
    logger.error('Admin: Error running migration:', error);
    res.status(500).json({ message: 'Failed to run migration' });
  }
});

export default router;
