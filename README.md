# QrMenuMaster

A comprehensive QR code-based restaurant menu management system with admin dashboard and customer interface.

## 🏗️ Project Structure

```
QrMenuMaster/
├── Admin_databoard/     # Admin dashboard application
├── Client_QR/          # Customer QR interface
├── unified-server/     # Unified backend server
└── archive-all-projects/ # Historical development files
```

## 🚀 Features

### Admin Dashboard (`Admin_databoard/`)
- Restaurant management interface
- Menu item management
- Order tracking and management
- Customer analytics
- Table/desk management
- Real-time order updates

### Customer QR Interface (`Client_QR/`)
- QR code menu scanning
- Interactive menu browsing
- Shopping cart functionality
- Order placement and tracking
- Voice search capabilities
- Mobile-responsive design

### Unified Server (`unified-server/`)
- Consolidated backend API
- Session management
- Real-time WebSocket connections
- Database integration
- Authentication middleware

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

2. Install dependencies for each module:

```bash
# Install unified server dependencies
cd unified-server
npm install

# Install admin dashboard dependencies
cd ../Admin_databoard
npm install

# Install client QR dependencies
cd ../Client_QR
npm install
```

### Running the Applications

#### Option 1: Using PowerShell Scripts (Windows)
```bash
# Start all services
./start-all.ps1

# Or start individually
./start-server.ps1    # Unified server only
./start-dev.ps1       # Development mode
```

#### Option 2: Manual Start

1. **Start the Unified Server**:
```bash
cd unified-server
npm run dev
```

2. **Start the Admin Dashboard**:
```bash
cd Admin_databoard
npm run dev
```

3. **Start the Client QR Interface**:
```bash
cd Client_QR
npm run dev
```

## 🌐 Access Points

- **Unified Server**: `http://localhost:3000`
- **Admin Dashboard**: `http://localhost:3001`
- **Customer Interface**: `http://localhost:3002`

## 📊 Database Setup

The project uses SQLite with Drizzle ORM. Database migrations and schema are located in each module's `migrations/` directory.

### Initialize Database:
```bash
cd unified-server
npm run db:generate
npm run db:migrate
npm run seed
```

## 🔧 Configuration

1. Copy environment variables:
```bash
cd unified-server
cp .env.example .env
```

2. Update the `.env` file with your specific configuration.

## 📱 Usage

### For Restaurant Admins:
1. Access the admin dashboard
2. Log in with admin credentials
3. Manage menu items, tables, and orders
4. Monitor real-time analytics

### For Customers:
1. Scan the QR code at your table
2. Browse the interactive menu
3. Add items to cart
4. Place order and track status

## 🏗️ Development

### Project Architecture
- **Modular Design**: Separate admin and customer interfaces
- **Unified Backend**: Single server handling all API requests
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
- Check the documentation in each module's directory
- Review the archived development files in `archive-all-projects/`

## 🗂️ Archive

The `archive-all-projects/` directory contains:
- Development history
- Test files
- Documentation
- Legacy implementations

This serves as a comprehensive record of the project's evolution and can be referenced for troubleshooting or understanding design decisions. 