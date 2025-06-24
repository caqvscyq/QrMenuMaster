# QR Menu Master - Unified Server

A unified server architecture for QR code restaurant ordering system, combining customer-facing and admin functionalities into a single application.

## Features

- **Unified Backend**: Single Node.js/Express server handling both customer and admin APIs
- **Role-based Authentication**: JWT for admin users, session-based for customers
- **Real-time Updates**: WebSocket support for instant order notifications
- **Redis Caching**: Performance optimization for frequently accessed data
- **PostgreSQL Database**: Robust data storage with proper schema design
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **Nginx Integration**: Reverse proxy with SSL termination and security headers

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (for containerized deployment)

## Project Structure

```
unified-server/
├── src/                    # Source code
│   ├── api/                # API routes
│   │   ├── admin.routes.ts # Admin API endpoints
│   │   └── customer.routes.ts # Customer API endpoints
│   ├── config/             # Configuration files
│   │   ├── database.ts     # Database connection
│   │   ├── logger.ts       # Logging configuration
│   │   └── redis.ts        # Redis connection and caching
│   ├── middleware/         # Express middleware
│   │   └── auth.ts         # Authentication middleware
│   ├── models/             # Data models
│   ├── services/           # Business logic
│   │   ├── database.service.ts # Database operations
│   │   └── socket.service.ts   # WebSocket functionality
│   ├── shared/             # Shared code
│   │   └── schema.ts       # Database schema definitions
│   ├── utils/              # Utility functions
│   └── index.ts            # Application entry point
├── public/                 # Static files
│   ├── customer/           # Customer frontend
│   └── admin/              # Admin frontend
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose configuration
├── nginx.conf              # Nginx configuration
├── package.json            # Node.js dependencies
└── tsconfig.json           # TypeScript configuration
```

## Setup Instructions

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd unified-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start PostgreSQL and Redis (using Docker or local installation)

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Access the application:
   - Customer frontend: http://localhost:5000/
   - Admin frontend: http://localhost:5000/admin/
   - Customer API: http://localhost:5000/api/customer/
   - Admin API: http://localhost:5000/api/admin/

### Docker Deployment

1. Create a `.env` file based on `.env.example`

2. Create an `ssl` directory and add your SSL certificates:
   ```bash
   mkdir -p ssl
   # Add fullchain.pem and privkey.pem to the ssl directory
   ```

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Customer frontend: https://your-domain.com/
   - Admin frontend: https://your-domain.com/admin/

## API Documentation

### Customer API Endpoints

- `GET /api/customer/menu` - Get all menu items
- `GET /api/customer/menu/category/:category` - Get menu items by category
- `GET /api/customer/menu/search` - Search menu items
- `GET /api/customer/menu/:id` - Get a specific menu item
- `GET /api/customer/menu/:id/similar` - Get similar menu items
- `GET /api/customer/cart` - Get cart items
- `POST /api/customer/cart` - Add item to cart
- `PATCH /api/customer/cart/:menuItemId` - Update cart item quantity
- `DELETE /api/customer/cart/:menuItemId` - Remove item from cart
- `DELETE /api/customer/cart` - Clear cart
- `POST /api/customer/orders` - Create order
- `GET /api/customer/orders` - Get orders by session ID
- `GET /api/customer/orders/:id` - Get a specific order

### Admin API Endpoints

- `GET /api/admin/db-status` - Check database connection status
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/register` - Admin registration (first user only)
- `GET /api/admin/auth/me` - Get current user info
- `GET /api/admin/stats` - Get restaurant statistics
- `GET /api/admin/categories` - Get all categories
- `GET /api/admin/categories/:id` - Get a specific category
- `POST /api/admin/categories` - Create a new category
- `PUT /api/admin/categories/:id` - Update a category
- `DELETE /api/admin/categories/:id` - Delete a category
- `GET /api/admin/menu-items` - Get all menu items
- `GET /api/admin/menu-items/:id` - Get a specific menu item
- `POST /api/admin/menu-items` - Create a new menu item
- `PUT /api/admin/menu-items/:id` - Update a menu item
- `DELETE /api/admin/menu-items/:id` - Delete a menu item
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get a specific order
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/desks` - Get all desks
- `GET /api/admin/desks/:id` - Get a specific desk
- `POST /api/admin/desks` - Create a new desk
- `PUT /api/admin/desks/:id` - Update a desk
- `DELETE /api/admin/desks/:id` - Delete a desk
- `PATCH /api/admin/desks/:id/status` - Update desk status

## WebSocket Events

### Customer Events
- `join_customer_room` - Join a room for order updates
- `leave_customer_room` - Leave a room
- `order_status_updated` - Receive order status updates

### Admin Events
- `join_admin_room` - Join admin room for all updates
- `leave_admin_room` - Leave admin room
- `new_order` - Receive notification of new orders
- `order_updated` - Receive notification of order updates

## License

[MIT License](LICENSE) 