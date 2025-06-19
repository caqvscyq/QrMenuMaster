import { 
  users, categories, menuItems, orders, orderItems,
  type User, type InsertUser, 
  type Category, type InsertCategory,
  type MenuItem, type InsertMenuItem,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type MenuItemWithCategory,
  type OrderWithItems,
  type CartItem,
  type InsertCartItem,
  type Desk,
  type InsertDesk
} from "@shared/schema";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(shopId: number): Promise<Category[]>;
  getCategory(id: number, shopId: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, shopId: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number, shopId: number): Promise<boolean>;

  // Menu Items
  getMenuItems(shopId: number, categoryId?: number): Promise<MenuItemWithCategory[]>;
  getMenuItem(id: number, shopId: number): Promise<MenuItemWithCategory | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, shopId: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number, shopId: number): Promise<boolean>;
  searchMenuItems(query: string, shopId: number): Promise<MenuItem[]>;

  // Cart Operations (for session-based cart management)
  getCartItems(sessionId: string): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<void>;
  updateCartItemQuantity(sessionId: string, menuItemId: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(sessionId: string, menuItemId: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<void>;

  // Orders
  getOrders(shopId: number, status?: string): Promise<OrderWithItems[]>;
  getOrder(id: number, shopId: number): Promise<OrderWithItems | undefined>;
  getUserOrders(userId: number, shopId: number): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(id: number, shopId: number, status: string): Promise<Order | undefined>;

  // Table/Desk Management
  getDesks(shopId: number): Promise<Desk[]>;
  getDesk(id: number, shopId: number): Promise<Desk | undefined>;
  createDesk(desk: InsertDesk): Promise<Desk>;
  updateDesk(id: number, shopId: number, desk: Partial<InsertDesk>): Promise<Desk | undefined>;
  deleteDesk(id: number, shopId: number): Promise<boolean>;
  toggleDeskStatus(id: number, shopId: number, newStatus: 'available' | 'occupied'): Promise<Desk | undefined>;
  completeAndPayDeskOrders(deskId: number): Promise<Order[]>;

  // Statistics
  getStats(shopId: number): Promise<{
    todayOrders: number;
    revenue: number;
    activeCustomers: number;
    menuItemsCount: number;
  }>;
}

// Deprecated: MemStorage is replaced by DatabaseStorage
/*
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentMenuItemId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentMenuItemId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.seedData();
  }

  private seedData() {
    // Create default admin user
    const admin: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123",
      role: "admin",
      email: "admin@aflymails.com",
      phone: "+1234567890",
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create sample categories
    const appetizers: Category = {
      id: this.currentCategoryId++,
      name: "Appetizers",
      description: "Start your meal with these delicious appetizers",
      isActive: true,
    };
    this.categories.set(appetizers.id, appetizers);

    const mainCourses: Category = {
      id: this.currentCategoryId++,
      name: "Main Courses",
      description: "Hearty and satisfying main dishes",
      isActive: true,
    };
    this.categories.set(mainCourses.id, mainCourses);

    const desserts: Category = {
      id: this.currentCategoryId++,
      name: "Desserts",
      description: "Sweet treats to end your meal",
      isActive: true,
    };
    this.categories.set(desserts.id, desserts);

    const beverages: Category = {
      id: this.currentCategoryId++,
      name: "Beverages",
      description: "Refreshing drinks and beverages",
      isActive: true,
    };
    this.categories.set(beverages.id, beverages);

    // Create sample menu items
    const sampleItems: Omit<MenuItem, 'id' | 'createdAt'>[] = [
      {
        name: "Grilled Salmon",
        description: "Fresh Atlantic salmon with seasonal vegetables and herbs",
        price: "24.99",
        categoryId: mainCourses.id,
        imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        status: "available",
      },
      {
        name: "Margherita Pizza",
        description: "Traditional pizza with fresh mozzarella and basil",
        price: "18.99",
        categoryId: mainCourses.id,
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        status: "available",
      },
      {
        name: "Caesar Salad",
        description: "Crisp romaine lettuce with classic Caesar dressing",
        price: "12.99",
        categoryId: appetizers.id,
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        status: "available",
      },
      {
        name: "Classic Beef Burger",
        description: "Juicy beef patty with lettuce, tomato, and cheese",
        price: "16.99",
        categoryId: mainCourses.id,
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        status: "available",
      },
      {
        name: "Chocolate Cake",
        description: "Rich chocolate cake with fresh berries",
        price: "8.99",
        categoryId: desserts.id,
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        status: "out_of_stock",
      },
      {
        name: "Tropical Smoothie",
        description: "Fresh mango, pineapple, and coconut blend",
        price: "7.99",
        categoryId: beverages.id,
        imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        status: "available",
      },
    ];

    sampleItems.forEach(item => {
      const menuItem: MenuItem = {
        ...item,
        id: this.currentMenuItemId++,
        createdAt: new Date(),
      };
      this.menuItems.set(menuItem.id, menuItem);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.isActive);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      ...insertCategory,
      id: this.currentCategoryId++,
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: number, updateCategory: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updated = { ...category, ...updateCategory };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Menu Items
  async getMenuItems(categoryId?: number): Promise<MenuItemWithCategory[]> {
    const items = Array.from(this.menuItems.values());
    const filtered = categoryId ? items.filter(item => item.categoryId === categoryId) : items;
    
    return filtered.map(item => ({
      ...item,
      category: item.categoryId ? this.categories.get(item.categoryId) : undefined,
    }));
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const menuItem: MenuItem = {
      ...insertMenuItem,
      id: this.currentMenuItemId++,
      createdAt: new Date(),
    };
    this.menuItems.set(menuItem.id, menuItem);
    return menuItem;
  }

  async updateMenuItem(id: number, updateMenuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) return undefined;
    
    const updated = { ...menuItem, ...updateMenuItem };
    this.menuItems.set(id, updated);
    return updated;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  // Orders
  async getOrders(status?: string): Promise<OrderWithItems[]> {
    const orders = Array.from(this.orders.values());
    const filtered = status ? orders.filter(order => order.status === status) : orders;
    
    return filtered.map(order => this.populateOrder(order)).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    return this.populateOrder(order);
  }

  async getUserOrders(userId: number): Promise<OrderWithItems[]> {
    const orders = Array.from(this.orders.values()).filter(order => order.customerId === userId);
    return orders.map(order => this.populateOrder(order)).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const order: Order = {
      ...insertOrder,
      id: this.currentOrderId++,
      createdAt: new Date(),
    };
    this.orders.set(order.id, order);

    // Create order items
    items.forEach(item => {
      const orderItem: OrderItem = {
        ...item,
        orderId: order.id,
        id: this.currentOrderItemId++,
      };
      this.orderItems.set(orderItem.id, orderItem);
    });

    return this.populateOrder(order);
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  private populateOrder(order: Order): OrderWithItems {
    const items = Array.from(this.orderItems.values())
      .filter(item => item.orderId === order.id)
      .map(item => ({
        ...item,
        menuItem: item.menuItemId ? this.menuItems.get(item.menuItemId) : undefined,
      }));

    const customer = order.customerId ? this.users.get(order.customerId) : undefined;

    return {
      ...order,
      items,
      customer,
    };
  }

  // Statistics
  async getStats(): Promise<{
    todayOrders: number;
    revenue: number;
    activeCustomers: number;
    menuItemsCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = Array.from(this.orders.values()).filter(order => {
      const orderDate = new Date(order.createdAt!);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;

    const revenue = Array.from(this.orders.values())
      .filter(order => {
        const orderDate = new Date(order.createdAt!);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      })
      .reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);

    const activeCustomers = Array.from(this.users.values()).filter(user => user.role === "customer").length;
    const menuItemsCount = this.menuItems.size;

    return {
      todayOrders,
      revenue,
      activeCustomers,
      menuItemsCount,
    };
  }
}

}
*/

// MemStorage is now deprecated - use DatabaseStorage instead
// export const storage = new MemStorage();
