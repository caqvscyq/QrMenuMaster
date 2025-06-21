import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, ShoppingCart, Plus, User, LogOut } from "lucide-react";
import type { MenuItemWithCategory, Category } from "@shared/schema";

export default function WebsiteMenu() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { addItem, getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch menu items
  const { data: menuItems = [], isLoading: itemsLoading } = useQuery<MenuItemWithCategory[]>({
    queryKey: ["/api/menu-items", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory ? `/api/menu-items?categoryId=${selectedCategory}` : "/api/menu-items";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      return response.json();
    },
  });

  // Filter available items only
  const availableItems = menuItems.filter(item => item.status === "available");

  const handleAddToCart = (item: MenuItemWithCategory) => {
    addItem(item);
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <ChefHat className="h-8 w-8 text-orange-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Afly OrderMeals</span>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/menu" className="text-orange-600 font-medium">Menu</Link>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user.username}</span>
                  <Link href="/cart">
                    <Button variant="outline" className="relative">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Cart
                      {getTotalItems() > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">
                          {getTotalItems()}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <Button variant="outline">
                        <User className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Menu</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our carefully crafted dishes made with the finest ingredients. 
            Add your favorites to the cart and enjoy restaurant-quality meals.
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              All Items
            </Button>
            {categoriesLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-orange-600 hover:bg-orange-700" : ""}
                >
                  {category.name}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Menu Items Grid */}
        {itemsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : availableItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No menu items available</p>
            <p className="text-sm text-gray-400">
              {selectedCategory ? "Try selecting a different category" : "Check back later for new items"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={item.imageUrl || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250"}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant="secondary" className="text-lg font-bold text-orange-600">
                      ${item.price}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {item.description || "Delicious menu item crafted with care"}
                  </CardDescription>
                  {item.category && (
                    <Badge variant="outline" className="w-fit">
                      {item.category.name}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={item.status !== "available"}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <ChefHat className="h-6 w-6 text-orange-600" />
                <span className="ml-2 text-lg font-bold">Afly OrderMeals</span>
              </div>
              <p className="text-gray-400">
                Quality food delivered with exceptional service.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/menu" className="hover:text-white">Menu</Link></li>
                <li><Link href="/cart" className="hover:text-white">Cart</Link></li>
                <li><Link href="/orders" className="hover:text-white">My Orders</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Phone: (555) 123-4567</li>
                <li>Email: info@aflyordermeals.com</li>
                <li>Hours: 11am - 10pm Daily</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 mt-6 text-center text-gray-400">
            <p>&copy; 2024 Afly OrderMeals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}