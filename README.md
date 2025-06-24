# QrMenuMaster

A comprehensive QR code-based restaurant menu management system with unified server architecture and separate frontend client.

## 🏗️ Project Structure

```
QrMenuMaster/
├── admin-client/              # Frontend application (React + TypeScript + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/        # Admin dashboard pages
│   │   │   └── customer/     # Customer interface pages
│   │   ├── components/       # Shared UI components
│   │   └── hooks/           # Custom React hooks
│   └── shared/              # Shared schemas and types
├── unified-server/           # Backend server (Node.js + Express + TypeScript)
│   ├── src/                 # Server source code
│   ├── public/              # Built frontend assets
│   │   ├── app/            # Admin interface build output
│   │   └── customer/       # Customer interface build output
│   └── migrations/         # Database migrations
└── _archive/                # Legacy implementations and development history
```

## 🚀 Features

### Admin Dashboard
- **Menu Management**: Create, edit, and organize menu items with categories
- **Order Tracking**: Real-time order monitoring and status updates
- **Table Management**: QR code generation and table status tracking
- **Customer Analytics**: Insights into ordering patterns and preferences
- **Real-time Updates**: WebSocket integration for live updates

### Customer Interface
- **QR Code Scanning**: Easy table identification and menu access
- **Interactive Menu**: Browse categories, search items, view details
- **Shopping Cart**: Add items with customizations and special requests
- **Order Tracking**: Real-time order status and estimated completion times
- **Mobile-Responsive**: Optimized for smartphone usage

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite with Drizzle ORM
- **Real-time**: WebSocket (Socket.io)
- **UI Components**: Shadcn/ui, Radix UI
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/caqvscyq/QrMenuMaster.git
cd QrMenuMaster
```

2. Install all dependencies:
```bash
npm run install:all
```

### Running the Application

#### Option 1: Enhanced Development with Auto-rebuild (Recommended)
```powershell
# Customer interface development with auto-rebuild
npm run dev:customer

# Standard development mode
npm run dev
```

#### Option 2: PowerShell Scripts (Windows)
```powershell
# Normal development (preserves existing data)
.\start-dev-with-options.ps1

# Development with fresh database (DESTRUCTIVE)
.\start-dev-with-options.ps1 -Reset

# Show all options
.\start-dev-with-options.ps1 -Help
```

#### Option 3: Manual Commands
```bash
# Start server only
npm run dev

# Build frontend and start server
npm run build
npm start
```

## 🌐 Access Points

- **Main Application**: `http://localhost:5000`
  - Admin Dashboard: `http://localhost:5000/admin`
  - Customer Interface: `http://localhost:5000/customer`

- **Development Frontend** (when using admin-client dev server): `http://localhost:3001`

## 📊 Database Setup

The project uses SQLite with Drizzle ORM. Database migrations and schema are located in `unified-server/migrations/`.

### Smart Database Initialization (Preserves Data):
```bash
# Normal development start (preserves existing data)
npm run dev

# Or check database status
npm run db:status
```

### Database Management Commands:
```bash
# Smart seed (only if database is empty)
npm run seed

# Force reseed (DESTRUCTIVE - clears all data)
npm run seed:force

# Complete database reset (DESTRUCTIVE)
npm run db:reset

# Initialize schema only
npm run db:init
```

> **📖 For detailed database management guide, see [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md)**

## 🔧 Configuration

1. Environment setup:
```bash
cd unified-server
cp .env.example .env
```

2. Update the `.env` file with your specific configuration.

## 📱 Usage

### For Restaurant Admins:
1. Access `http://localhost:5000/admin`
2. Log in with admin credentials
3. Manage menu items, tables, and orders
4. Monitor real-time analytics

### For Customers:
1. Scan the QR code at your table or visit `http://localhost:5000/customer`
2. Browse the interactive menu
3. Add items to cart with customizations
4. Place order and track real-time status

## 🏗️ Development

### Project Architecture
- **Separated Frontend**: React application in `admin-client/` with Vite build system
- **Unified Backend**: Single server handling both admin and customer APIs
- **Real-time Updates**: WebSocket integration for live order updates
- **Session Management**: Table-based session handling
- **Mobile-First**: Responsive design for all screen sizes

### Key Development Scripts:
```bash
# Frontend Development
npm run dev:customer        # Auto-rebuild customer interface
cd admin-client && npm run dev  # Frontend dev server

# Backend Development
cd unified-server && npm run dev  # Server with nodemon

# Building
npm run build              # Build both frontend and backend
npm run build:frontend     # Build frontend only
npm run build:backend      # Build backend only
npm run build:customer     # Build customer interface only

# Database
npm run db:generate        # Generate database migrations
npm run db:migrate         # Run database migrations
```

### Development Workflow

#### For Customer Interface Development
When developing the customer interface (menu, cart, orders):

```bash
# Option 1: Auto-rebuild (Recommended)
npm run dev:customer
```

This will:
- Start the server on http://localhost:5000
- Automatically rebuild customer files when you modify `admin-client/src/pages/customer/`
- Serve the updated files immediately

#### For Admin Interface Development
```bash
# Build admin interface
npm run build:frontend
# Or for auto-rebuild during development
cd admin-client && npm run dev
```

### Important Development Notes
- **Source files**: Modify files in `admin-client/src/`
- **Built files**: Auto-generated in `unified-server/public/` (DO NOT edit directly)
- **To see changes**: Use build commands or auto-rebuild scripts

## 📄 API Documentation

The unified server provides RESTful APIs for:
- Menu management (CRUD operations)
- Order processing and tracking
- Session and table management
- Real-time notifications via WebSocket
- Customer analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub: https://github.com/caqvscyq/QrMenuMaster/issues
- Check the documentation in `unified-server/` directory
- Review the archived development files in `_archive/`

## 🗂️ Archive

The `_archive/` directory contains:
- **Admin_databoard/**: Legacy admin implementation
- **Client_QR/**: Legacy customer interface
- **archive-all-projects/**: Complete development history
- **build-outputs/**: Historical build artifacts

These serve as a comprehensive record of the project's evolution and can be referenced for troubleshooting or understanding design decisions, but the current active codebase is in `admin-client/` and `unified-server/`.

## 🔄 Version Control

This project is actively maintained on GitHub:
- **Repository**: https://github.com/caqvscyq/QrMenuMaster
- **Issues**: https://github.com/caqvscyq/QrMenuMaster/issues
- **Releases**: https://github.com/caqvscyq/QrMenuMaster/releases

## 📊 Project Status

✅ **Active Development**
- Modern React frontend with TypeScript
- Unified Node.js backend
- SQLite database with migrations
- Real-time WebSocket integration
- Mobile-responsive design
- Comprehensive development tooling 