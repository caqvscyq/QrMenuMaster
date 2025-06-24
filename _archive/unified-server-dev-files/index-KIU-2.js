"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const logger_1 = require("./config/logger");
const socket_service_1 = require("./services/socket.service");
const customer_routes_1 = __importDefault(require("./api/customer.routes"));
const admin_routes_1 = __importDefault(require("./api/admin.routes"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const seed_1 = require("./db/seed");
// Initialize Express app
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.IO
const socketService = (0, socket_service_1.initSocketService)(server);
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            ...helmet_1.default.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "https://replit.com", "https://cdn.jsdelivr.net", "http://localhost:5000"],
            "script-src-attr": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
            "img-src": ["'self'", "data:", "https://replit.com", "https://images.unsplash.com"],
            "connect-src": ["'self'", "http://localhost:5000", "ws://localhost:5000"]
        },
    },
})); // Security headers
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN || true
        : true,
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const path = req.path;
        if (path.startsWith('/api')) {
            logger_1.logger.info(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
        }
    });
    next();
});
// API Routes
app.use('/api/customer', customer_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/session', session_routes_1.default);
// Debug route (development only)
if (process.env.NODE_ENV === 'development') {
    app.get('/debug', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../debug-frontend.html'));
    });
}
// Add route aliases for backward compatibility - direct menu access without auth
app.get('/api/menu', async (req, res) => {
    try {
        const shopId = parseInt(req.query.shopId) || 1;
        const { databaseStorage } = await Promise.resolve().then(() => __importStar(require('./services/database.service')));
        const items = await databaseStorage.getMenuItems(shopId);
        res.json(items);
    }
    catch (error) {
        logger_1.logger.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Failed to fetch menu items' });
    }
});
// Cart compatibility routes - handle old frontend cart API calls
app.get('/api/cart/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    req.headers['x-session-id'] = sessionId;
    req.url = '/cart';
    (0, customer_routes_1.default)(req, res, () => { });
});
app.post('/api/cart', (req, res) => {
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
    (0, customer_routes_1.default)(req, res, () => { });
});
app.patch('/api/cart/:sessionId/:menuItemId', (req, res) => {
    const sessionId = req.params.sessionId;
    const menuItemId = req.params.menuItemId;
    req.headers['x-session-id'] = sessionId;
    req.url = `/cart/${menuItemId}`;
    (0, customer_routes_1.default)(req, res, () => { });
});
app.delete('/api/cart/:sessionId/:menuItemId', (req, res) => {
    const sessionId = req.params.sessionId;
    const menuItemId = req.params.menuItemId;
    req.headers['x-session-id'] = sessionId;
    req.url = `/cart/${menuItemId}`;
    (0, customer_routes_1.default)(req, res, () => { });
});
app.delete('/api/cart/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    req.headers['x-session-id'] = sessionId;
    req.url = '/cart';
    (0, customer_routes_1.default)(req, res, () => { });
});
// Orders compatibility routes
app.post('/api/orders', (req, res) => {
    // Handle both old and new order API formats
    if (req.body.order && req.body.order.sessionId) {
        req.headers['x-session-id'] = req.body.order.sessionId;
    }
    req.url = '/orders';
    (0, customer_routes_1.default)(req, res, () => { });
});
// Order tracking compatibility route - this is the missing one!
app.get('/api/orders/session/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    req.headers['x-session-id'] = sessionId;
    req.url = `/orders/session/${sessionId}`;
    (0, customer_routes_1.default)(req, res, () => { });
});
// Admin routes compatibility
app.get('/api/categories', (req, res) => {
    // Check if this is an admin request
    const token = req.headers.authorization;
    if (token) {
        req.url = '/categories';
        (0, admin_routes_1.default)(req, res, () => { });
    }
    else {
        res.status(401).json({ message: 'Authentication required' });
    }
});
app.get('/api/menu-items', (req, res) => {
    // Check if this is an admin request
    const token = req.headers.authorization;
    if (token) {
        req.url = '/menu-items';
        (0, admin_routes_1.default)(req, res, () => { });
    }
    else {
        // Redirect to customer menu
        req.url = '/menu';
        (0, customer_routes_1.default)(req, res, () => { });
    }
});
// Auth routes compatibility
app.post('/api/auth/register', (req, res) => {
    req.url = '/auth/register';
    (0, admin_routes_1.default)(req, res, () => { });
});
app.get('/api/menu/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const shopId = parseInt(req.query.shopId) || 1;
        const categoryId = parseInt(category);
        if (isNaN(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }
        const { databaseStorage } = await Promise.resolve().then(() => __importStar(require('./services/database.service')));
        const items = await databaseStorage.getMenuItems(shopId, categoryId);
        res.json(items);
    }
    catch (error) {
        logger_1.logger.error('Error fetching menu items by category:', error);
        res.status(500).json({ message: 'Failed to fetch menu items' });
    }
});
app.get('/api/menu/search', async (req, res) => {
    try {
        const { q } = req.query;
        const shopId = parseInt(req.query.shopId) || 1;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const { databaseStorage } = await Promise.resolve().then(() => __importStar(require('./services/database.service')));
        const items = await databaseStorage.searchMenuItems(q, shopId);
        res.json(items);
    }
    catch (error) {
        logger_1.logger.error('Error searching menu items:', error);
        res.status(500).json({ message: 'Failed to search menu items' });
    }
});
app.get('/api/menu/:id', async (req, res) => {
    try {
        const itemId = parseInt(req.params.id);
        const shopId = parseInt(req.query.shopId) || 1;
        if (isNaN(itemId)) {
            return res.status(400).json({ message: 'Invalid item ID' });
        }
        const { databaseStorage } = await Promise.resolve().then(() => __importStar(require('./services/database.service')));
        const item = await databaseStorage.getMenuItem(itemId, shopId);
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(item);
    }
    catch (error) {
        logger_1.logger.error('Error fetching menu item:', error);
        res.status(500).json({ message: 'Failed to fetch menu item' });
    }
});
// Serve static files from both customer and admin public directories with proper MIME types
app.use(express_1.default.static(path_1.default.join(__dirname, '../public/customer'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.use(express_1.default.static(path_1.default.join(__dirname, '../public/admin'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
// Serve SPA frontends
app.get('/*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    if (req.path.startsWith('/admin')) {
        res.sendFile(path_1.default.join(__dirname, '../public/admin/index.html'));
    }
    else {
        res.sendFile(path_1.default.join(__dirname, '../public/customer/index.html'));
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});
// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        // Test database connection
        logger_1.logger.info('Testing database connection...');
        const dbConnected = await (0, database_1.testDatabaseConnection)();
        if (!dbConnected) {
            logger_1.logger.error('Failed to connect to database. Server will not start.');
            process.exit(1);
        }
        logger_1.logger.info('Database connection successful!');
        if (process.env.NODE_ENV === 'development') {
            await (0, seed_1.seed)();
        }
        // Initialize Redis
        try {
            logger_1.logger.info('Initializing Redis...');
            const redisConnected = await (0, redis_1.initRedis)();
            if (!redisConnected) {
                logger_1.logger.warn('Failed to connect to Redis. Continuing without caching.');
            }
            else {
                logger_1.logger.info('Redis connected successfully.');
            }
        }
        catch (redisError) {
            logger_1.logger.warn('Redis connection error. Continuing without caching:', redisError);
        }
        // Start HTTP server
        server.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            logger_1.logger.info(`- Customer frontend: http://localhost:${PORT}/`);
            logger_1.logger.info(`- Admin frontend: http://localhost:${PORT}/admin/`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection:', reason);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
// Start the server
startServer();
