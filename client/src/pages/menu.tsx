import { useState } from "react";
import { Utensils, ShoppingCart } from "lucide-react";
import { VoiceSearch } from "@/components/voice-search";
import { CategoryFilter } from "@/components/category-filter";
import { MenuItemCard } from "@/components/menu-item-card";
import { CartModal } from "@/components/cart-modal";
import { RecommendationModal } from "@/components/recommendation-modal";
import { useCart } from "@/hooks/use-cart";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { cartItems, addToCart, getTotalItems } = useCart();

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const { data: categoryItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu/category", selectedCategory],
    enabled: selectedCategory !== "all",
  });

  const displayItems = selectedCategory === "all" ? menuItems : categoryItems;
  const popularItems = menuItems.filter(item => item.isPopular);
  const noodleItems = menuItems.filter(item => item.category === "noodles");
  const drinkItems = menuItems.filter(item => item.category === "drinks");

  const handleVoiceSearchResult = (query: string, results: MenuItem[]) => {
    setSearchQuery(query);
    setSearchResults(results);
    setShowSearchResults(true);
    
    if (results.length > 0) {
      // Show recommendation modal with similar items based on first result
      setIsRecommendationOpen(true);
    }
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    addToCart(menuItem);
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
                <p className="text-sm text-gray-500">桌號: A12</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="text-lg" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
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
                    onAddToCart={() => handleAddToCart(item)}
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
      <main className="max-w-4xl mx-auto px-4 pb-24">
        <div className="space-y-6">
          {/* Popular Items Section */}
          {(selectedCategory === "all" || showSearchResults) && (
            <section>
              <h2 className="text-xl font-bold text-restaurant-secondary mb-4 flex items-center">
                <span className="text-primary mr-2">🔥</span>
                人氣推薦
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => handleAddToCart(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Noodles Section */}
          {(selectedCategory === "all" || selectedCategory === "noodles") && (
            <section>
              <h2 className="text-xl font-bold text-restaurant-secondary mb-4 flex items-center">
                <span className="text-primary mr-2">🍜</span>
                麵食類
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(selectedCategory === "noodles" ? displayItems : noodleItems).map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => handleAddToCart(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Drinks Section */}
          {(selectedCategory === "all" || selectedCategory === "drinks") && (
            <section>
              <h2 className="text-xl font-bold text-restaurant-secondary mb-4 flex items-center">
                <span className="text-primary mr-2">🥤</span>
                飲料
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(selectedCategory === "drinks" ? displayItems : drinkItems).map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => handleAddToCart(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Other Categories */}
          {selectedCategory !== "all" && selectedCategory !== "noodles" && selectedCategory !== "drinks" && (
            <section>
              <h2 className="text-xl font-bold text-restaurant-secondary mb-4">
                {selectedCategory === "rice" && "飯類"}
                {selectedCategory === "appetizers" && "開胃菜"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => handleAddToCart(item)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modals */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <RecommendationModal
        isOpen={isRecommendationOpen}
        onClose={() => setIsRecommendationOpen(false)}
        searchQuery={searchQuery}
        originalItem={searchResults[0]}
      />
    </div>
  );
}
