import { Star, Plus, Settings } from "lucide-react";
import { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CustomizationModal } from "./customization-modal";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (customizations?: any, specialInstructions?: string, quantity?: number) => void;
  compact?: boolean;
}

export function MenuItemCard({ item, onAddToCart, compact = false }: MenuItemCardProps) {
  const { toast } = useToast();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  const handleQuickAdd = () => {
    onAddToCart();
    toast({
      title: "已加入購物車",
      description: `${item.name} 已加入購物車`,
    });
  };

  const handleCustomizeAdd = (customizations: any, specialInstructions: string, quantity: number) => {
    onAddToCart(customizations, specialInstructions, quantity);
    setShowCustomizationModal(false);
    toast({
      title: "已加入購物車",
      description: `${item.name} 已加入購物車`,
    });
  };

  const hasCustomizations = (() => {
    if (!item.customizationOptions) return false;
    try {
      const options = typeof item.customizationOptions === 'string'
        ? JSON.parse(item.customizationOptions)
        : item.customizationOptions;
      return Array.isArray(options) && options.length > 0;
    } catch {
      return false;
    }
  })();

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h3 className="font-medium text-restaurant-secondary">{item.name}</h3>
          <p className="text-sm text-gray-500">{item.description}</p>
          <p className="text-primary font-semibold">${item.price}</p>
        </div>
        <button
          onClick={handleQuickAdd}
          className="bg-primary text-white px-3 py-1 rounded-full text-sm hover:bg-primary/90 transition-colors"
        >
          加入
        </button>
      </div>
    );
  }

  return (
    <div className="bg-restaurant-surface rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-48 sm:h-40 object-cover"
        />
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-restaurant-secondary text-base leading-tight flex-1 pr-2">{item.name}</h3>
          <span className="text-primary font-bold text-lg whitespace-nowrap">${item.price}</span>
        </div>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">{item.description}</p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{item.rating}</span>
            <span className="text-sm text-gray-400">({item.reviewCount})</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-auto">
          <button
            onClick={handleQuickAdd}
            className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1 hover:bg-primary/90 transition-colors flex-1 justify-center"
            disabled={!item.isAvailable}
          >
            <Plus className="w-4 h-4" />
            <span>加入</span>
          </button>
          {hasCustomizations && (
            <button
              onClick={() => setShowCustomizationModal(true)}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-1 hover:bg-gray-200 transition-colors"
              disabled={!item.isAvailable}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">客製</span>
            </button>
          )}
        </div>
      </div>

      {hasCustomizations && (
        <CustomizationModal
          isOpen={showCustomizationModal}
          onClose={() => setShowCustomizationModal(false)}
          item={item}
          onAddToCart={handleCustomizeAdd}
        />
      )}
    </div>
  );
}
