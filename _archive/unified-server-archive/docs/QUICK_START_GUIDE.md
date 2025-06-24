# QR Menu System - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Redis server (optional, for caching)

### 1. Environment Setup

Create a `.env` file in the `unified-server` directory:

```env
# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/qrmenu

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 2. Install Dependencies

```bash
cd unified-server
npm install
```

### 3. Database Setup

The system will automatically create tables and seed data on first run. If you need to reset the database:

```bash
node migrate-data.js
```

### 4. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 🌐 Access Points

### Customer Frontend
- **URL**: `http://localhost:5000/`
- **Features**: Menu browsing, cart management, order placement

### Admin Dashboard
- **URL**: `http://localhost:5000/admin/`
- **Login**: 
  - Username: `admin`
  - Password: `admin123`
- **Features**: Menu management, order tracking, analytics

### API Endpoints

#### Customer API
- `GET /api/customer/menu` - Get menu items
- `GET /api/customer/menu/:id` - Get specific menu item
- `GET /api/customer/cart` - Get cart (requires X-Session-ID header)
- `POST /api/customer/cart` - Add to cart
- `POST /api/customer/orders` - Create order

#### Admin API (requires JWT token)
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/categories` - Get categories
- `POST /api/admin/categories` - Create category
- `GET /api/admin/menu-items` - Get menu items
- `POST /api/admin/menu-items` - Create menu item
- `GET /api/admin/orders` - Get orders
- `GET /api/admin/desks` - Get desks
- `GET /api/admin/stats` - Get dashboard statistics

#### Backward Compatibility
- `GET /api/menu` - Redirects to customer menu
- `GET /api/cart/:sessionId` - Old cart API format
- `POST /api/cart` - Old cart creation format

## 🧪 Testing

### Run Comprehensive System Test
```bash
node comprehensive-system-test.js
```

### Run Individual Tests
```bash
# Test cart functionality
node fix-cart-compatibility.js

# Test admin dashboard
node test-admin-dashboard.js

# Check admin users
node check-admin-users.js
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in .env file
3. Verify database credentials
4. Run migration script: `node migrate-data.js`

#### Admin Login Issues
1. Ensure admin user exists: `node check-admin-users.js`
2. Reset admin user: `node migrate-data.js`
3. Check JWT_SECRET in .env file

#### Cart Not Working
1. Check session ID in browser console
2. Verify cart API endpoints are responding
3. Test cart compatibility: `node fix-cart-compatibility.js`

#### Frontend Not Loading
1. Check if server is running on correct port
2. Verify static files are being served
3. Check browser console for errors

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

### Database Reset

To completely reset the database:
```bash
node migrate-data.js
```

This will:
- Create all necessary tables
- Seed sample data
- Create admin user
- Set up sample desks

## 📊 Monitoring

### Health Checks
- Server status: `http://localhost:5000/`
- Database status: `http://localhost:5000/api/admin/db-status`

### Logs
- Server logs are displayed in console
- Error logs include stack traces
- Database queries are logged in development mode

## 🔒 Security Notes

### Production Deployment
1. Change JWT_SECRET to a strong, unique value
2. Set NODE_ENV=production
3. Use HTTPS in production
4. Implement rate limiting
5. Set up proper database backups

### Default Credentials
- **Admin Username**: `admin`
- **Admin Password**: `admin123`

**⚠️ IMPORTANT**: Change the default admin password in production!

## 📱 Mobile Compatibility

The customer frontend is mobile-responsive and works well on:
- iOS Safari
- Android Chrome
- Mobile browsers with QR code scanning

## 🎯 Features Overview

### Customer Features
- Browse menu by categories
- Add items to cart
- Adjust quantities
- Place orders with table number
- Track order status (if real-time updates enabled)

### Admin Features
- Manage menu categories
- Add/edit/delete menu items
- View and manage orders
- Track desk occupancy
- View sales analytics
- Reset database (development only)

## 📞 Support

If you encounter issues:

1. Check the console logs for error messages
2. Run the comprehensive system test
3. Verify database connection
4. Check environment variables
5. Review the integration success report

The system includes comprehensive error handling and logging to help diagnose issues quickly.
