import { X, Minus, Plus, Clock, Edit3 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
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
        title: "Order Submitted!",
        description: `Order #${order.id} - Thank you for your order, your food is being prepared`,
      });
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Please try again later",
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
          <h2 className="text-xl font-bold text-restaurant-secondary">Shopping Cart</h2>
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
                Order Confirmed!
              </h3>
              <p className="text-gray-600 mb-2">
                Order Number: #{orderCreated}
              </p>
              <p className="text-gray-600 mb-6">
                Estimated preparation time: 15-20 minutes
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleClose}
                  className="w-full bg-primary text-white py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Continue Ordering
                </button>
                <button
                  onClick={handleTrackOrder}
                  className="w-full border border-primary text-primary py-3 rounded-2xl font-semibold hover:bg-primary/5 transition-colors"
                >
                  Track Order
                </button>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={handleClose}
                className="text-primary font-medium"
              >
                Start ordering
              </button>
            </div>
          ) : (
            // Cart Items View
            <>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <img
                        src={item.menuItem.imageUrl || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"}
                        alt={item.menuItem.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                          {item.menuItem.name}
                        </h3>

                        {/* Display customizations */}
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="text-sm text-gray-600 mb-2">
                            {(() => {
                              const selectedCustomizations = item.customizations;
                              const customizationOptions = item.menuItem.customizationOptions || [];
                              const displayItems = [];

                              // Process each selected customization
                              Object.entries(selectedCustomizations).forEach(([optionId, selectedValue]) => {
                                if (!selectedValue) return;

                                // Find the customization option definition
                                const option = customizationOptions.find((opt: any) => opt.id === optionId);

                                if (option) {
                                  if (option.type === 'checkbox' && selectedValue === true) {
                                    displayItems.push(option.name);
                                  } else if (option.type === 'radio' && option.options) {
                                    const selectedOption = option.options.find((opt: any) => opt.id === selectedValue);
                                    if (selectedOption) {
                                      displayItems.push(`${option.name}: ${selectedOption.name}`);
                                    }
                                  }
                                } else {
                                  // Fallback for customizations without option definitions
                                  if (typeof selectedValue === 'boolean' && selectedValue) {
                                    // Convert kebab-case to readable format
                                    const readableName = optionId.split('-').map(word =>
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ');
                                    displayItems.push(readableName);
                                  } else if (typeof selectedValue === 'string') {
                                    // Convert kebab-case to readable format for both key and value
                                    const readableKey = optionId.split('-').map(word =>
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ');
                                    const readableValue = selectedValue.split('-').map(word =>
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ');
                                    displayItems.push(`${readableKey}: ${readableValue}`);
                                  }
                                }
                              });

                              return displayItems.length > 0 ? displayItems.join(', ') : null;
                            })()}
                          </div>
                        )}

                        {/* Display special instructions */}
                        {item.specialInstructions && (
                          <div className="text-sm text-gray-600 mb-2">
                            備註: {item.specialInstructions}
                          </div>
                        )}

                        {/* Edit button */}
                        <button className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                      </div>

                      <div className="flex flex-col items-end space-y-3">
                        {/* Quantity controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4 text-red-600" />
                          </button>
                          <span className="font-semibold text-gray-900 w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4 text-red-600" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          {(() => {
                            const basePrice = parseFloat(item.menuItem.price);
                            const customizationPrice = parseFloat(item.customizationCost || '0');
                            const totalPrice = basePrice + customizationPrice;

                            if (customizationPrice > 0) {
                              return (
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Item: ${basePrice.toFixed(0)} + Custom: ${customizationPrice.toFixed(0)}
                                  </p>
                                  <p className="text-base font-bold text-gray-900">
                                    ${totalPrice.toFixed(0)}
                                  </p>
                                </div>
                              );
                            } else {
                              return (
                                <p className="text-base font-bold text-gray-900">
                                  ${basePrice.toFixed(0)}
                                </p>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Summary */}
              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal (incl. customizations)</span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Service Fee (11%)</span>
                    <span className="font-medium text-gray-900">${serviceFee.toFixed(0)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total Payment</span>
                    <span className="text-base font-bold text-gray-900">${total.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with total and payment button */}
        {!orderCreated && cartItems.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
            <div>
              <p className="text-sm text-gray-600">Total Payment</p>
              <p className="text-xl font-bold text-gray-900">${total.toFixed(0)}</p>
            </div>
            <button
              onClick={handleCreateOrder}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Order Confirm"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
