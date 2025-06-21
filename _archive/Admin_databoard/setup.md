# Local Setup Guide

## Quick Setup Steps

### 1. Download the Code
You can download this project in several ways:

**Option A: From Replit**
- Click the "Download" or "Export" button in your Replit interface
- Extract the ZIP file to your desired location

**Option B: Git Clone** (if available)
```bash
git clone [your-replit-url]
cd afly-ordermeals
```

### 2. Install Prerequisites
Make sure you have these installed:
- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **PostgreSQL**: Download from [postgresql.org](https://www.postgresql.org/download/)

### 3. Database Setup
Create a PostgreSQL database:
```sql
CREATE DATABASE ordermeals;
```

### 4. Environment Configuration
1. Copy `.env.example` to `.env`
2. Update the database connection:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/ordermeals
```

### 5. Install and Run
```bash
# Install dependencies
npm install

# Setup database tables
npm run db:push

# Start the application
npm run dev
```

Visit `http://localhost:5000` and login with:
- **Admin**: username: `admin`, password: `admin123`

## Project Features Ready to Use

✅ **Complete Admin Dashboard**
- Menu management (add/edit items and categories)
- Order tracking and status updates
- Sales analytics and reporting
- User account management

✅ **Customer Mobile Interface**
- Browse menu by categories
- Shopping cart functionality
- Order placement and tracking
- User registration and login

✅ **Database Integration**
- PostgreSQL for persistent storage
- Pre-seeded with sample menu items
- Automatic table creation

✅ **Modern Tech Stack**
- React frontend with TypeScript
- Express.js backend
- Tailwind CSS for styling
- Real-time order updates

## Common Issues & Solutions

**Database Connection Error:**
- Verify PostgreSQL is running
- Check your DATABASE_URL in `.env`
- Ensure the database exists

**Port Already in Use:**
- The app runs on port 5000 by default
- Close other applications using this port

**Dependencies Issues:**
- Delete `node_modules` and run `npm install` again
- Make sure you have Node.js 18+

## Next Steps
Once running locally, you can:
- Customize the menu items and categories
- Modify the UI design and branding
- Add new features like payment integration
- Deploy to production hosting

Your food ordering system is production-ready with all core features implemented!