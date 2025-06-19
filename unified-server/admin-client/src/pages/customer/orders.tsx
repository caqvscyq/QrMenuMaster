import { useQuery } from "@tanstack/react-query";
import CustomerLayout from "@/components/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { Receipt, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import type { OrderWithItems } from "@shared/schema";

export default function CustomerOrders() {
  const { user } = useAuth();

  // Fetch user's orders
  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: "status-pending", icon: Clock, label: "Pending" },
      preparing: { class: "status-preparing", icon: AlertCircle, label: "Preparing" },
      ready: { class: "status-ready", icon: CheckCircle, label: "Ready for Pickup" },
      completed: { class: "status-completed", icon: CheckCircle, label: "Completed" },
      cancelled: { class: "status-cancelled", icon: XCircle, label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.class}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusMessage = (status: string) => {
    const messages = {
      pending: "Your order has been received and will be prepared soon.",
      preparing: "Your order is being prepared by our kitchen staff.",
      ready: "Your order is ready for pickup!",
      completed: "Your order has been completed. Thank you!",
      cancelled: "This order was cancelled.",
    };
    
    return messages[status as keyof typeof messages] || "Order status unknown";
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <CustomerLayout title="My Orders" showSearch={false}>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <Receipt className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Please log in</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            You need to be logged in to view your orders.
          </p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="My Orders" showSearch={false}>
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Receipt className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No orders yet</h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
              You haven't placed any orders yet. Browse our menu to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-orange rounded-lg flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-secondary-gray dark:text-white">
                          Order #{order.id}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(order.createdAt!)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Message */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {getStatusMessage(order.status)}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-secondary-gray dark:text-white">Items Ordered:</h4>
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.quantity}x {item.itemName}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm mb-1">Special Instructions:</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400">{order.notes}</p>
                    </div>
                  )}

                  {/* Order Total */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-secondary-gray dark:text-white">Total</span>
                    <span className="text-xl font-bold text-primary-orange">${order.total}</span>
                  </div>

                  {/* Contact Info */}
                  {order.customerPhone && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Contact:</strong> {order.customerPhone}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
