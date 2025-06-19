import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Users, Mail, Phone, Calendar, ShoppingCart } from "lucide-react";
import type { User, OrderWithItems } from "@shared/schema";

export default function AdminCustomers() {
  // Fetch all users (customers)
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  // Fetch all orders to calculate customer statistics
  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const customers = users.filter(user => user.role === "customer");

  const getCustomerStats = (customerId: number) => {
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const totalSpent = customerOrders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);
    return {
      orderCount: customerOrders.length,
      totalSpent,
      lastOrderDate: customerOrders.length > 0 
        ? new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt || Date.now()).getTime())))
        : null
    };
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleDateString();
  };

  if (usersLoading || ordersLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage customer accounts</p>
        </div>

        {/* Customer Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.filter(customer => {
                  const stats = getCustomerStats(customer.id);
                  return stats.orderCount > 0;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">With orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${orders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">From all customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No customers registered yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customers.map((customer) => {
                  const stats = getCustomerStats(customer.id);
                  return (
                    <div key={customer.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{customer.username}</h3>
                            <Badge variant="outline">Customer</Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {customer.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="h-4 w-4" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-4 w-4" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>Joined: {formatDate(new Date(customer.createdAt || Date.now()))}</span>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{stats.orderCount}</span> orders
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            ${stats.totalSpent.toFixed(2)} spent
                          </div>
                          <div className="text-xs text-gray-500">
                            Last order: {formatDate(stats.lastOrderDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}