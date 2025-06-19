import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Clock,
  Calendar,
  BarChart3
} from "lucide-react";
import type { OrderWithItems } from "@shared/schema";

export default function AdminAnalytics() {
  // Fetch all orders for analytics
  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const calculateAnalytics = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const todayOrders = orders.filter(order => 
      new Date(order.createdAt || 0) >= today
    );
    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt || 0);
      return orderDate >= yesterday && orderDate < today;
    });
    const weekOrders = orders.filter(order => 
      new Date(order.createdAt || 0) >= thisWeek
    );
    const monthOrders = orders.filter(order => 
      new Date(order.createdAt || 0) >= thisMonth
    );

    const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);
    const weekRevenue = weekOrders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);
    const monthRevenue = monthOrders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);

    // Calculate growth rates
    const revenueGrowth = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100)
      : todayRevenue > 0 ? 100 : 0;

    const orderGrowth = yesterdayOrders.length > 0
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100)
      : todayOrders.length > 0 ? 100 : 0;

    // Popular items analysis
    const itemCounts = new Map<string, { count: number; revenue: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const current = itemCounts.get(item.itemName) || { count: 0, revenue: 0 };
        itemCounts.set(item.itemName, {
          count: current.count + item.quantity,
          revenue: current.revenue + (parseFloat(item.price) * item.quantity)
        });
      });
    });

    const popularItems = Array.from(itemCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    // Order status distribution
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      todayOrders: todayOrders.length,
      yesterdayOrders: yesterdayOrders.length,
      weekOrders: weekOrders.length,
      monthOrders: monthOrders.length,
      todayRevenue,
      yesterdayRevenue,
      weekRevenue,
      monthRevenue,
      revenueGrowth,
      orderGrowth,
      popularItems,
      statusCounts,
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0) / orders.length
        : 0
    };
  };

  if (ordersLoading || statsLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  const analytics = calculateAnalytics();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your restaurant's performance and trends</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.todayRevenue.toFixed(2)}</div>
              <div className="flex items-center text-xs">
                {analytics.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={analytics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(analytics.revenueGrowth).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.todayOrders}</div>
              <div className="flex items-center text-xs">
                {analytics.orderGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={analytics.orderGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(analytics.orderGrowth).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.averageOrderValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per order</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>
        </div>

        {/* Time Period Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Orders:</span>
                  <span className="font-medium">{analytics.weekOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span className="font-medium">${analytics.weekRevenue.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Orders:</span>
                  <span className="font-medium">{analytics.monthOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span className="font-medium">${analytics.monthRevenue.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize">{status}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Menu Items</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.popularItems.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No order data available yet</p>
            ) : (
              <div className="space-y-4">
                {analytics.popularItems.map(([itemName, data], index) => (
                  <div key={itemName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-600 dark:text-orange-300">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{itemName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {data.count} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${data.revenue.toFixed(2)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}