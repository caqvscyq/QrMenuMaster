import { Star, Plus } from "lucide-react";
import { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: () => void;
  compact?: boolean;
}

export function MenuItemCard({ item, onAddToCart, compact = false }: MenuItemCardProps) {
  const { toast } = useToast();

  const handleAddToCart = () => {
    onAddToCart();
    toast({
      title: "已加入購物車",
      description: `${item.name} 已加入購物車`,
    });
  };

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
          onClick={handleAddToCart}
          className="bg-primary text-white px-3 py-1 rounded-full text-sm hover:bg-primary/90 transition-colors"
        >
          加入
        </button>
      </div>
    );
  }

  return (
    <div className="bg-restaurant-surface rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full md:w-24 h-32 md:h-24 object-cover flex-shrink-0"
        />
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-restaurant-secondary">{item.name}</h3>
            <span className="text-primary font-bold">${item.price}</span>
          </div>
          <p className="text-gray-500 text-sm mb-2">{item.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{item.rating}</span>
              <span className="text-sm text-gray-400">({item.reviewCount})</span>
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 hover:bg-primary/90 transition-colors"
              disabled={!item.isAvailable}
            >
              <Plus className="w-4 h-4" />
              <span>加入</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
