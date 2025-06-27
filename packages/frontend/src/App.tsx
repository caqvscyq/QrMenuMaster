import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";


// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin/dashboard";
import MenuManagement from "@/pages/admin/menu-management";
import AdminOrders from "@/pages/admin/orders";
import AdminDesks from "@/pages/admin/desks";
import CustomerMenu from "@/pages/menu";
import CustomerCart from "@/pages/customer/cart";
import CustomerOrders from "@/pages/customer/orders";
import NewFeaturePage from "@/pages/customer/new-feature";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CustomerMenu} />
      <Route path="/home" component={Home} />
      <Route path="/login" component={Login} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/menu" component={MenuManagement} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/desks" component={AdminDesks} />
      
      {/* Customer Routes */}
      <Route path="/menu" component={CustomerMenu} />
      <Route path="/cart" component={CustomerCart} />
      <Route path="/orders" component={CustomerOrders} />
      <Route path="/new-feature" component={NewFeaturePage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-white">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
