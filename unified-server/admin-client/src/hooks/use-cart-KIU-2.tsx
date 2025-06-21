import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MenuItem, CartItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Database session management
const useSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Get table number from URL parameters
        const params = new URLSearchParams(window.location.search);
        const tableNumber = params.get('table') || 'unknown';

        // Validate table number format
        const validTableNumber = /^[A-Za-z0-9_-]+$/.test(tableNumber) ? tableNumber : 'unknown';

        console.log(`Initializing database session for table: ${validTableNumber}`);

        // Create or retrieve session from database
        const response = await apiRequest("POST", "/api/session/create", {
          tableNumber: validTableNumber,
          shopId: 1,
          expirationHours: 4
        });

        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.session) {
          console.log(`Database session initialized: ${data.session.id}`);
          setSessionId(data.session.id);
          // Set global session ID for API requests
          (window as any).__currentSessionId = data.session.id;
        } else {
          throw new Error('Invalid session response from server');
        }
      } catch (error) {
        console.error('Failed to initialize database session:', error);
        // Fallback: generate a temporary session ID for offline mode
        const params = new URLSearchParams(window.location.search);
        const tableNumber = params.get('table') || 'unknown';
        const fallbackId = `session-${tableNumber}-${Date.now()}-fallback`;
        console.log(`Using fallback session: ${fallbackId}`);
        setSessionId(fallbackId);
        // Set global session ID for API requests
        (window as any).__currentSessionId = fallbackId;
      } finally {
        setIsSessionLoading(false);
      }
    };

    initializeSession();
  }, []);

  return { sessionId, isSessionLoading };
};

export function useCart() {
  const { sessionId, isSessionLoading } = useSession();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery<(CartItem & { menuItem: MenuItem })[]>({
    queryKey: ["/api/customer/cart", sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("No session ID available");
      }
      console.log("Fetching cart for database session:", sessionId);
      const response = await apiRequest("GET", "/api/customer/cart");
      if (!response.ok) {
        throw new Error(`Error fetching cart: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Cart data fetched:", data);
      return data;
    },
    enabled: !!sessionId && !isSessionLoading, // Only run query when session is ready
  });

  console.log("useCart state - isLoading:", isLoading || isSessionLoading, "cartItems:", cartItems, "sessionId:", sessionId);

  const addToCartMutation = useMutation({
    mutationFn: async (menuItem: MenuItem) => {
      if (!sessionId) {
        throw new Error("No session ID available for cart operation");
      }
      console.log("Adding item to cart with database session:", menuItem.id, "sessionId:", sessionId);
      const response = await apiRequest("POST", "/api/customer/cart", {
        menuItemId: menuItem.id,
        quantity: 1,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Add to cart failed:", errorText);
        throw new Error(`Error adding to cart: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Add to cart response data:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("addToCartMutation successful. Invalidating queries.", data);
      queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
    },
    onError: (error) => {
      console.error("addToCartMutation failed:", error);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ menuItemId, quantity }: { menuItemId: number; quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/customer/cart/${menuItemId}`, {
        quantity,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (menuItemId: number) => {
      const response = await apiRequest("DELETE", `/api/customer/cart/${menuItemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (tableNumber: string) => {
      const subtotal = getTotalPrice();
      const serviceFee = subtotal * 0.1;
      const total = subtotal + serviceFee;

      const orderItems = cartItems.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
        itemName: item.menuItem.name,
      }));

      console.log("Creating order with items:", orderItems);
      console.log("Session ID:", sessionId);
      
      const response = await apiRequest("POST", "/api/customer/orders", {
        order: {
          shopId: 1,
          sessionId,
          tableNumber,
          status: "pending",
          subtotal: subtotal.toFixed(2),
          serviceFee: serviceFee.toFixed(2),
          total: total.toFixed(2),
        },
        items: orderItems,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Order creation failed:", errorText);
        throw new Error(`Failed to create order: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Order created successfully:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
    },
  });

  const addToCart = (menuItem: MenuItem) => {
    addToCartMutation.mutate(menuItem);
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCartMutation.mutate(menuItemId);
    } else {
      updateQuantityMutation.mutate({ menuItemId, quantity });
    }
  };

  const removeFromCart = (menuItemId: number) => {
    removeFromCartMutation.mutate(menuItemId);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.menuItem.price) * item.quantity;
    }, 0);
  };

  const createOrder = async (tableNumber: string) => {
    return createOrderMutation.mutateAsync(tableNumber);
  };

  return {
    cartItems,
    isLoading: isLoading || isSessionLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    getTotalItems,
    getTotalPrice,
    createOrder,
    isCreatingOrder: createOrderMutation.isPending,
    sessionId, // Expose session ID for debugging
  };
}
