import { Star, Plus, Heart } from "lucide-react";
import { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { CustomizationModal } from "./customization-modal";
import { useState } from "react";

interface EnhancedMenuItemCardProps {
  item: MenuItem;
  onAddToCart: (customizations?: any, quantity?: number, specialInstructions?: string) => void;
  compact?: boolean;
}

export function EnhancedMenuItemCard({ item, onAddToCart, compact = false }: EnhancedMenuItemCardProps) {
  const { toast } = useToast();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleQuickAdd = () => {
    onAddToCart();
    toast({
      title: "Added to Cart",
      description: `${item.name} added to cart`,
    });
  };

  const handleCustomizeAdd = (customizations: any, quantity: number, specialInstructions: string) => {
    onAddToCart(customizations, quantity, specialInstructions);
    toast({
      title: "Added to Cart",
      description: `${item.name} with customizations added to cart`,
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
          <h3 className="font-medium text-gray-800">{item.name}</h3>
          <p className="text-sm text-gray-500">{item.description}</p>
          <p className="text-orange-600 font-semibold">₹{item.price}</p>
        </div>
        <button
          onClick={() => setIsCustomizationOpen(true)}
          className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm hover:bg-orange-600 transition-colors"
        >
          Add +
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 relative">
        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>

        <div className="flex flex-col">
          <div className="relative">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800 text-lg">{item.name}</h3>
              <span className="text-orange-600 font-bold text-lg">₹{item.price}</span>
            </div>

            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 font-medium">{item.rating}</span>
                <span className="text-sm text-gray-400">({item.reviewCount})</span>
              </div>

              <div className="flex space-x-2">
                {/* Quick Add Button */}
                <button
                  onClick={handleQuickAdd}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                  disabled={!item.isAvailable}
                >
                  Quick Add
                </button>

                {/* Customize Button */}
                <button
                  onClick={() => setIsCustomizationOpen(true)}
                  className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1 hover:bg-orange-600 transition-colors"
                  disabled={!item.isAvailable}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add +</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        item={item}
        onAddToCart={handleCustomizeAdd}
      />
    </>
  );
}
