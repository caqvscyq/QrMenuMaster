import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem } from "@shared/schema";
import { MenuItemCard } from "./menu-item-card";
import { useCart } from "@/hooks/use-cart";

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  originalItem?: MenuItem;
}

export function RecommendationModal({ isOpen, onClose, searchQuery, originalItem }: RecommendationModalProps) {
  const { addToCart } = useCart();

  const { data: similarItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", originalItem?.id, "similar"],
    enabled: isOpen && !!originalItem,
  });

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddToCart = (menuItem: MenuItem) => {
    addToCart(menuItem);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="absolute bottom-0 left-0 right-0 bg-restaurant-surface rounded-t-3xl max-w-md mx-auto animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-restaurant-secondary">相似推薦</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {searchQuery && (
            <p className="text-gray-600 mb-4">
              基於搜尋 "{searchQuery}" 的推薦
            </p>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">載入推薦中...</p>
            </div>
          ) : similarItems.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {similarItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={() => handleAddToCart(item)}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">沒有找到相似的餐點</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
