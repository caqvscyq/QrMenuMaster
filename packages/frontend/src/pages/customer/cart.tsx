import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCart } from "@/hooks/use-cart-db";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Minus, Plus, Trash2, ShoppingCart, Edit3, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

const orderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function CustomerCart() {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showCheckout, setShowCheckout] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: user?.username || "",
      customerPhone: user?.phone || "",
      notes: "",
    },
  });

  const { createOrder, isCreatingOrder } = useCart();

  const handleSubmitOrder = async (data: OrderFormData) => {
    try {
      // Get table number from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const tableNumber = urlParams.get('table') || 'A1';

      const order = await createOrder(tableNumber);

      toast({
        title: "Order placed successfully!",
        description: `Your order #${order.id} has been placed and is being prepared.`,
      });
      setLocation("/orders");
    } catch (error) {
      toast({
        title: "Failed to place order",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  if (cartItems.length === 0) {
    return (
      <CustomerLayout title="Cart" showSearch={false}>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Browse our delicious menu and add some items to get started!
          </p>
          <Link href="/menu">
            <Button className="bg-primary-orange hover:bg-primary-orange/90 text-white">
              Browse Menu
            </Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="Cart" showSearch={false}>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <Link href="/menu">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Konfirmasi pesanan</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Cart Items */}
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.menuItem.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start space-x-3">
                  <img
                    src={item.menuItem.imageUrl || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"}
                    alt={item.menuItem.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-base mb-1">
                      {item.menuItem.name}
                    </h4>
                    {/* Display customizations */}
                    {item.customizations && item.menuItem.customizationOptions && (
                      <div className="text-sm text-gray-600 mb-2">
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
                    <p className="text-base font-bold text-gray-900">
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
                </div>
              </div>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ringkasan pembayaran</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Harga pesanan</span>
                <span className="font-medium text-gray-900">${totalPrice.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">PPN 11%</span>
                <span className="font-medium text-gray-900">${(totalPrice * 0.11).toFixed(0)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total pembayaran</span>
                <span className="text-base font-bold text-gray-900">${(totalPrice * 1.11).toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Section */}
          {!showCheckout ? (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total pembayaran</p>
                  <p className="text-xl font-bold text-gray-900">${(totalPrice * 1.11).toFixed(0)}</p>
                </div>
                <Button
                  onClick={() => setShowCheckout(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Pilih metode pembayaran
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitOrder)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special requests or dietary requirements..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isCreatingOrder}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      size="lg"
                    >
                      {isCreatingOrder ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Placing Order...
                        </>
                      ) : (
                        `Place Order - $${(totalPrice * 1.11).toFixed(0)}`
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCheckout(false)}
                      className="w-full"
                    >
                      Back to Cart
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
