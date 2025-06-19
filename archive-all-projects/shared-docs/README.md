# QR Menu Master

A comprehensive restaurant management system with QR code ordering capabilities.

## Features

- **Admin Dashboard**: Manage menu items, tables, orders, and analytics
- **Customer QR Menu**: Mobile-friendly menu for customers to browse and order
- **Unified Server**: Single backend server handling all API requests

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v14+)
- Redis (optional, for caching)

## Quick Setup

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/QrMenuMaster.git
   cd QrMenuMaster
   ```

2. **Set up the database**
   - Create a PostgreSQL database named `qrmenu`
   - Update the connection string in `unified-server/.env` if needed

3. **Install dependencies**
   ```
   cd unified-server && npm install
   cd ../Admin_databoard && npm install
   cd ../Client_QR && npm install
   cd ..
   ```

4. **Start all components**
   ```
   .\start-all.ps1
   ```

5. **Access the applications**
   - Admin Dashboard: http://localhost:5173 (login: admin/admin123)
   - Customer QR Menu: http://localhost:5174

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development instructions.

## Troubleshooting

If you encounter any issues:

1. Make sure PostgreSQL is running and accessible
2. Verify all components are using port 5000 for API requests
3. Check the server logs for specific error messages
4. Restart all components using the `start-all.ps1` script

## 🚀 Features

### Admin Dashboard (`Admin_databoard`)
- **Menu Management**: Add, edit, and delete menu items and categories
- **Order Management**: View and manage customer orders in real-time
- **Analytics**: Track sales performance and popular items
- **Customer Management**: View customer data and order history
- **Settings**: Configure restaurant information and preferences

### Customer QR Interface (`Client_QR`)
- **Digital Menu**: Browse menu items with images and descriptions
- **Category Filtering**: Filter items by category (Noodles, Rice, Appetizers, Beverages)
- **Voice Search**: Search menu items using voice commands
- **Fuzzy Search**: Smart text search with typo tolerance
- **Shopping Cart**: Add items to cart and place orders
- **Order Tracking**: Real-time order status updates
- **Recommendation System**: AI-powered menu recommendations

## 🛠 Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Build Tool**: Vite
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/caqvscyq/QrMenuMaster.git
cd QrMenuMaster
```

### 2. Setup Admin Dashboard
```bash
cd Admin_databoard
npm install
```

Create `.env` file in `Admin_databoard` directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/qrmenu_admin
PORT=3001
```

Run database migrations:
```bash
npm run db:migrate
```

Start the admin dashboard:
```bash
npm run dev
```

### 3. Setup Client QR Interface
```bash
cd ../Client_QR
npm install
```

Create `.env` file in `Client_QR` directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/qrmenu_client
PORT=3000
```

Run database migrations:
```bash
npm run db:migrate
```

Start the client interface:
```bash
npm run dev
```

## 🗄️ Database Schema

### Menu Items
- `id`: Unique identifier
- `name`: Item name (supports Chinese characters)
- `description`: Item description
- `price`: Item price
- `categoryId`: Foreign key to categories
- `imageUrl`: Item image URL
- `isAvailable`: Availability status
- `shopId`: Restaurant identifier

### Categories
- `id`: Unique identifier
- `name`: Category name
- `description`: Category description
- `shopId`: Restaurant identifier

### Orders
- `id`: Unique identifier
- `tableNumber`: Table number
- `items`: Order items (JSON)
- `totalAmount`: Total order amount
- `status`: Order status
- `createdAt`: Order timestamp

## 🌐 API Endpoints

### Client QR API
- `GET /api/menu` - Get all menu items
- `GET /api/menu/category/:categoryId` - Get items by category
- `GET /api/menu/popular` - Get popular items
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details

### Admin Dashboard API
- `GET /api/admin/menu` - Get all menu items (admin)
- `POST /api/admin/menu` - Create menu item
- `PUT /api/admin/menu/:id` - Update menu item
- `DELETE /api/admin/menu/:id` - Delete menu item
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id` - Update order status

## 🌍 Language Support

The system supports Chinese characters with proper UTF-8 encoding. Sample menu includes:

### 麵食類 (Noodles)
- 紅燒牛肉麵 (Braised Beef Noodles)
- 蚵仔麵線 (Oyster Vermicelli)
- 炸醬麵 (Zhajiangmian)

### 飯類 (Rice)
- 招牌炒飯 (Signature Fried Rice)
- 滷肉飯 (Braised Pork Rice)
- 蛋炒飯 (Egg Fried Rice)

### 開胃菜 (Appetizers)
- 鹽酥雞 (Taiwanese Popcorn Chicken)
- 臭豆腐 (Stinky Tofu)

### 飲料 (Beverages)
- 珍珠奶茶 (Bubble Tea)
- 冬瓜茶 (Winter Melon Tea)

## 🔧 Development

### Available Scripts

In both `Admin_databoard` and `Client_QR` directories:

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

### Project Structure
```
QrMenuMaster/
├── Admin_databoard/          # Admin dashboard
│   ├── client/              # Frontend React app
│   ├── server/              # Backend Express app
│   ├── shared/              # Shared types and schemas
│   └── migrations/          # Database migrations
├── Client_QR/               # Customer QR interface
│   ├── client/              # Frontend React app
│   ├── server/              # Backend Express app
│   ├── shared/              # Shared types and schemas
│   └── migrations/          # Database migrations
└── README.md
```

## 🚀 Deployment

### Environment Variables
Set the following environment variables for production:

```env
DATABASE_URL=your_production_database_url
NODE_ENV=production
PORT=3000
```

### Build for Production
```bash
# In each project directory
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛠️ Migration Notes

This project has been completely migrated from hardcoded data to database integration:

- ✅ Replaced `MemStorage` with PostgreSQL database
- ✅ Fixed Chinese character encoding issues
- ✅ Implemented proper category filtering
- ✅ Added TanStack Query for efficient data fetching
- ✅ Fixed query key formatting for API endpoints
- ✅ Added comprehensive error handling

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**QR Menu Master** - Revolutionizing restaurant ordering with QR technology 🍽️ 