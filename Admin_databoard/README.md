# Afly OrderMeals - Food Ordering System

A complete food ordering system with admin dashboard and customer interface built with React, Express.js, and PostgreSQL.

## Features

### Admin Dashboard
- **Menu Management**: Add, edit, and manage menu items and categories
- **Order Management**: Track orders with real-time status updates
- **Analytics Dashboard**: View sales statistics and performance metrics
- **User Management**: Handle customer accounts and permissions

### Customer Interface
- **Mobile-First Design**: Responsive interface optimized for mobile devices
- **Menu Browse**: Browse menu by categories with search functionality
- **Shopping Cart**: Add items, modify quantities, and checkout
- **Order Tracking**: View order history and real-time status updates
- **User Registration**: Quick account creation or guest ordering

### Technical Features
- **Authentication**: Secure login system with role-based access
- **Real-time Updates**: Live order status tracking
- **Database Integration**: PostgreSQL for persistent data storage
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **TypeScript**: Full type safety across frontend and backend

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Wouter (routing)
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui, Radix UI
- **Build Tool**: Vite
- **State Management**: React Query (TanStack Query)

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd afly-ordermeals
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/ordermeals
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

### Default Login Credentials

**Admin Access:**
- Username: `admin`
- Password: `admin123`

**Customer Access:**
- Register a new account or use guest checkout

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express.js server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── database.ts        # Database storage implementation
│   └── storage.ts         # Storage interface
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and types
├── package.json           # Dependencies and scripts
├── drizzle.config.ts      # Database configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Build configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Menu Management
- `GET /api/categories` - Get all categories
- `GET /api/menu-items` - Get all menu items
- `POST /api/menu-items` - Create menu item (Admin)
- `PUT /api/menu-items/:id` - Update menu item (Admin)
- `DELETE /api/menu-items/:id` - Delete menu item (Admin)

### Order Management
- `GET /api/orders` - Get orders (filtered by user role)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Analytics
- `GET /api/stats` - Get dashboard statistics (Admin)

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `categories` - Menu categories
- `menu_items` - Restaurant menu items
- `orders` - Customer orders
- `order_items` - Individual items within orders

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)

### Adding New Features

1. **Database Changes**: Update `shared/schema.ts` and run `npm run db:push`
2. **API Routes**: Add new endpoints in `server/routes.ts`
3. **Frontend Pages**: Create new components in `client/src/pages/`
4. **UI Components**: Use existing shadcn/ui components or create new ones

## Deployment

### Environment Variables for Production

```env
DATABASE_URL=your-production-database-url
NODE_ENV=production
```

### Build for Production

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints section

---

Built with ❤️ for modern restaurant operations