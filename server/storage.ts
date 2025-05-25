import { menuItems, cartItems, orders, orderItems, type MenuItem, type InsertMenuItem, type CartItem, type InsertCartItem, type Order, type InsertOrder, type OrderItem, type InsertOrderItem } from "@shared/schema";

export interface IStorage {
  // Menu items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  searchMenuItems(query: string): Promise<MenuItem[]>;
  
  // Cart items
  getCartItems(sessionId: string): Promise<(CartItem & { menuItem: MenuItem })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(sessionId: string, menuItemId: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(sessionId: string, menuItemId: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<void>;
  
  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<(OrderItem & { menuItem: MenuItem })[]>;
}

export class MemStorage implements IStorage {
  private menuItemsMap: Map<number, MenuItem>;
  private cartItemsMap: Map<string, CartItem[]>;
  private ordersMap: Map<number, Order>;
  private orderItemsMap: Map<number, OrderItem[]>;
  private currentMenuItemId: number;
  private currentCartItemId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;

  constructor() {
    this.menuItemsMap = new Map();
    this.cartItemsMap = new Map();
    this.ordersMap = new Map();
    this.orderItemsMap = new Map();
    this.currentMenuItemId = 1;
    this.currentCartItemId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    
    // Initialize with sample menu items
    this.initializeMenuItems();
  }

  private initializeMenuItems() {
    const sampleItems: Omit<MenuItem, 'id'>[] = [
      {
        name: "紅燒牛肉麵",
        description: "精選牛腱肉，搭配濃郁湯頭",
        price: "280.00",
        category: "noodles",
        imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.8",
        reviewCount: 156,
        isPopular: true,
        isAvailable: true,
      },
      {
        name: "招牌炒飯",
        description: "蛋香四溢，配菜豐富",
        price: "180.00",
        category: "rice",
        imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.6",
        reviewCount: 89,
        isPopular: true,
        isAvailable: true,
      },
      {
        name: "鹽酥雞",
        description: "酥脆外皮，多汁內餡",
        price: "120.00",
        category: "appetizers",
        imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.7",
        reviewCount: 234,
        isPopular: true,
        isAvailable: true,
      },
      {
        name: "擔仔麵",
        description: "台南傳統小吃，鮮美湯頭",
        price: "150.00",
        category: "noodles",
        imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.5",
        reviewCount: 67,
        isPopular: false,
        isAvailable: true,
      },
      {
        name: "麻辣牛肉麵",
        description: "香辣過癮，牛肉軟嫩",
        price: "320.00",
        category: "noodles",
        imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.9",
        reviewCount: 198,
        isPopular: false,
        isAvailable: true,
      },
      {
        name: "珍珠奶茶",
        description: "Q彈珍珠，香濃奶茶",
        price: "65.00",
        category: "drinks",
        imageUrl: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.4",
        reviewCount: 145,
        isPopular: false,
        isAvailable: true,
      },
      {
        name: "冬瓜茶",
        description: "清香甘甜，消暑解膩",
        price: "45.00",
        category: "drinks",
        imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.3",
        reviewCount: 78,
        isPopular: false,
        isAvailable: true,
      },
      {
        name: "清燉牛肉麵",
        description: "清淡湯頭，牛肉鮮美",
        price: "260.00",
        category: "noodles",
        imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.6",
        reviewCount: 92,
        isPopular: false,
        isAvailable: true,
      },
      {
        name: "餛飩麵",
        description: "手工餛飩，鮮美湯頭",
        price: "180.00",
        category: "noodles",
        imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.4",
        reviewCount: 73,
        isPopular: false,
        isAvailable: true,
      },
      {
        name: "乾拌麵",
        description: "香濃肉燥，口感豐富",
        price: "160.00",
        category: "noodles",
        imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200",
        rating: "4.2",
        reviewCount: 54,
        isPopular: false,
        isAvailable: true,
      },
    ];

    sampleItems.forEach(item => {
      const menuItem: MenuItem = { ...item, id: this.currentMenuItemId++ };
      this.menuItemsMap.set(menuItem.id, menuItem);
    });
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItemsMap.values());
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    const allItems = Array.from(this.menuItemsMap.values());
    if (category === "all") return allItems;
    return allItems.filter(item => item.category === category);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItemsMap.get(id);
  }

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    const allItems = Array.from(this.menuItemsMap.values());
    const searchTerm = query.toLowerCase();
    
    return allItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    );
  }

  async getCartItems(sessionId: string): Promise<(CartItem & { menuItem: MenuItem })[]> {
    const cartItems = this.cartItemsMap.get(sessionId) || [];
    return cartItems.map(cartItem => {
      const menuItem = this.menuItemsMap.get(cartItem.menuItemId);
      if (!menuItem) throw new Error(`Menu item ${cartItem.menuItemId} not found`);
      return { ...cartItem, menuItem };
    });
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const cartItems = this.cartItemsMap.get(item.sessionId) || [];
    const existingItem = cartItems.find(ci => ci.menuItemId === item.menuItemId);
    
    if (existingItem) {
      existingItem.quantity += item.quantity;
      return existingItem;
    } else {
      const newCartItem: CartItem = {
        id: this.currentCartItemId++,
        ...item,
      };
      cartItems.push(newCartItem);
      this.cartItemsMap.set(item.sessionId, cartItems);
      return newCartItem;
    }
  }

  async updateCartItemQuantity(sessionId: string, menuItemId: number, quantity: number): Promise<CartItem | undefined> {
    const cartItems = this.cartItemsMap.get(sessionId) || [];
    const item = cartItems.find(ci => ci.menuItemId === menuItemId);
    
    if (item) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const index = cartItems.indexOf(item);
        cartItems.splice(index, 1);
        this.cartItemsMap.set(sessionId, cartItems);
        return undefined;
      } else {
        item.quantity = quantity;
        return item;
      }
    }
    return undefined;
  }

  async removeFromCart(sessionId: string, menuItemId: number): Promise<boolean> {
    const cartItems = this.cartItemsMap.get(sessionId) || [];
    const index = cartItems.findIndex(ci => ci.menuItemId === menuItemId);
    
    if (index !== -1) {
      cartItems.splice(index, 1);
      this.cartItemsMap.set(sessionId, cartItems);
      return true;
    }
    return false;
  }

  async clearCart(sessionId: string): Promise<void> {
    this.cartItemsMap.set(sessionId, []);
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const newOrder: Order = {
      id: this.currentOrderId++,
      ...order,
      createdAt: new Date().toISOString(),
    };
    
    this.ordersMap.set(newOrder.id, newOrder);
    
    const orderItems = items.map(item => ({
      id: this.currentOrderItemId++,
      orderId: newOrder.id,
      ...item,
    }));
    
    this.orderItemsMap.set(newOrder.id, orderItems);
    
    // Clear the cart after creating order
    await this.clearCart(order.sessionId);
    
    return newOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.ordersMap.get(id);
  }

  async getOrderItems(orderId: number): Promise<(OrderItem & { menuItem: MenuItem })[]> {
    const orderItems = this.orderItemsMap.get(orderId) || [];
    return orderItems.map(orderItem => {
      const menuItem = this.menuItemsMap.get(orderItem.menuItemId);
      if (!menuItem) throw new Error(`Menu item ${orderItem.menuItemId} not found`);
      return { ...orderItem, menuItem };
    });
  }
}

export const storage = new MemStorage();
