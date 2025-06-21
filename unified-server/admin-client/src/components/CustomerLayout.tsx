import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  User,
  Search,
  ArrowLeft
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CustomerLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
}

export default function CustomerLayout({
  children,
  title = "Afly Restaurant",
  showBackButton = false,
  showSearch = true
}: CustomerLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();

  // Get actual cart count from cart hook
  const cartCount = getTotalItems();

  const navigation = [
    { name: "Menu", href: "/menu", icon: UtensilsCrossed },
    { name: "Orders", href: "/orders", icon: Receipt },
    { name: "Cart", href: "/cart", icon: ShoppingCart, badge: cartCount },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {showBackButton && (
                <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="w-8 h-8 bg-primary-orange rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-secondary-gray dark:text-white">{title}</h1>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Est. delivery: 25-30 min</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs bg-primary-orange hover:bg-primary-orange/90">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              {user?.role === "customer" && (
                <Link href="/admin">
                  <Button size="sm" variant="outline" className="text-xs border-primary-orange text-primary-orange hover:bg-primary-orange hover:text-white">
                    Admin View
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-3 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search menu..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-orange focus:bg-white dark:focus:bg-neutral-600 focus:outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 z-50">
        <div className="grid grid-cols-4 gap-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center py-2 px-1 h-auto relative ${
                    isActive 
                      ? "text-primary-orange" 
                      : "text-neutral-600 dark:text-neutral-400 hover:text-primary-orange"
                  }`}
                >
                  <item.icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.name}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-primary-orange hover:bg-primary-orange/90">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
