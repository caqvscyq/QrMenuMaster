import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { testDatabaseConnection } from './config/database';
import { initRedis } from './config/redis';
import { logger } from './config/logger';
import { initSocketService } from './services/socket.service';
import customerRoutes from './api/customer.routes';
import adminRoutes from './api/admin.routes';
import sessionRoutes from './routes/session.routes';
import { seed } from './db/seed';

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const socketService = initSocketService(server);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://replit.com", "https://cdn.jsdelivr.net", "http://localhost:5000"],
      "script-src-attr": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https://replit.com", "https://images.unsplash.com"],
      "connect-src": ["'self'", "http://localhost:5000", "ws://localhost:5000"]
    },
  },
})); // Security headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || true
    : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.path;
    
    if (path.startsWith('/api')) {
      logger.info(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });
  
  next();
});

// Serve static files first to avoid conflicts with API routes
app.use(express.static(path.join(__dirname, '../public/customer'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));
app.use(express.static(path.join(__dirname, '../public/admin'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// API Routes
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/session', sessionRoutes);

// Debug route (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/debug', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../debug-frontend.html'));
  });
}

// Add route aliases for backward compatibility - direct menu access without auth
app.get('/api/menu', async (req: Request, res: Response) => {
  try {
    const shopId = parseInt(req.query.shopId as string) || 1;
    const { databaseStorage } = await import('./services/database.service');
    const items = await databaseStorage.getMenuItems(shopId);
    res.json(items);
  } catch (error) {
    logger.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// Cart compatibility routes - handle old frontend cart API calls
app.get('/api/cart/:sessionId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  req.headers['x-session-id'] = sessionId;
  req.url = '/cart';
  customerRoutes(req, res, () => {});
});

// Note: Removed problematic session-* catch-all route that was interfering with static files
// If needed, specific session routes should be added with exact patterns

// Handle direct /cart requests (should redirect to customer cart with session)
app.get('/cart', (req: Request, res: Response) => {
  console.log('🔧 Fixing direct /cart request -> /api/customer/cart');
  req.url = '/cart';
  customerRoutes(req, res, () => {});
});

app.post('/api/cart', (req: Request, res: Response) => {
  // Handle both old and new cart API formats
  // Priority: headers first (new format), then body (old format)
  if (!req.headers['x-session-id'] && req.body.sessionId) {
    req.headers['x-session-id'] = req.body.sessionId;
  }
  // Ensure table number header is also passed through
  if (!req.headers['x-table-number'] && req.body.tableNumber) {
    req.headers['x-table-number'] = req.body.tableNumber;
  }
  req.url = '/cart';
  customerRoutes(req, res, () => {});
});

app.patch('/api/cart/:sessionId/:menuItemId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const menuItemId = req.params.menuItemId;
  req.headers['x-session-id'] = sessionId;
  req.url = `/cart/${menuItemId}`;
  customerRoutes(req, res, () => {});
});

app.delete('/api/cart/:sessionId/:menuItemId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const menuItemId = req.params.menuItemId;
  req.headers['x-session-id'] = sessionId;
  req.url = `/cart/${menuItemId}`;
  customerRoutes(req, res, () => {});
});

app.delete('/api/cart/:sessionId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  req.headers['x-session-id'] = sessionId;
  req.url = '/cart';
  customerRoutes(req, res, () => {});
});

// Orders compatibility routes
app.post('/api/orders', (req: Request, res: Response) => {
  // Handle both old and new order API formats
  if (req.body.order && req.body.order.sessionId) {
    req.headers['x-session-id'] = req.body.order.sessionId;
  }
  req.url = '/orders';
  customerRoutes(req, res, () => {});
});

// Order tracking compatibility route - redirect to customer routes
app.get('/api/orders/session/:sessionId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  req.headers['x-session-id'] = sessionId;
  req.url = `/orders/session/${sessionId}`;
  customerRoutes(req, res, () => {});
});

// Additional compatibility route for direct API access
app.get('/api/customer/orders/session/:sessionId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  req.headers['x-session-id'] = sessionId;
  req.url = `/orders/session/${sessionId}`;
  customerRoutes(req, res, () => {});
});

// Admin routes compatibility
app.get('/api/categories', (req: Request, res: Response) => {
  // Check if this is an admin request
  const token = req.headers.authorization;
  if (token) {
    req.url = '/categories';
    adminRoutes(req, res, () => {});
  } else {
    res.status(401).json({ message: 'Authentication required' });
  }
});

app.get('/api/menu-items', (req: Request, res: Response) => {
  // Check if this is an admin request
  const token = req.headers.authorization;
  if (token) {
    req.url = '/menu-items';
    adminRoutes(req, res, () => {});
  } else {
    // Redirect to customer menu
    req.url = '/menu';
    customerRoutes(req, res, () => {});
  }
});

// Auth routes compatibility
app.post('/api/auth/register', (req: Request, res: Response) => {
  req.url = '/auth/register';
  adminRoutes(req, res, () => {});
});

app.get('/api/menu/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const shopId = parseInt(req.query.shopId as string) || 1;
    const categoryId = parseInt(category);

    if (isNaN(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const { databaseStorage } = await import('./services/database.service');
    const items = await databaseStorage.getMenuItems(shopId, categoryId);
    res.json(items);
  } catch (error) {
    logger.error('Error fetching menu items by category:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

app.get('/api/menu/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const shopId = parseInt(req.query.shopId as string) || 1;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const { databaseStorage } = await import('./services/database.service');
    const items = await databaseStorage.searchMenuItems(q, shopId);
    res.json(items);
  } catch (error) {
    logger.error('Error searching menu items:', error);
    res.status(500).json({ message: 'Failed to search menu items' });
  }
});

app.get('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);
    const shopId = parseInt(req.query.shopId as string) || 1;

    if (isNaN(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const { databaseStorage } = await import('./services/database.service');
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



// Serve SPA frontends
app.get('/*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(__dirname, '../public/admin/index.html'));
  } else {
    res.sendFile(path.join(__dirname, '../public/customer/index.html'));
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Server will not start.');
      process.exit(1);
    }
    logger.info('Database connection successful!');

    if (process.env.NODE_ENV === 'development') {
      await seed();
    }
    
    // Initialize Redis
    try {
      logger.info('Initializing Redis...');
      const redisConnected = await initRedis();
      if (!redisConnected) {
        logger.warn('Failed to connect to Redis. Continuing without caching.');
      } else {
        logger.info('Redis connected successfully.');
      }
    } catch (redisError) {
      logger.warn('Redis connection error. Continuing without caching:', redisError);
    }
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`- Customer frontend: http://localhost:${PORT}/`);
      logger.info(`- Admin frontend: http://localhost:${PORT}/admin/`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer(); 