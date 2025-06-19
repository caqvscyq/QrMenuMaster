import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: { username: string; password: string; email?: string; phone?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log("Authentication failed, clearing token");
            setToken(null);
            localStorage.removeItem("token");
            return null;
          }
          throw new Error("Failed to get user info");
        }
        
        return response.json();
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/auth/login", { username, password });
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("token", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      
      // Redirect based on role
      if (data.user.role === "admin" || data.user.role === "staff") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/menu");
      }
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; email?: string; phone?: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("token", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      setLocation("/menu");
    },
  });

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    queryClient.clear();
    setLocation("/login");
  };

  // Update API request headers when token changes
  useEffect(() => {
    if (token) {
      // Set default authorization header for future requests
      const originalFetch = window.fetch;
      window.fetch = function(input, init = {}) {
        if (typeof input === 'string' && (input.startsWith('/api/') || input.startsWith('/admin/'))) {
          init.headers = {
            ...init.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return originalFetch(input, init);
      };
      
      // Attempt to refetch user data when token changes
      if (!user) {
        refetch();
      }
    }
  }, [token, refetch, user]);

  // Auto-refresh authentication periodically
  useEffect(() => {
    if (token) {
      const refreshInterval = setInterval(() => {
        refetch();
      }, 1000 * 60 * 15); // Refresh every 15 minutes
      
      return () => clearInterval(refreshInterval);
    }
  }, [token, refetch]);

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    login: async (username: string, password: string) => {
      await loginMutation.mutateAsync({ username, password });
    },
    register: async (userData) => {
      await registerMutation.mutateAsync(userData);
    },
    logout,
    isAuthenticated: !!user,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
