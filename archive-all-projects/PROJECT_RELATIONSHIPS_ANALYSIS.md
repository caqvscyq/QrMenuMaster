# Project Relationships Analysis

## 🏗️ **Architecture Overview**

This QR Menu Master project consists of **three interconnected applications** that share the same database but have different purposes:

### **1. unified-server** (Main Production Server)
- **Purpose**: Production-ready unified API server
- **Port**: 5000
- **Status**: ✅ **ACTIVE - Primary server**
- **Features**: Complete session management, admin API, customer API

### **2. Admin_databoard** (Alternative Admin Interface)
- **Purpose**: Standalone admin dashboard with its own server
- **Port**: Likely 3000 or 5173 (Vite dev server)
- **Status**: ⚠️ **ALTERNATIVE - Not currently used**
- **Features**: Admin interface, separate database seeding

### **3. Client_QR** (Alternative Customer Interface)
- **Purpose**: Standalone customer QR menu with its own server
- **Port**: Likely 3001 or 5174 (Vite dev server)
- **Status**: ⚠️ **ALTERNATIVE - Not currently used**
- **Features**: Customer menu interface, separate database seeding

## 🔗 **Critical Relationships**

### **Shared Database Schema**
All three projects use **identical database schemas** defined in `@shared/schema.ts`:

```typescript
// Tables shared across all projects:
- users (admin authentication)
- shops (restaurant data)
- categories (menu categories)
- menuItems (menu items)
- orders (customer orders)
- orderItems (order details)
- desks (table management)
- cartItems (shopping cart)
- sessions (unified-server only)
```

### **Database Connection**
All projects connect to the **same PostgreSQL database**:
- **Connection**: `process.env.DATABASE_URL`
- **Risk**: Multiple projects can overwrite each other's data
- **Current Status**: Only unified-server should be running

### **API Endpoint Overlaps**
Similar endpoints exist across projects:

| Endpoint | unified-server | Admin_databoard | Client_QR |
|----------|---------------|-----------------|-----------|
| `/api/menu` | ✅ | ❌ | ✅ |
| `/api/orders` | ✅ | ✅ | ✅ |
| `/api/admin/*` | ✅ | ✅ | ❌ |
| `/api/cart` | ✅ | ❌ | ✅ |

## ⚠️ **Potential Conflicts**

### **1. Database Seeding Conflicts**
Each project has its own seeding strategy:
- **unified-server**: Comprehensive seeding with Chinese menu items
- **Admin_databoard**: Basic seeding with "My Awesome Restaurant"
- **Client_QR**: Chinese menu items (similar to unified-server)

**Risk**: Running multiple projects can overwrite database data

### **2. Session Management Differences**
- **unified-server**: Advanced session management with database storage
- **Admin_databoard**: Basic authentication
- **Client_QR**: Simple session handling

**Risk**: Session format incompatibilities

### **3. Port Conflicts**
If multiple servers run simultaneously:
- **unified-server**: Port 5000
- **Admin_databoard**: Vite dev server (likely 5173)
- **Client_QR**: Vite dev server (likely 5174)

### **4. Development vs Production**
- **unified-server**: Production-ready with comprehensive error handling
- **Admin_databoard**: Development-focused
- **Client_QR**: Development-focused

## 🎯 **Current Recommendation**

### **Primary Setup (Recommended)**
```bash
# Only run unified-server
cd unified-server
npm start
# Access: http://localhost:5000
```

### **Alternative Setups (For Development/Testing)**
```bash
# Admin_databoard standalone
cd Admin_databoard
npm run dev

# Client_QR standalone  
cd Client_QR
npm run dev
```

## 📁 **Archive Strategy**

### **Files Moved to Archive**

#### **Root Level** → `archive-all-projects/root-level-tests/`
- `test-*.js` - Integration tests
- `test-*.html` - Browser tests
- `debug-*.html` - Debug pages
- `comprehensive-*.js` - System tests

#### **Admin_databoard** → `archive-all-projects/admin-databoard-archive/`
- `test-*.js` - Admin-specific tests
- `test-*.ps1` - PowerShell test scripts
- `debug-*.html` - Debug pages
- `create-*.js` - Data creation scripts
- `reset-*.js` - Database reset scripts

#### **Client_QR** → `archive-all-projects/client-qr-archive/`
- `test-*.js` - Client-specific tests
- `tsconfig-KIU.json` - Backup TypeScript config

#### **Documentation** → `archive-all-projects/shared-docs/`
- All `.md` files with implementation guides and reports

## 🚨 **Important Notes**

### **DO NOT RUN MULTIPLE SERVERS SIMULTANEOUSLY**
Running Admin_databoard or Client_QR alongside unified-server can cause:
- Database conflicts
- Session management issues
- Data corruption
- API endpoint confusion

### **Current Production Status**
- ✅ **unified-server**: Active and stable
- ⚠️ **Admin_databoard**: Archived - use unified-server admin instead
- ⚠️ **Client_QR**: Archived - use unified-server customer interface instead

### **If You Need Alternative Interfaces**
1. **Stop unified-server first**
2. **Run only one project at a time**
3. **Be aware of database seeding differences**
4. **Clear browser storage when switching**

## 🔄 **Migration Path**

If you want to use Admin_databoard or Client_QR features:
1. **Extract useful components** from archived projects
2. **Integrate into unified-server** 
3. **Maintain single server architecture**
4. **Avoid running multiple servers**

---

**Last Updated**: June 18, 2025  
**Status**: unified-server is the primary active server  
**Archive Created**: During project cleanup and organization
