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
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "wouter";

const orderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function CustomerCart() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, getTotalItems } = useCart();
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

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      const orderItems = items.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
      }));

      const order = {
        customerId: user?.id || null,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        notes: orderData.notes,
        items: orderItems,
      };

      const response = await apiRequest("POST", "/api/orders", order);
      return response.json();
    },
    onSuccess: (order) => {
      clearCart();
      toast({
        title: "Order placed successfully!",
        description: `Your order #${order.id} has been placed and is being prepared.`,
      });
      setLocation("/orders");
    },
    onError: (error) => {
      toast({
        title: "Failed to place order",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmitOrder = (data: OrderFormData) => {
    placeOrderMutation.mutate(data);
  };

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  if (items.length === 0) {
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
      <div className="p-4 space-y-4">
        {/* Cart Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-secondary-gray dark:text-white">
              Your Order ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.menuItem.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <img
                  src={item.menuItem.imageUrl || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"}
                  alt={item.menuItem.name}
                  className="w-15 h-15 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-secondary-gray dark:text-white truncate">
                    {item.menuItem.name}
                  </h4>
                  <p className="text-primary-orange font-semibold">
                    ${item.menuItem.price}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium text-secondary-gray dark:text-white">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.menuItem.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-lg font-semibold text-secondary-gray dark:text-white">
              <span>Total</span>
              <span className="text-primary-orange">${totalPrice.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Section */}
        {!showCheckout ? (
          <Button 
            onClick={() => setShowCheckout(true)}
            className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white"
            size="lg"
          >
            Proceed to Checkout
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-secondary-gray dark:text-white">
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                      disabled={placeOrderMutation.isPending}
                      className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white"
                      size="lg"
                    >
                      {placeOrderMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Placing Order...
                        </>
                      ) : (
                        `Place Order - $${totalPrice.toFixed(2)}`
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
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}
