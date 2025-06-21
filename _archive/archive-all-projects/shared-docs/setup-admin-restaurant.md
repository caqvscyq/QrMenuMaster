# QR Menu Master - Admin Dashboard Setup Guide

## Quick Start for Testing Admin Dashboard

### 1. Database Setup
Both systems now connect to the same PostgreSQL database with proper shop linking:

**Database Connection**: `postgresql://postgres:2025@localhost:5432/qrmenu`

### 2. Pre-configured Admin Account
The system has been pre-configured with:

- **Admin Username**: `admin`  
- **Admin Password**: `admin123`
- **Restaurant Name**: `美味軒餐廳` (Delicious House Restaurant)
- **Address**: `台北市信義區信義路五段7號`
- **Phone**: `+886-2-2345-6789`

### 3. Starting the Systems

1. **Admin Dashboard**: 
   ```bash
   cd Admin_databoard
   npm run dev
   ```
   Access at: `http://localhost:5000`

2. **Customer QR Menu**:
   ```bash
   cd Client_QR  
   npm run dev
   ```
   Access at: `http://localhost:5001`

### 4. Testing the Admin Features

#### A. Login to Admin Dashboard
1. Navigate to `http://localhost:5000`
2. Use credentials: `admin` / `admin123`
3. You'll be logged into the restaurant management system

#### B. Admin Dashboard Features Available:
- **Dashboard**: View order statistics and revenue
- **Menu Management**: Add/edit/delete menu items and categories
- **Orders**: View and update order statuses
- **Analytics**: View sales reports and trends
- **Customers**: View customer information
- **Settings**: Manage restaurant settings

#### C. Test the Customer Order Flow:
1. Open `http://localhost:5001` (Customer QR Menu)
2. Browse the Chinese menu items
3. Add items to cart
4. Place an order with table number (e.g., "A12")
5. Return to admin dashboard to see the new order

### 5. Pre-loaded Sample Data

The system comes with:
- **4 Categories**: 開胃菜, 主餐, 甜點, 飲品
- **6 Menu Items**: Including 紅燒牛肉麵, 招牌炒飯, 鹽酥雞, etc.
- **Shop Admin Link**: Admin user is properly linked as "owner" of the restaurant

### 6. Key Connections Between Systems

1. **Shared Database**: Both systems read/write to the same database
2. **Shop Linking**: Menu items and orders are linked to the restaurant
3. **Real-time Updates**: Changes in admin panel reflect in customer interface
4. **Order Tracking**: Orders placed on customer side appear in admin dashboard

### 7. Testing Workflow

1. **As Admin**: 
   - Login to admin dashboard
   - Add/modify menu items
   - Monitor incoming orders
   - Update order status (pending → preparing → ready → completed)

2. **As Customer**:
   - Browse menu on QR interface
   - Add items to cart
   - Submit order with table number
   - Check order status in order tracking modal

### 8. Database Tables

The system uses these key tables:
- `shops` - Restaurant information
- `shop_admins` - Links users to restaurants  
- `users` - Admin and customer accounts
- `categories` - Menu categories linked to shops
- `menu_items` - Menu items linked to shops
- `orders` - Customer orders linked to shops
- `order_items` - Individual items in orders

### 9. Troubleshooting

- **Login Issues**: Make sure database is running and seeded
- **Menu Not Loading**: Check if both servers are running
- **Orders Not Appearing**: Verify shop linking in database

---

**Your admin dashboard is now fully linked to the restaurant and ready for testing!** 