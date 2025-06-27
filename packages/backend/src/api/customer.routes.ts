import { Router } from 'express';
import { databaseStorage } from '../services/database.service';
import { insertCartItemSchema, insertOrderSchema, insertOrderItemSchema } from '../shared/schema';
import { customerAuth } from '../middleware/auth';
import { cacheMiddleware } from '../config/redis';
import { logger } from '../config/logger';
import { z } from 'zod';

const router = Router();

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// New feature endpoint (no auth required)
router.get('/new-feature', async (req, res) => {
  try {
    // Your new feature logic here
    const data = {
      message: 'This is your new feature!',
      timestamp: new Date().toISOString(),
      features: ['Feature 1', 'Feature 2', 'Feature 3']
    };
    res.json(data);
  } catch (error) {
    logger.error('Error in new feature endpoint:', error);
    res.status(500).json({ message: 'Failed to load new feature' });
  }
});

// Get all menu items (no auth required) - Cache disabled for customization updates
router.get('/menu', async (req, res) => {
  try {
    const shopId = parseInt(req.query.shopId as string) || 1;
    const items = await databaseStorage.getMenuItems(shopId);
    res.json(items);
  } catch (error) {
    logger.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// Get menu items by category (no auth required)
router.get('/menu/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const shopId = parseInt(req.query.shopId as string) || 1;
    const categoryId = parseInt(category);

    if (isNaN(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const items = await databaseStorage.getMenuItems(shopId, categoryId);
    res.json(items);
  } catch (error) {
    logger.error('Error fetching menu items by category:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// Search menu items (no auth required)
router.get('/menu/search', async (req, res) => {
  try {
    const { q } = req.query;
    const shopId = parseInt(req.query.shopId as string) || 1;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const items = await databaseStorage.searchMenuItems(q, shopId);
    res.json(items);
  } catch (error) {
    logger.error('Error searching menu items:', error);
    res.status(500).json({ message: 'Failed to search menu items' });
  }
});

// Get a specific menu item (no auth required)
router.get('/menu/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const shopId = parseInt(req.query.shopId as string) || 1;
    
    if (isNaN(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    
    const item = await databaseStorage.getMenuItem(itemId, shopId);
    
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(item);
  } catch (error) {
    logger.error('Error fetching menu item:', error);
    res.status(500).json({ message: 'Failed to fetch menu item' });
  }
});

// Get similar menu items (based on category, no auth required)
router.get('/menu/:id/similar', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const shopId = parseInt(req.query.shopId as string) || 1;

    if (isNaN(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await databaseStorage.getMenuItem(itemId, shopId);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (!item.categoryId) {
      return res.json([]);
    }

    const similarItems = await databaseStorage.getMenuItems(shopId, item.categoryId);

    // Filter out the current item and limit to 3 similar items
    const filtered = similarItems
      .filter(i => i.id !== itemId)
      .slice(0, 3);

    res.json(filtered);
  } catch (error) {
    logger.error('Error fetching similar items:', error);
    res.status(500).json({ message: 'Failed to fetch similar items' });
  }
});

// Apply customer authentication middleware to all routes below (cart and orders require auth)
router.use(customerAuth as any);

// Get cart items
router.get('/cart', async (req, res) => {
  const startTime = Date.now();
  try {
    const { sessionId } = req as any;
    logger.info(`🔍 [CART LATENCY] Backend: Starting cart fetch for session: ${sessionId}`);

    const dbStartTime = Date.now();
    const items = await databaseStorage.getCartItems(sessionId);
    const dbEndTime = Date.now();

    logger.info(`⏱️ [CART LATENCY] Backend: Database query took: ${dbEndTime - dbStartTime}ms`);
    logger.info(`📦 [CART LATENCY] Backend: Returning ${items.length} cart items`);

    // Calculate correct totals to prevent frontend pricing discrepancies
    const enrichedItems = items.map(item => {
      const basePrice = parseFloat(item.menuItem.price);
      const customizationCost = parseFloat(item.customizationCost || '0');
      const totalItemPrice = (basePrice + customizationCost) * item.quantity;
      
      return {
        ...item,
        // Ensure customizationCost is properly formatted for frontend
        customizationCost: customizationCost.toFixed(2),
        // Add calculated totals to prevent frontend calculation errors
        calculatedPrice: totalItemPrice.toFixed(2),
        basePrice: basePrice.toFixed(2)
      };
    });

    res.json(enrichedItems);

    const totalTime = Date.now() - startTime;
    logger.info(`✅ [CART LATENCY] Backend: Cart fetch completed in: ${totalTime}ms`);
  } catch (error) {
    logger.error('❌ [CART LATENCY] Backend: Error fetching cart items:', error);
    res.status(500).json({ message: 'Failed to fetch cart items' });
  }
});

// Add item to cart
router.post('/cart', async (req, res) => {
  const startTime = Date.now();
  try {
    const { sessionId } = req as any;
    const { menuItemId, quantity, customizations, specialInstructions } = req.body;

    logger.info(`🚀 [CART LATENCY] Backend: Starting add to cart for session: ${sessionId}, item: ${menuItemId}`);

    try {
      const validationStartTime = Date.now();
      const validatedData = insertCartItemSchema.parse({
        sessionId,
        menuItemId,
        quantity: quantity || 1,
        customizations: customizations || {},
        specialInstructions: specialInstructions || null
      });
      const validationEndTime = Date.now();

      logger.info(`⚡ [CART LATENCY] Backend: Validation took: ${validationEndTime - validationStartTime}ms`);

      const addStartTime = Date.now();
      await databaseStorage.addToCart(validatedData);
      const addEndTime = Date.now();

      logger.info(`💾 [CART LATENCY] Backend: Add to cart DB operation took: ${addEndTime - addStartTime}ms`);

      // Return the full cart
      const fetchStartTime = Date.now();
      const items = await databaseStorage.getCartItems(sessionId);
      const fetchEndTime = Date.now();

      logger.info(`📡 [CART LATENCY] Backend: Cart refetch took: ${fetchEndTime - fetchStartTime}ms`);
      logger.info(`📦 [CART LATENCY] Backend: Returning ${items.length} cart items`);

      // Calculate correct totals to prevent frontend pricing discrepancies
      const enrichedItems = items.map(item => {
        const basePrice = parseFloat(item.menuItem.price);
        const customizationCost = parseFloat(item.customizationCost || '0');
        const totalItemPrice = (basePrice + customizationCost) * item.quantity;
        
        return {
          ...item,
          // Ensure customizationCost is properly formatted for frontend
          customizationCost: customizationCost.toFixed(2),
          // Add calculated totals to prevent frontend calculation errors
          calculatedPrice: totalItemPrice.toFixed(2),
          basePrice: basePrice.toFixed(2)
        };
      });

      res.json(enrichedItems);

      const totalTime = Date.now() - startTime;
      logger.info(`✅ [CART LATENCY] Backend: Add to cart completed in: ${totalTime}ms`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('❌ [CART LATENCY] Backend: Validation error:', error.errors);
        return res.status(400).json({ message: 'Invalid cart data', errors: error.errors });
      }
      throw error;
    }
  } catch (error) {
    logger.error('❌ [CART LATENCY] Backend: Error adding to cart:', error);
    res.status(400).json({ message: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
router.patch('/cart/:menuItemId', async (req, res) => {
  try {
    const { sessionId } = req as any;
    const menuItemId = parseInt(req.params.menuItemId);
    const { quantity } = req.body;
    
    if (isNaN(menuItemId)) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }
    
    const cartItem = await databaseStorage.updateCartItemQuantity(
      sessionId,
      menuItemId,
      quantity
    );
    
    res.json(cartItem || { removed: true });
  } catch (error) {
    logger.error('Error updating cart item quantity:', error);
    res.status(400).json({ message: 'Failed to update cart item' });
  }
});

// Remove item from cart
router.delete('/cart/:menuItemId', async (req, res) => {
  try {
    const { sessionId } = req as any;
    const menuItemId = parseInt(req.params.menuItemId);
    
    if (isNaN(menuItemId)) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    
    const success = await databaseStorage.removeFromCart(sessionId, menuItemId);
    
    if (success) {
      res.json({ message: 'Item removed from cart' });
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    logger.error('Error removing from cart:', error);
    res.status(400).json({ message: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/cart', async (req, res) => {
  try {
    const { sessionId } = req as any;
    await databaseStorage.clearCart(sessionId);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    logger.error('Error clearing cart:', error);
    res.status(400).json({ message: 'Failed to clear cart' });
  }
});

// Create order
router.post('/orders', async (req, res) => {
  try {
    const { sessionId } = req as any;
    const { order, items } = req.body;

    if (!order || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid order data' });
    }

    try {
      const shopId = parseInt(req.query.shopId as string) || 1;

      // Ensure the order has the session ID and shop ID
      const validatedOrder = insertOrderSchema.parse({
        ...order,
        sessionId,
        shopId
      });

      // Validate each order item to ensure customizationCost is preserved
      const validatedItems = items.map(item => {
        return insertOrderItemSchema.parse({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          itemName: item.itemName,
          customizations: item.customizations || {},
          specialInstructions: item.specialInstructions || null,
          customizationCost: item.customizationCost || "0.00"
        });
      });

      console.log('✅ Order validation successful');
      console.log('   Validated order:', validatedOrder);
      console.log('   Validated items:', validatedItems);

      const createdOrder = await databaseStorage.createOrder(validatedOrder, validatedItems);

      res.json(createdOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Order validation failed:', error.errors);
        return res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(400).json({ message: 'Failed to create order' });
  }
});

// Get orders by session ID
router.get('/orders', async (req, res) => {
  try {
    const { sessionId } = req as any;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    logger.info(`Fetching orders for session: ${sessionId}`);
    const orders = await databaseStorage.getOrdersBySession(sessionId);
    logger.info(`Found ${orders.length} orders for session: ${sessionId}`);

    // Log order items with customization data for debugging
    orders.forEach(order => {
      logger.info(`Order ${order.id} has ${order.items.length} items`);
      order.items.forEach(item => {
        logger.info(`  Item: ${item.itemName}, Price: ${item.price}, CustomizationCost: ${item.customizationCost || '0.00'}`);
      });
    });

    res.json(orders);
  } catch (error) {
    logger.error('Error fetching orders by session:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get orders by session ID (alternative route for compatibility)
// This route bypasses the customerAuth middleware for direct session access
router.get('/orders/session/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        message: 'Session ID is required',
        error: 'MISSING_SESSION_ID'
      });
    }

    // Validate session ID format - support both old and new formats
    const newFormatPattern = /^session-[A-Za-z0-9_-]+-\d{13}-[A-Za-z0-9]{6,15}$/;
    const oldFormatPattern = /^session-\d{13}-[A-Za-z0-9]{6,15}$/;

    if (!newFormatPattern.test(sessionId) && !oldFormatPattern.test(sessionId)) {
      logger.warn(`Invalid session ID format: ${sessionId}`);
      return res.status(400).json({
        message: 'Invalid session ID format. Expected format: session-{table}-{timestamp}-{random} or session-{timestamp}-{random}',
        error: 'INVALID_SESSION_FORMAT',
        providedSessionId: sessionId,
        expectedFormat: 'session-{table}-{timestamp}-{random} or session-{timestamp}-{random}',
        suggestion: 'Please clear your browser storage and refresh the page to get a new session'
      });
    }

    // Log warning for old format usage
    if (oldFormatPattern.test(sessionId)) {
      logger.warn(`Using old session ID format: ${sessionId} - consider updating to new format`);
    }

    // Import SessionService to validate session exists and is active
    const { SessionService } = await import('../services/session.service');
    const session = await SessionService.getSession(sessionId);

    if (!session) {
      logger.warn(`Session not found or expired: ${sessionId}`);
      return res.status(401).json({
        message: 'Session not found or expired',
        error: 'SESSION_NOT_FOUND',
        sessionId: sessionId
      });
    }

    logger.info(`Fetching orders for session: ${sessionId}`);
    const orders = await databaseStorage.getOrdersBySession(sessionId);
    logger.info(`Found ${orders.length} orders for session: ${sessionId}`);
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching orders by session:', error);
    res.status(500).json({
      message: 'Failed to fetch orders',
      error: 'INTERNAL_ERROR'
    });
  }
});

// Get a specific order
router.get('/orders/:id', async (req, res) => {
  try {
    const { sessionId } = req as any;
    const orderId = parseInt(req.params.id);
    const shopId = parseInt(req.query.shopId as string) || 1;
    
    if (isNaN(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    const order = await databaseStorage.getOrder(orderId, shopId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Ensure the order belongs to the current session
    if (order.sessionId !== sessionId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

export default router; 