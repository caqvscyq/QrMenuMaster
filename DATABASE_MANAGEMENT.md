# 🗄️ Database Management Guide

This guide explains the new database management system that preserves your development data while providing flexible database operations.

## 🎯 Key Changes

### Before (Old Behavior)
- `npm run dev` automatically reset and reseeded the database
- All orders, sessions, and user data were lost on every restart
- No way to preserve development data between restarts

### After (New Behavior)
- `npm run dev` uses **smart initialization** that preserves existing data
- Database is only seeded if it's completely empty
- Existing orders, sessions, and user data are preserved
- Manual database management commands available when needed

## 🚀 Development Workflow

### Normal Development (Preserves Data)
```bash
# Start development server (preserves existing data)
npm run dev

# Or use the enhanced PowerShell script
.\start-dev-with-options.ps1
```

### Development with Fresh Database
```bash
# Option 1: Use PowerShell script with reset flag
.\start-dev-with-options.ps1 -Reset

# Option 2: Manual reset then start
cd unified-server
node db-manager.js reset
npm run dev
```

## 🛠️ Database Management Commands

### Quick Commands (from project root)
```bash
npm run db:status      # Check if database is initialized
npm run seed           # Smart seed (only if database is empty)
npm run seed:force     # Force reseed (DESTRUCTIVE)
npm run db:reset       # Complete reset and reseed (DESTRUCTIVE)
npm run db:init        # Initialize schema only (no data)
```

### Detailed Commands (from unified-server directory)
```bash
cd unified-server

# Check database status
node db-manager.js status

# Smart seed - only seeds if database is empty
node db-manager.js seed

# Force reseed - clears ALL data and reseeds
node db-manager.js force-seed

# Complete reset - drops and recreates everything
node db-manager.js reset

# Initialize schema only (no sample data)
node db-manager.js init

# Show all available commands
node db-manager.js help
```

## 📋 Database Management Utility

The `db-manager.js` utility provides comprehensive database operations:

| Command | Description | Destructive |
|---------|-------------|-------------|
| `status` | Check database initialization status | ❌ No |
| `init` | Initialize database schema only | ❌ No |
| `seed` | Smart seed (only if database is empty) | ❌ No |
| `force-seed` | Force complete reseed | ⚠️ Yes |
| `reset` | Complete database reset and reseed | ⚠️ Yes |

## 🔄 Smart Initialization Logic

The new system uses intelligent initialization:

1. **Check if database is initialized**
   - Looks for `shops` table and data
   - If found, preserves all existing data

2. **Schema Updates**
   - Always ensures schema is up-to-date
   - Adds missing tables, indexes, and constraints
   - Never removes existing data

3. **Conditional Seeding**
   - Only seeds if database is completely empty
   - Preserves orders, sessions, and user data
   - Adds missing core data (shops, categories, admin user)

## 🎮 PowerShell Scripts

### Enhanced Development Script
```powershell
# Normal start (preserves data)
.\start-dev-with-options.ps1

# Start with database reset
.\start-dev-with-options.ps1 -Reset

# Start with forced reseed
.\start-dev-with-options.ps1 -ForceSeed

# Show help
.\start-dev-with-options.ps1 -Help
```

### Legacy Scripts (Updated)
```powershell
# Updated to preserve data
.\start-dev.ps1

# Still available for unified server only
.\start-all.ps1
```

## 🔍 Troubleshooting

### Database Connection Issues
```bash
# Check database status
npm run db:status

# Test connection and initialize if needed
npm run db:init
```

### Corrupted Data
```bash
# Force clean reset
npm run db:reset

# Or step by step
cd unified-server
node db-manager.js reset
npm run dev
```

### Missing Tables or Schema Issues
```bash
# Update schema without losing data
npm run db:init

# Or force reseed if data is not important
npm run seed:force
```

## 📊 Data Preservation

### What is Preserved
- ✅ Order history and current orders
- ✅ Active customer sessions
- ✅ User accounts and authentication data
- ✅ Cart items and customer preferences
- ✅ Desk/table status and reservations

### What is Updated
- 🔄 Database schema (tables, indexes, constraints)
- 🔄 Missing core data (shops, categories, admin user)
- 🔄 Database migrations and customizations

### What is Never Touched (in normal mode)
- 🔒 Existing orders and order items
- 🔒 Active sessions and cart data
- 🔒 User-generated content
- 🔒 Transaction history

## 🚨 Destructive Operations

**Always backup important data before running destructive operations!**

### Commands that Clear Data
- `npm run seed:force`
- `npm run db:reset`
- `node db-manager.js force-seed`
- `node db-manager.js reset`
- `.\start-dev-with-options.ps1 -Reset`
- `.\start-dev-with-options.ps1 -ForceSeed`

### Safe Commands
- `npm run dev`
- `npm run seed`
- `npm run db:init`
- `npm run db:status`
- `node db-manager.js status`
- `node db-manager.js seed`
- `.\start-dev-with-options.ps1` (no flags)

## 💡 Best Practices

1. **Use smart initialization for daily development**
   ```bash
   npm run dev  # Preserves your test data
   ```

2. **Check database status when in doubt**
   ```bash
   npm run db:status
   ```

3. **Use force operations sparingly**
   ```bash
   # Only when you need fresh test data
   npm run seed:force
   ```

4. **Backup important test scenarios**
   - Export order data before major changes
   - Document test user accounts and sessions

5. **Use the enhanced PowerShell script for flexibility**
   ```powershell
   .\start-dev-with-options.ps1 -Help
   ```

This new system provides the flexibility to maintain persistent development data while still offering easy database management when needed.
