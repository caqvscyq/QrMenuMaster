import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, CheckCircle, AlertCircle, XCircle, Receipt, Phone, User } from "lucide-react";
import type { OrderWithItems } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders", statusFilter !== "all" ? statusFilter : undefined],
    queryFn: async () => {
      const url = statusFilter !== "all" ? `/api/admin/orders?status=${statusFilter}` : "/api/admin/orders";
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 0, // Consider data always stale to force refetch
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Success", description: "Order status updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: "status-pending", icon: Clock, label: "Pending" },
      preparing: { class: "status-preparing", icon: AlertCircle, label: "Preparing" },
      ready: { class: "status-ready", icon: CheckCircle, label: "Ready" },
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

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      pending: "preparing",
      preparing: "ready",
      ready: "completed",
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getStatusActions = (order: OrderWithItems) => {
    const nextStatus = getNextStatus(order.status);
    
    return (
      <div className="flex gap-2">
        {nextStatus && (
          <Button
            size="sm"
            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: nextStatus })}
            disabled={updateStatusMutation.isPending}
            className="bg-primary-orange hover:bg-primary-orange/90"
          >
            {updateStatusMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              `Mark ${nextStatus}`
            )}
          </Button>
        )}
        {order.status !== "cancelled" && order.status !== "completed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "cancelled" })}
            disabled={updateStatusMutation.isPending}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Cancel
          </Button>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter orders based on status
  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  // Sort orders by creation date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Count orders by status
  const ordersByStatus = {
    pending: orders.filter(order => order.status === "pending"),
    preparing: orders.filter(order => order.status === "preparing"),
    ready: orders.filter(order => order.status === "ready"),
    completed: orders.filter(order => order.status === "completed"),
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-secondary-gray dark:text-white">Orders Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage customer orders</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{ordersByStatus.pending.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Preparing</p>
                  <p className="text-2xl font-bold text-yellow-600">{ordersByStatus.preparing.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ready</p>
                  <p className="text-2xl font-bold text-green-600">{ordersByStatus.ready.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-600">{ordersByStatus.completed.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-secondary-gray dark:text-white">
              {statusFilter === "all" ? "All Orders" : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`} 
              ({sortedOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : sortedOrders.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">No orders found</p>
                <p className="text-sm text-gray-400">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {sortedOrders.map((order) => (
                    <Card key={order.id} className="border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          {/* Order Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-primary-orange rounded-lg flex items-center justify-center">
                                <Receipt className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-secondary-gray dark:text-white">
                                  Order #{order.id}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(order.createdAt!)}
                                </p>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>

                            {/* Customer Info */}
                            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{order.customerName || order.customer?.username || 'Guest'}</span>
                              </div>
                              {order.customerPhone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  <span>{order.customerPhone}</span>
                                </div>
                              )}
                              {order.tableNumber && (
                                <div className="flex items-center gap-1">
                                  <span>Table: {order.tableNumber}</span>
                                </div>
                              )}
                            </div>

                            {/* Order Items */}
                            <div className="space-y-2 mb-4">
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
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  <strong>Notes:</strong> {order.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="lg:text-right">
                            <p className="text-2xl font-bold text-secondary-gray dark:text-white mb-4">
                              ${order.total}
                            </p>
                            {getStatusActions(order)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
