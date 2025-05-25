import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MenuItem, CartItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Generate a session ID for cart management
const getSessionId = () => {
  let sessionId = localStorage.getItem("cart-session-id");
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("cart-session-id", sessionId);
  }
  return sessionId;
};

export function useCart() {
  const [sessionId] = useState(getSessionId);
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery<(CartItem & { menuItem: MenuItem })[]>({
    queryKey: ["/api/cart", sessionId],
  });

  const addToCartMutation = useMutation({
    mutationFn: async (menuItem: MenuItem) => {
      const response = await apiRequest("POST", "/api/cart", {
        sessionId,
        menuItemId: menuItem.id,
        quantity: 1,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", sessionId] });
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
      }));

      const response = await apiRequest("POST", "/api/orders", {
        order: {
          sessionId,
          tableNumber,
          status: "pending",
          subtotal: subtotal.toFixed(2),
          serviceFee: serviceFee.toFixed(2),
          total: total.toFixed(2),
        },
        items: orderItems,
      });
      return response.json();
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
