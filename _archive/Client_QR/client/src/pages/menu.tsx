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

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [tableNumber, setTableNumber] = useState<string>("--");
  const [deskId, setDeskId] = useState<string | null>(null);
  
  // Extract table number and desk ID from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    const deskParam = params.get('desk');
    
    if (tableParam) {
      setTableNumber(tableParam);
    }
    
    if (deskParam) {
      setDeskId(deskParam);
    }
    
    console.log(`Table: ${tableParam}, Desk ID: ${deskParam}`);
  }, []);
  
  const { cartItems, addToCart, getTotalItems } = useCart();

  // Force re-render when cart items change
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const newCount = getTotalItems();
    console.log("🔄 Cart count changed from", cartCount, "to", newCount, "cartItems:", cartItems);
    setCartCount(newCount);
  }, [cartItems, getTotalItems]);

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const { data: categoryItems = [] } = useQuery<MenuItem[]>({
    queryKey: [`/api/menu/category/${selectedCategory}`],
    enabled: selectedCategory !== "all",
  });

  const displayItems = selectedCategory === "all" ? menuItems : categoryItems;
  const popularItems = menuItems.filter(item => item.isPopular);
  const noodleItems = menuItems.filter(item => item.categoryId === 1);
  const riceItems = menuItems.filter(item => item.categoryId === 2);
  const appetizerItems = menuItems.filter(item => item.categoryId === 3);
  const drinkItems = menuItems.filter(item => item.categoryId === 4);

  const handleVoiceSearchResult = (query: string, results: MenuItem[]) => {
    setSearchQuery(query);
    setSearchResults(results);
    setShowSearchResults(true);
    
    if (results.length > 0) {
      // Show recommendation modal with similar items based on first result
      setIsRecommendationOpen(true);
    }
  };

  const handleAddToCart = (menuItem: MenuItem, customizations?: any, specialInstructions?: string, quantity?: number) => {
    addToCart(menuItem, customizations, specialInstructions, quantity);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-restaurant-background">
        <div className="text-restaurant-secondary">載入中...</div>
      </div>
    );
  }

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
                className="relative bg-gray-100 text-gray-700 p-3 rounded-full shadow-lg hover:bg-gray-200 transition-colors"
              >
                <Clock className="text-lg" />
              </button>
              
              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              >
                <ShoppingCart className="text-lg" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Voice Search */}
      <VoiceSearch onSearchResult={handleVoiceSearchResult} />

      {/* Search Results */}
      {showSearchResults && (
        <section className="max-w-4xl mx-auto px-4 mb-4">
          <div className="bg-restaurant-surface rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-restaurant-secondary mb-3">
              搜尋結果: "{searchQuery}"
            </h3>
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.slice(0, 3).map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={(customizations, specialInstructions, quantity) => handleAddToCart(item, customizations, specialInstructions, quantity)}
                    compact
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">沒有找到相關餐點</p>
            )}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

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

          {/* Appetizers Section */}
          {(selectedCategory === "all" || selectedCategory === "3") && (
            <section>
              <h2 className="text-xl font-bold text-restaurant-secondary mb-4 flex items-center">
                <span className="text-primary mr-2">🥟</span>
                開胃菜
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {(selectedCategory === "3" ? displayItems : appetizerItems).map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={(customizations, specialInstructions, quantity) => handleAddToCart(item, customizations, specialInstructions, quantity)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Drinks Section */}
          {(selectedCategory === "all" || selectedCategory === "4") && (
            <section>
              <h2 className="text-xl font-bold text-restaurant-secondary mb-4 flex items-center">
                <span className="text-primary mr-2">🥤</span>
                飲料
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {(selectedCategory === "4" ? displayItems : drinkItems).map((item) => (
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
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onOpenOrderTracking={() => setIsOrderTrackingOpen(true)} />
      <OrderTrackingModal isOpen={isOrderTrackingOpen} onClose={() => setIsOrderTrackingOpen(false)} />
      <RecommendationModal
        isOpen={isRecommendationOpen}
        onClose={() => setIsRecommendationOpen(false)}
        searchQuery={searchQuery}
        originalItem={searchResults[0]}
      />
    </div>
  );
}
