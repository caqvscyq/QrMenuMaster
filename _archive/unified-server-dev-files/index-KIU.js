"use strict";
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
            "script-src": ["'self'", "https://replit.com", "https://cdn.jsdelivr.net", "http://localhost:5000"],
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
// Debug route (development only)
if (process.env.NODE_ENV === 'development') {
    app.get('/debug', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../debug-frontend.html'));
    });
}
// Add route aliases for backward compatibility
app.get('/api/menu', (req, res, next) => {
    logger_1.logger.info('Redirecting /api/menu to /api/customer/menu');
    req.url = '/menu';
    (0, customer_routes_1.default)(req, res, next);
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
    if (req.body.sessionId) {
        req.headers['x-session-id'] = req.body.sessionId;
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
// Orders compatibility route
app.post('/api/orders', (req, res) => {
    // Handle both old and new order API formats
    if (req.body.order && req.body.order.sessionId) {
        req.headers['x-session-id'] = req.body.order.sessionId;
    }
    req.url = '/orders';
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
app.get('/api/menu/category/:category', (req, res, next) => {
    logger_1.logger.info('Redirecting /api/menu/category to /api/customer/menu/category');
    req.url = `/menu/category/${req.params.category}`;
    (0, customer_routes_1.default)(req, res, next);
});
app.get('/api/menu/search', (req, res, next) => {
    logger_1.logger.info('Redirecting /api/menu/search to /api/customer/menu/search');
    req.url = '/menu/search';
    (0, customer_routes_1.default)(req, res, next);
});
app.get('/api/menu/:id', (req, res, next) => {
    logger_1.logger.info('Redirecting /api/menu/:id to /api/customer/menu/:id');
    req.url = `/menu/${req.params.id}`;
    (0, customer_routes_1.default)(req, res, next);
});
// Serve static files from both customer and admin public directories
app.use(express_1.default.static(path_1.default.join(__dirname, '../public/customer')));
app.use(express_1.default.static(path_1.default.join(__dirname, '../public/admin')));
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
