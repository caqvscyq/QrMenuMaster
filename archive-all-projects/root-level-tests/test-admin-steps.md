# Test Admin Dashboard - Step by Step

## 🎯 Quick Test Steps

### Step 1: Access Admin Dashboard
1. Open browser and go to: `http://localhost:5000`
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`

### Step 2: Check Menu Management
1. Navigate to "Menu Management" in the sidebar
2. You should now see the Chinese menu items:
   - 紅燒牛肉麵 ($280)
   - 招牌炒飯 ($180)
   - 鹽酥雞 ($120)
   - 海鮮炒飯 ($220)
   - 芒果布丁 ($80)
   - 珍珠奶茶 ($65)

### Step 3: Test Adding New Menu Item
1. Click "Add Menu Item" button
2. Fill in the form:
   - **Name**: `宮保雞丁`
   - **Description**: `經典川菜，花生米配雞丁`
   - **Price**: `240`
   - **Category**: Choose from dropdown
   - **Status**: Available
3. Save and verify it appears in the list

### Step 4: Test Customer Side
1. Open `http://localhost:5001` in another tab
2. Browse the menu - same items should appear
3. Add items to cart and place a test order

### Step 5: Check Orders in Admin
1. Return to admin dashboard
2. Go to "Orders" section
3. Verify that customer orders appear here
4. Test changing order status

## 🐛 If Menu Items Still Don't Show:

1. **Check Browser Console** for any API errors
2. **Check Server Logs** in terminal for debugging messages
3. **Refresh the page** and try again
4. **Clear browser cache** if needed

## 🎉 Success Indicators:
- ✅ Admin can login successfully
- ✅ Menu items display in admin panel
- ✅ Can add/edit/delete menu items
- ✅ Customer orders appear in admin dashboard
- ✅ Both systems share the same data

The admin account is now fully linked to the restaurant! 🍽️ 