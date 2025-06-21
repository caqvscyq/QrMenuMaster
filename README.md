# QrMenuMaster

A comprehensive QR code-based restaurant menu management system with unified server architecture.

## 🏗️ Project Structure

```
QrMenuMaster/
├── unified-server/         # Main application (admin + customer interface)
├── Admin_databoard/        # Legacy - not in use
├── Client_QR/             # Legacy - not in use
└── archive-all-projects/  # Historical development files
```

## 🚀 Features

### Unified Server Application (`unified-server/`)
- **Admin Dashboard**: Restaurant management interface with menu management, order tracking, customer analytics, and table management
- **Customer Interface**: QR code menu scanning, interactive browsing, shopping cart, and order tracking
- **Real-time Updates**: WebSocket integration for live order updates
- **Session Management**: Table-based session handling
- **Mobile-Responsive**: Works on all devices

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite with Drizzle ORM
- **Real-time**: WebSocket (Socket.io)
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/caqvscyq/QrMenuMaster.git
cd QrMenuMaster
```

2. Install dependencies:
```bash
cd unified-server
npm install
```

### Running the Application

#### Option 1: Enhanced PowerShell Scripts (Windows) - Recommended
```powershell
# Normal development (preserves existing data)
.\start-dev-with-options.ps1

# Development with fresh database (DESTRUCTIVE)
.\start-dev-with-options.ps1 -Reset

# Show all options
.\start-dev-with-options.ps1 -Help
```

#### Option 2: Legacy PowerShell Scripts
```powershell
# Updated to preserve data
.\start-dev.ps1

# Unified server only
.\start-all.ps1
```

#### Option 3: Manual Start
```bash
cd unified-server
npm run dev  # Now preserves existing data!
```

## 🌐 Access Points

- **Main Application**: `http://localhost:3000`
  - Admin Dashboard: `http://localhost:3000/admin`
  - Customer Interface: `http://localhost:3000/customer`

## 📊 Database Setup

The project uses PostgreSQL with Drizzle ORM. Database migrations and schema are located in `unified-server/migrations/`.

### Smart Database Initialization (Preserves Data):
```bash
# Normal development start (preserves existing data)
npm run dev

# Or from unified-server directory
cd unified-server
npm run dev
```

### Database Management Commands:
```bash
# Check database status
npm run db:status

# Smart seed (only if database is empty)
npm run seed

# Force reseed (DESTRUCTIVE - clears all data)
npm run seed:force

# Complete database reset (DESTRUCTIVE)
npm run db:reset

# Initialize schema only
npm run db:init
```

### Enhanced Development Scripts:
```powershell
# Windows PowerShell - Normal start (preserves data)
.\start-dev-with-options.ps1

# Start with database reset (DESTRUCTIVE)
.\start-dev-with-options.ps1 -Reset

# Show all options
.\start-dev-with-options.ps1 -Help
```

> **📖 For detailed database management guide, see [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md)**

## 🔧 Configuration

1. Copy environment variables:
```bash
cd unified-server
cp .env.example .env
```

2. Update the `.env` file with your specific configuration.

## 📱 Usage

### For Restaurant Admins:
1. Access `http://localhost:3000/admin`
2. Log in with admin credentials
3. Manage menu items, tables, and orders
4. Monitor real-time analytics

### For Customers:
1. Scan the QR code at your table or visit `http://localhost:3000/customer`
2. Browse the interactive menu
3. Add items to cart
4. Place order and track status

## 🏗️ Development

### Project Architecture
- **Unified Design**: Single server handling both admin and customer interfaces
- **Real-time Updates**: WebSocket integration for live order updates
- **Session Management**: Table-based session handling
- **Mobile-First**: Responsive design for all screen sizes

### Key Development Scripts:
```bash
npm run dev          # Development mode
npm run build        # Production build
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
```

## 📄 API Documentation

The unified server provides RESTful APIs for:
- Menu management
- Order processing
- Session handling
- Real-time notifications

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
- Create an issue on GitHub
- Check the documentation in `unified-server/` directory
- Review the archived development files in `archive-all-projects/`

## 🗂️ Archive

The `Admin_databoard/`, `Client_QR/`, and `archive-all-projects/` directories contain:
- Legacy implementations
- Development history
- Test files
- Documentation

These serve as a comprehensive record of the project's evolution and can be referenced for troubleshooting or understanding design decisions, but the current active codebase is in `unified-server/`. 