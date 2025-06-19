import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CustomerLayout from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { MenuItemWithCategory, Category } from "@shared/schema";

export default function CustomerMenu() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { addItem } = useCart();
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

  const getStatusBadge = (status: string) => {
    if (status === "out_of_stock") {
      return <Badge className="status-out_of_stock">Out of Stock</Badge>;
    }
    return null;
  };

  return (
    <CustomerLayout title="Afly Restaurant" showSearch={true}>
      {/* Category Tabs */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 overflow-x-auto">
        <div className="flex space-x-1 px-4 py-3">
          <Button
            variant={selectedCategory === null ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 rounded-full ${
              selectedCategory === null 
                ? "bg-primary-orange text-white hover:bg-primary-orange/90" 
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            }`}
          >
            All
          </Button>
          {categoriesLoading ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 rounded-full ${
                  selectedCategory === category.id 
                    ? "bg-primary-orange text-white hover:bg-primary-orange/90" 
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
              >
                {category.name}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
        {itemsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : availableItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No menu items available</p>
            <p className="text-sm text-gray-400">
              {selectedCategory ? "Try selecting a different category" : "Check back later for new items"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {availableItems.map((item) => (
              <div key={item.id} className="bg-white dark:bg-neutral-800 p-4">
                <div className="flex space-x-3">
                  <img
                    src={item.imageUrl || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-secondary-gray dark:text-white truncate pr-2">
                        {item.name}
                      </h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
                      {item.description || "Delicious menu item"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-orange">
                        ${item.price}
                      </span>
                      {item.status === "available" ? (
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(item)}
                          className="bg-primary-orange hover:bg-primary-orange/90 text-white rounded-full px-4"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled
                          variant="outline"
                          className="rounded-full px-4"
                        >
                          Unavailable
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
