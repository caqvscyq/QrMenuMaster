import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MenuItem, CartItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Database-based session management hook
const useSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get table number from URL parameters
  const getTableNumber = (): string => {
    const params = new URLSearchParams(window.location.search);
    const tableNumber = params.get('table') || 'unknown';

    // Validate table number format to prevent injection
    return /^[A-Za-z0-9_-]+$/.test(tableNumber) ? tableNumber : 'unknown';
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const tableNumber = getTableNumber();
        console.log(`Initializing database session for table: ${tableNumber}`);

        // Check for existing session in localStorage first
        const sessionKey = `session-backup-${tableNumber}`;
        let existingSessionId = localStorage.getItem(sessionKey);

        if (existingSessionId) {
          // Validate existing session with server
          try {
            const validateResponse = await fetch(`/api/session/${existingSessionId}`);
            if (validateResponse.ok) {
              const validateData = await validateResponse.json();
              if (validateData.success && validateData.session) {
                setSessionId(existingSessionId);
                console.log(`Using existing valid session: ${existingSessionId}`);
                return;
              }
            }
          } catch (validateError) {
            console.warn('Failed to validate existing session:', validateError);
          }

          // Clear invalid session
          localStorage.removeItem(sessionKey);
        }

        // Create new session
        const createResponse = await fetch('/api/session/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableNumber,
            shopId: 1,
            expirationHours: 4
          })
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create session');
        }

        const createData = await createResponse.json();

        if (createData.success && createData.session) {
          setSessionId(createData.session.id);

          // Store session ID as backup
          localStorage.setItem(sessionKey, createData.session.id);

          console.log(`Created new session: ${createData.session.id}`);
        } else {
          throw new Error(createData.message || 'Failed to create session');
        }

      } catch (error) {
        console.error('Failed to initialize database session:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize session');

        // Don't create fallback session - let the error be handled by the UI
        // This prevents the creation of invalid session IDs that cause 401 errors

      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  return { sessionId, isLoading, error };
};

export function useCart() {
  const { sessionId, isLoading: isSessionLoading, error: sessionError } = useSession();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery<(CartItem & { menuItem: MenuItem })[]>({
    queryKey: ["/api/cart", sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("No session ID available");
      }
      console.log("Fetching cart for database session:", sessionId);
      const response = await apiRequest("GET", `/api/cart/${sessionId}`);
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

  // Show session error if any
  if (sessionError) {
    console.error("Session error:", sessionError);
  }

  const addToCartMutation = useMutation({
    mutationFn: async (menuItem: MenuItem) => {
      console.log("Adding item to cart:", menuItem.id);
      const response = await apiRequest("POST", "/api/cart", {
        sessionId,
        menuItemId: menuItem.id,
        quantity: 1,
      });
      if (!response.ok) {
        throw new Error(`Error adding to cart: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Add to cart response data:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("addToCartMutation successful. Invalidating queries.", data);
      queryClient.invalidateQueries({ queryKey: ["/api/cart", sessionId] });
    },
    onError: (error) => {
      console.error("addToCartMutation failed:", error);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ menuItemId, quantity }: { menuItemId: number; quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/cart/${sessionId}/${menuItemId}`, {
        quantity,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", sessionId] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (menuItemId: number) => {
      const response = await apiRequest("DELETE", `/api/cart/${sessionId}/${menuItemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", sessionId] });
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
      
      const response = await apiRequest("POST", "/api/orders", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/cart", sessionId] });
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
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    getTotalItems,
    getTotalPrice,
    createOrder,
    isCreatingOrder: createOrderMutation.isPending,
  };
}
