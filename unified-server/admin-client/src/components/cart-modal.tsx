import { X, Minus, Plus, Clock } from "lucide-react";
import { useCart } from "@/hooks/use-cart-db";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrderTracking?: () => void;
}

export function CartModal({ isOpen, onClose, onOpenOrderTracking }: CartModalProps) {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, createOrder, isLoading } = useCart();
  const { toast } = useToast();
  const [orderCreated, setOrderCreated] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const [tableNumber, setTableNumber] = useState<string>("--");

  // Extract table number from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    
    if (tableParam) {
      setTableNumber(tableParam);
    }
  }, []);

  // Debug log
  console.log("Cart Items in Modal:", cartItems);

  if (!isOpen) return null;

  const subtotal = getTotalPrice();
  const serviceFee = subtotal * 0.1; // 10% service fee
  const total = subtotal + serviceFee;

  const handleCreateOrder = async () => {
    try {
      const order = await createOrder(tableNumber); // Use dynamic table number
      setOrderCreated(order.id);
      
      // Force refresh cart data to ensure it's empty
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/cart"], 
        exact: false 
      });
      
      toast({
        title: "訂單已送出！",
        description: `訂單編號 #${order.id} - 感謝您的訂購，餐點將為您準備`,
      });
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

  const handleClose = () => {
    setOrderCreated(null);
    onClose();
  };

  const handleTrackOrder = () => {
    handleClose(); // Close cart modal first
    if (onOpenOrderTracking) {
      onOpenOrderTracking(); // Open order tracking modal
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-restaurant-secondary">購物車</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {orderCreated ? (
            // Order Success View
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-restaurant-secondary mb-2">
                訂單已確認！
              </h3>
              <p className="text-gray-600 mb-2">
                訂單編號: #{orderCreated}
              </p>
              <p className="text-gray-600 mb-6">
                預計製作時間: 15-20 分鐘
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleClose}
                  className="w-full bg-primary text-white py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  繼續點餐
                </button>
                <button
                  onClick={handleTrackOrder}
                  className="w-full border border-primary text-primary py-3 rounded-2xl font-semibold hover:bg-primary/5 transition-colors"
                >
                  追蹤訂單
                </button>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">購物車是空的</p>
              <button
                onClick={handleClose}
                className="text-primary font-medium"
              >
                去點餐
              </button>
            </div>
          ) : (
            // Cart Items View
            <>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-restaurant-secondary">
                        {item.menuItem.name}
                      </h3>
                      {/* Display customizations */}
                      {item.customizations && item.menuItem.customizationOptions && (
                        <div className="text-xs text-gray-600 mt-1">
                          {(() => {
                            const customizationOptions = item.menuItem.customizationOptions;
                            const selectedCustomizations = item.customizations;
                            const displayItems = [];

                            customizationOptions.forEach((option: any) => {
                              const selectedValue = selectedCustomizations[option.id];

                              if (option.type === 'checkbox' && selectedValue) {
                                displayItems.push(option.name);
                              } else if (option.type === 'radio' && selectedValue && option.options) {
                                const selectedOption = option.options.find((opt: any) => opt.id === selectedValue);
                                if (selectedOption) {
                                  displayItems.push(`${option.name}: ${selectedOption.name}`);
                                }
                              }
                            });

                            return displayItems.length > 0 ? displayItems.join(', ') : null;
                          })()}
                        </div>
                      )}
                      {/* Display special instructions */}
                      {item.specialInstructions && (
                        <div className="text-xs text-gray-600 mt-1">
                          備註: {item.specialInstructions}
                        </div>
                      )}
                      <p className="text-primary font-semibold">
                        ${(() => {
                          const basePrice = parseFloat(item.menuItem.price);
                          let customizationPrice = 0;

                          if (item.menuItem.customizationOptions && item.customizations) {
                            const customizationOptions = item.menuItem.customizationOptions;
                            const selectedCustomizations = item.customizations;

                            customizationOptions.forEach((option: any) => {
                              const selectedValue = selectedCustomizations[option.id];

                              if (option.type === 'checkbox' && selectedValue) {
                                customizationPrice += option.price || 0;
                              } else if (option.type === 'radio' && selectedValue && option.options) {
                                const selectedOption = option.options.find((opt: any) => opt.id === selectedValue);
                                if (selectedOption) {
                                  customizationPrice += selectedOption.price || 0;
                                }
                              }
                            });
                          }

                          return (basePrice + customizationPrice).toFixed(0);
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Minus className="text-gray-500 text-sm" />
                      </button>
                      <span className="font-medium text-restaurant-secondary w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        className="p-1 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="text-sm" />
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
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? "處理中..." : "確認訂單"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
