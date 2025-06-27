import { useState, useEffect } from "react";
import { Utensils, ShoppingCart, Clock } from "lucide-react";
import { VoiceSearch } from "@/components/voice-search";
import { CategoryFilter } from "@/components/category-filter";
import { MenuItemCard } from "@/components/menu-item-card";
import { CartModal } from "@/components/cart-modal";
import { OrderTrackingModal } from "@/components/order-tracking-modal";
import { RecommendationModal } from "@/components/recommendation-modal";
import { useCart } from "@/hooks/use-cart";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";

export default function CustomerMenu() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { items: cartItems, addItem, getTotalPrice, getTotalItems } = useCart();

  // Get table number from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tableNumber = urlParams.get('table') || '1';

  // Fetch menu items
  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/customer/menu"],
    queryFn: async () => {
      const response = await fetch("/api/customer/menu");
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      return response.json();
    },
  });

  // Filter items based on search and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" ||
      item.categoryId?.toString() === selectedCategory;

    return matchesSearch && matchesCategory && item.isAvailable;
  });

  // Get popular items (items with high ratings)
  const popularItems = menuItems.filter(item =>
    item.isAvailable && (item.rating || 0) >= 4.5
  ).slice(0, 6);

  // Get items by category
  const noodleItems = menuItems.filter(item =>
    item.categoryId === 1 && item.isAvailable
  );
  const riceItems = menuItems.filter(item =>
    item.categoryId === 2 && item.isAvailable
  );

  const displayItems = showSearchResults ? filteredItems :
    selectedCategory === "1" ? noodleItems :
    selectedCategory === "2" ? riceItems :
    filteredItems;

  const handleAddToCart = (item: MenuItem, customizations?: any, specialInstructions?: string, quantity: number = 1) => {
    addItem({
      ...item,
      customizations,
      specialInstructions,
      quantity
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(!!query);
    if (query) {
      setSelectedCategory("all");
    }
  };

  const handleVoiceSearch = (transcript: string) => {
    handleSearch(transcript);
  };

  return (
    <div className="min-h-screen bg-restaurant-background">
      {/* Header */}
      <header className="bg-restaurant-surface shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Utensils className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-restaurant-secondary">美味軒餐廳</h1>
                <p className="text-sm text-gray-500">桌號: {tableNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Order Tracking Button */}
              <button
                onClick={() => setIsOrderTrackingOpen(true)}
                className="p-2 text-gray-600 hover:text-primary transition-colors"
              >
                <Clock className="w-6 h-6" />
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-primary transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="bg-restaurant-surface border-b border-gray-200 sticky top-[73px] z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <VoiceSearch
                onSearch={handleSearch}
                onVoiceResult={handleVoiceSearch}
                placeholder="搜尋菜單項目..."
                value={searchQuery}
              />
            </div>
            <div className="flex-shrink-0">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                showSearchResults={showSearchResults}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pb-24">
        <div className="space-y-4 sm:space-y-6">
          {/* Popular Items Section */}
          {(selectedCategory === "all" || showSearchResults) && (
            <section>
              <h2 className="text-xl font-bold text-restaurant-secondary mb-4 flex items-center">
                <span className="text-primary mr-2">🔥</span>
                人氣推薦
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {popularItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={(customizations, specialInstructions, quantity) => handleAddToCart(item, customizations, specialInstructions, quantity)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Noodles Section */}
          {(selectedCategory === "all" || selectedCategory === "1") && (
            <section>
              <h2 className="text-xl font-bold text-restaurant-secondary mb-4 flex items-center">
                <span className="text-primary mr-2">🍜</span>
                麵食類
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {(selectedCategory === "1" ? displayItems : noodleItems).map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={(customizations, specialInstructions, quantity) => handleAddToCart(item, customizations, specialInstructions, quantity)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Rice Section */}
          {(selectedCategory === "all" || selectedCategory === "2") && (
            <section>
              <h2 className="text-xl font-bold text-restaurant-secondary mb-4 flex items-center">
                <span className="text-primary mr-2">🍚</span>
                飯類
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {(selectedCategory === "2" ? displayItems : riceItems).map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={(customizations, specialInstructions, quantity) => handleAddToCart(item, customizations, specialInstructions, quantity)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modals */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenOrderTracking={() => {
          setIsCartOpen(false);
          setIsOrderTrackingOpen(true);
        }}
      />

      <OrderTrackingModal
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
      />

      <RecommendationModal
        isOpen={isRecommendationOpen}
        onClose={() => setIsRecommendationOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
