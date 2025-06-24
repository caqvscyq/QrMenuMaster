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

  // Create or get session from server
  const initializeSession = async () => {
    const tableNumber = getTableNumber();
    
    if (tableNumber === 'unknown') {
      setError('Invalid table number in URL');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Try to get existing session from localStorage backup
      // Check for any existing session IDs and clean them up
      const backupSessionId = localStorage.getItem(`session-backup-${tableNumber}`);
      const oldSessionKey = `cart-session-id-${tableNumber}`;
      const oldSessionId = localStorage.getItem(oldSessionKey);

      // Clean up any old session storage keys and global variables
      if (oldSessionId) {
        console.log('🧹 Cleaning up old session storage:', oldSessionId);
        localStorage.removeItem(oldSessionKey);
      }

      // Clear any global session variables that might cause conflicts
      (window as any).__currentSessionId = null;

      // Clean up any other potential session storage keys
      const additionalKeys = [
        `session-${tableNumber}`,
        'currentSessionId',
        '__sessionId'
      ];

      additionalKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          console.log(`🧹 Cleaning up additional storage key: ${key}`);
          localStorage.removeItem(key);
        }
      });

      if (backupSessionId) {
        // Validate the backup session with server
        try {
          const validateResponse = await fetch(`/api/session/${backupSessionId}`);

          if (validateResponse.ok) {
            const validateData = await validateResponse.json();

            if (validateData.success && validateData.session.status === 'active') {
              setSessionId(backupSessionId);

              // Set global session ID for API requests
              (window as any).__currentSessionId = backupSessionId;

              console.log(`✅ Restored session from backup: ${backupSessionId}`);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.warn('Failed to validate backup session:', error);
        }

        // Remove invalid backup
        console.log('🧹 Removing invalid backup session:', backupSessionId);
        localStorage.removeItem(`session-backup-${tableNumber}`);
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
        localStorage.setItem(`session-backup-${tableNumber}`, createData.session.id);

        // Set global session ID for API requests
        (window as any).__currentSessionId = createData.session.id;

        console.log(`Created new session: ${createData.session.id}`);
      } else {
        throw new Error(createData.message || 'Failed to create session');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
      setError(errorMessage);
      console.error('Session initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update session activity
  const updateActivity = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/session/${sessionId}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (err) {
      console.error('Failed to update session activity:', err);
    }
  };

  // Complete session when order is placed
  const completeSession = async () => {
    if (!sessionId) return false;

    try {
      const response = await fetch(`/api/session/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error('Failed to complete session:', err);
      return false;
    }
  };

  useEffect(() => {
    initializeSession();
  }, []);

  // Set up activity heartbeat
  useEffect(() => {
    if (!sessionId) return;

    // Update activity every 5 minutes
    const heartbeatInterval = setInterval(updateActivity, 5 * 60 * 1000);

    return () => clearInterval(heartbeatInterval);
  }, [sessionId]);

  return {
    sessionId,
    isLoading,
    error,
    updateActivity,
    completeSession
  };
};

export function useCart() {
  const { sessionId, isLoading: sessionLoading, error: sessionError, completeSession } = useSession();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading: cartLoading, refetch: refetchCart } = useQuery<(CartItem & { menuItem: MenuItem })[]>({
    queryKey: ["/api/customer/cart", sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('No session ID available');
      }

      console.log("🛒 Fetching cart for session:", sessionId);
      console.log("🛒 Global session ID:", (window as any).__currentSessionId);
      console.log("🛒 Session loading:", sessionLoading);

      const response = await apiRequest("GET", "/api/customer/cart");
      console.log("🛒 Cart response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🛒 Cart fetch error:", response.status, errorText);
        throw new Error(`Error fetching cart: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🛒 Cart data fetched:", data);
      console.log("🛒 Cart items count:", data.length);
      return data;
    },
    enabled: !!sessionId && !sessionLoading && !!(window as any).__currentSessionId, // Only run query when session is fully ready
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    cacheTime: 0, // Don't cache the data
    refetchInterval: 1000, // Refetch every second to ensure real-time updates
  });

  const isLoading = sessionLoading || cartLoading;

  // Trigger cart fetch when session becomes ready
  useEffect(() => {
    if (sessionId && !sessionLoading && (window as any).__currentSessionId) {
      console.log("🔄 Session is ready, triggering cart fetch for session:", sessionId);
      console.log("🔄 Global session ID:", (window as any).__currentSessionId);

      // Small delay to ensure session is fully synchronized
      setTimeout(async () => {
        try {
          await refetchCart();
          queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
        } catch (error) {
          console.error("❌ Error in session ready cart fetch:", error);
        }
      }, 100);
    }
  }, [sessionId, sessionLoading, queryClient, refetchCart]);

  console.log("useCart state - sessionId:", sessionId, "isLoading:", isLoading, "cartItems:", cartItems);

  const addToCartMutation = useMutation({
    mutationFn: async ({ menuItem, customizations, specialInstructions, quantity }: {
      menuItem: MenuItem;
      customizations?: any;
      specialInstructions?: string;
      quantity?: number;
    }) => {
      if (!sessionId) {
        throw new Error('No session ID available');
      }

      console.log("Adding item to cart:", menuItem.id, "with customizations:", customizations);
      const response = await apiRequest("POST", "/api/customer/cart", {
        menuItemId: menuItem.id,
        quantity: quantity || 1,
        customizations: customizations || {},
        specialInstructions: specialInstructions || '',
      });
      if (!response.ok) {
        throw new Error(`Error adding to cart: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Add to cart response data:", data);
      return data;
    },
    onSuccess: async (data) => {
      console.log("✅ addToCartMutation successful:", data);
      console.log("✅ Forcing immediate cart refetch for session:", sessionId);

      // Force immediate refetch using multiple methods
      try {
        // Invalidate first to mark cache as stale
        queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
        queryClient.invalidateQueries({ queryKey: ["/api/customer/cart"] });

        // Force immediate refetch
        await refetchCart();

        // Also trigger multiple refetches to ensure UI updates
        setTimeout(async () => {
          await refetchCart();
          queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
        }, 50);

        setTimeout(async () => {
          await refetchCart();
        }, 200);
      } catch (error) {
        console.error("❌ Error refetching cart:", error);
      }
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
    onSuccess: async (data) => {
      console.log("✅ updateQuantityMutation successful:", data);
      console.log("✅ Forcing immediate cart refetch for session:", sessionId);

      // Force immediate refetch using multiple methods
      try {
        // Invalidate first to mark cache as stale
        queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
        queryClient.invalidateQueries({ queryKey: ["/api/customer/cart"] });

        // Force immediate refetch
        await refetchCart();

        // Also trigger multiple refetches to ensure UI updates
        setTimeout(async () => {
          await refetchCart();
          queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
        }, 50);

        setTimeout(async () => {
          await refetchCart();
        }, 200);
      } catch (error) {
        console.error("❌ Error refetching cart after quantity update:", error);
      }
    },
    onError: (error) => {
      console.error("updateQuantityMutation failed:", error);
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (menuItemId: number) => {
      const response = await apiRequest("DELETE", `/api/customer/cart/${menuItemId}`);
      return response.json();
    },
    onSuccess: async (data) => {
      console.log("✅ removeFromCartMutation successful:", data);
      console.log("✅ Forcing immediate cart refetch for session:", sessionId);

      // Force immediate refetch using multiple methods
      try {
        // Invalidate first to mark cache as stale
        queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
        queryClient.invalidateQueries({ queryKey: ["/api/customer/cart"] });

        // Force immediate refetch
        await refetchCart();

        // Also trigger multiple refetches to ensure UI updates
        setTimeout(async () => {
          await refetchCart();
          queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
        }, 50);

        setTimeout(async () => {
          await refetchCart();
        }, 200);
      } catch (error) {
        console.error("❌ Error refetching cart after removal:", error);
      }
    },
    onError: (error) => {
      console.error("removeFromCartMutation failed:", error);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (tableNumber: string) => {
      if (!sessionId) {
        throw new Error('No session ID available');
      }

      const subtotal = getTotalPrice();
      const serviceFee = subtotal * 0.1;
      const total = subtotal + serviceFee;

      const orderItems = cartItems.map(item => {
        const basePrice = parseFloat(item.menuItem.price);
        let customizationPrice = 0;

        // Calculate customization price
        if (item.menuItem.customizationOptions && item.customizations) {
          const customizationOptions = item.menuItem.customizationOptions;
          const selectedCustomizations = item.customizations;

          customizationOptions.forEach((option: any) => {
            const selectedValue = selectedCustomizations[option.id];

            if (option.type === 'checkbox' && selectedValue) {
              customizationPrice += option.price || 0;
            } else if (option.type === 'radio' && selectedValue && option.options) {
              const selectedOption = option.options.find((opt: any) => opt.id === selectedValue);
              if (selectedOption) {
                customizationPrice += selectedOption.price || 0;
              }
            }
          });
        }

        const totalItemPrice = basePrice + customizationPrice;

        return {
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          price: totalItemPrice.toFixed(2),
          itemName: item.menuItem.name,
          customizations: item.customizations || {},
          specialInstructions: item.specialInstructions || '',
          customizationCost: customizationPrice.toFixed(2),
        };
      });

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
      
      // Complete the session after successful order
      await completeSession();
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });
    },
  });

  const addToCart = (menuItem: MenuItem, customizations?: any, specialInstructions?: string, quantity?: number) => {
    if (!sessionId) {
      console.error('Cannot add to cart: No session ID available');
      return;
    }
    addToCartMutation.mutate({ menuItem, customizations, specialInstructions, quantity });
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
      const basePrice = parseFloat(item.menuItem.price);

      // Use stored customization cost if available, otherwise calculate
      let customizationPrice = 0;
      if (item.customizationCost) {
        customizationPrice = parseFloat(item.customizationCost);
        console.log(`🧮 Using stored customizationCost for ${item.menuItem.name}: $${customizationPrice}`);
      } else if (item.menuItem.customizationOptions && item.customizations) {
        // Fallback to calculation if customizationCost is not stored
        console.log(`🧮 Calculating customizationCost for ${item.menuItem.name} (no stored cost)`);
        const customizationOptions = item.menuItem.customizationOptions;
        const selectedCustomizations = item.customizations;

        customizationOptions.forEach((option: any) => {
          const selectedValue = selectedCustomizations[option.id];

          if (option.type === 'checkbox' && selectedValue) {
            customizationPrice += option.price || 0;
          } else if (option.type === 'radio' && selectedValue && option.options) {
            const selectedOption = option.options.find((opt: any) => opt.id === selectedValue);
            if (selectedOption) {
              customizationPrice += selectedOption.price || 0;
            }
          }
        });
        console.log(`🧮 Calculated customizationCost for ${item.menuItem.name}: $${customizationPrice}`);
      } else {
        console.log(`🧮 No customizations for ${item.menuItem.name}`);
      }

      const itemTotal = (basePrice + customizationPrice) * item.quantity;
      console.log(`🧮 Item total for ${item.menuItem.name}: $${basePrice} + $${customizationPrice} × ${item.quantity} = $${itemTotal}`);

      return total + itemTotal;
    }, 0);
  };

  const createOrder = async (tableNumber: string) => {
    return createOrderMutation.mutateAsync(tableNumber);
  };

  return {
    cartItems,
    isLoading,
    sessionId,
    sessionError,
    addToCart,
    updateQuantity,
    removeFromCart,
    getTotalItems,
    getTotalPrice,
    createOrder,
    isCreatingOrder: createOrderMutation.isPending,
  };
}
