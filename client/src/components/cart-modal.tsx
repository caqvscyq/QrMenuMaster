import { X, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, createOrder, isLoading } = useCart();
  const { toast } = useToast();

  // Debug log
  console.log("Cart Items in Modal:", cartItems);

  if (!isOpen) return null;

  const subtotal = getTotalPrice();
  const serviceFee = subtotal * 0.1; // 10% service fee
  const total = subtotal + serviceFee;

  const handleCreateOrder = async () => {
    try {
      await createOrder("A12"); // Table number
      toast({
        title: "訂單已送出！",
        description: "感謝您的訂購，餐點將為您準備",
      });
      onClose();
    } catch (error) {
      toast({
        title: "訂單失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="absolute bottom-0 left-0 right-0 bg-restaurant-surface rounded-t-3xl max-w-md mx-auto animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-restaurant-secondary">購物車</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">購物車是空的</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.menuItem.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.menuItem.imageUrl}
                        alt={item.menuItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-restaurant-secondary">
                        {item.menuItem.name}
                      </h3>
                      <p className="text-primary font-semibold">${item.menuItem.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">小計</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">服務費 (10%)</span>
                  <span className="font-medium">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-primary">
                  <span>總計</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                確認訂單
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
