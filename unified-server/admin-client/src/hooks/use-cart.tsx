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

  // Clear all old format sessions from localStorage
  const clearOldSessions = () => {
    const oldFormatPattern = /^session-\d{13}-[A-Za-z0-9]{6,15}$/;
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('session-backup-')) {
        const sessionId = localStorage.getItem(key);
        if (sessionId && oldFormatPattern.test(sessionId)) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => {
      console.log('🧹 Removing old session backup:', key);
      localStorage.removeItem(key);
    });
    
    // Also clear any old global session
    const globalSession = (window as any).__currentSessionId;
    if (globalSession && oldFormatPattern.test(globalSession)) {
      console.log('🧹 Clearing old global session:', globalSession);
      (window as any).__currentSessionId = null;
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // First, clear any old format sessions
        clearOldSessions();
        
        const tableNumber = getTableNumber();
        console.log(`Initializing database session for table: ${tableNumber}`);

        // Check for existing session in localStorage first
        const sessionKey = `session-backup-${tableNumber}`;
        let existingSessionId = localStorage.getItem(sessionKey);

        if (existingSessionId) {
          // Check if it's an old format session and clear it
          const oldFormatPattern = /^session-\d{13}-[A-Za-z0-9]{6,15}$/;
          if (oldFormatPattern.test(existingSessionId)) {
            console.log('🧹 Clearing old format session:', existingSessionId);
            localStorage.removeItem(sessionKey);
            existingSessionId = null;
          } else {
            // Validate existing new format session with server
            try {
              const validateResponse = await fetch(`/api/session/${existingSessionId}`);
              if (validateResponse.ok) {
                const validateData = await validateResponse.json();
                if (validateData.success && validateData.session) {
                  setSessionId(existingSessionId);
                  // Set global session ID for API requests
                  (window as any).__currentSessionId = existingSessionId;
                  console.log('✅ SESSION REUSED:', existingSessionId);
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
        }

        // Clear any old global session
        (window as any).__currentSessionId = null;

        // Create new session
        console.log('🆕 Creating fresh session...');
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

          // Set global session ID for API requests
          (window as any).__currentSessionId = createData.session.id;

          console.log('✅ SESSION CREATED/SET:', createData.session.id);
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
    queryKey: ["/api/customer/cart", sessionId],
    queryFn: async () => {
      const fetchStartTime = performance.now();
      console.log("🔍 [CART LATENCY] Starting cart fetch at:", new Date().toISOString());

      if (!sessionId) {
        throw new Error("No session ID available");
      }

      console.log("📡 [CART LATENCY] Fetching cart for session:", sessionId);

      const apiStartTime = performance.now();
      const response = await apiRequest("GET", "/api/customer/cart");
      const apiEndTime = performance.now();

      console.log(`⏱️ [CART LATENCY] Cart fetch API took: ${(apiEndTime - apiStartTime).toFixed(2)}ms`);

      if (!response.ok) {
        console.error("❌ [CART LATENCY] Cart fetch failed:", response.statusText);
        throw new Error(`Error fetching cart: ${response.statusText}`);
      }

      const data = await response.json();
      const totalFetchTime = performance.now() - fetchStartTime;

      console.log(`✅ [CART LATENCY] Cart fetch completed in: ${totalFetchTime.toFixed(2)}ms`);
      console.log("📦 [CART LATENCY] Cart data fetched:", data);
      return data;
    },
    enabled: !!sessionId && !isSessionLoading, // Only run query when session is ready
    // React Query optimizations for real-time cart updates
    refetchInterval: 2000, // Refetch every 2 seconds to keep cart in sync
    staleTime: 1000, // Consider data stale after 1 second
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch when component mounts
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
    onSuccess: (data) => {
      console.log("🎯 [CART LATENCY] Cart query onSuccess - UI should update now with:", data);
    },
    onError: (error) => {
      console.error("❌ [CART LATENCY] Cart query failed:", error);
    },
  });

  console.log("useCart state - isLoading:", isLoading || isSessionLoading, "cartItems:", cartItems, "sessionId:", sessionId);

  // Show session error if any
  if (sessionError) {
    console.error("Session error:", sessionError);
  }

  const addToCartMutation = useMutation({
    mutationFn: async ({ menuItem, customizations, specialInstructions, quantity }: {
      menuItem: MenuItem;
      customizations?: any;
      specialInstructions?: string;
      quantity?: number;
    }) => {
      const startTime = performance.now();
      console.log("🚀 [CART LATENCY] Starting addToCart operation at:", new Date().toISOString());

      if (!sessionId) {
        throw new Error("No session ID available for cart operation");
      }

      console.log("📝 [CART LATENCY] Adding item to cart:", menuItem.id, "with customizations:", customizations);
      console.log("📝 [CART LATENCY] Session ID:", sessionId);

      const apiStartTime = performance.now();
      const response = await apiRequest("POST", "/api/customer/cart", {
        menuItemId: menuItem.id,
        quantity: quantity || 1,
        customizations: customizations || {},
        specialInstructions: specialInstructions || '',
      });
      const apiEndTime = performance.now();

      console.log(`⏱️ [CART LATENCY] API request took: ${(apiEndTime - apiStartTime).toFixed(2)}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [CART LATENCY] Add to cart failed:", errorText);
        throw new Error(`Error adding to cart: ${response.statusText}`);
      }

      const data = await response.json();
      const totalTime = performance.now() - startTime;
      console.log(`✅ [CART LATENCY] Add to cart mutation completed in: ${totalTime.toFixed(2)}ms`);
      console.log("📦 [CART LATENCY] Add to cart response data:", data);
      return data;
    },
    onSuccess: (data) => {
      const invalidationStartTime = performance.now();
      console.log("🔄 [CART LATENCY] addToCartMutation successful. Starting cache invalidation...", data);

      queryClient.invalidateQueries({ queryKey: ["/api/customer/cart", sessionId] });

      const invalidationEndTime = performance.now();
      console.log(`⚡ [CART LATENCY] Cache invalidation took: ${(invalidationEndTime - invalidationStartTime).toFixed(2)}ms`);
    },
    onError: (error) => {
      console.error("❌ [CART LATENCY] addToCartMutation failed:", error);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ menuItemId, quantity }: { menuItemId: number; quantity: number }) => {
      // CRITICAL FIX: Use unified session ID for URL construction
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
      // CRITICAL FIX: Use unified session ID for URL construction
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

      return total + (basePrice + customizationPrice) * item.quantity;
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
    sessionError, // Expose session error for UI handling
  };
}
