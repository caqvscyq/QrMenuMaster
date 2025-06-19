import { X, Clock, CheckCircle, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Order, OrderItem, MenuItem } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/use-cart";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define the order interface with items
interface OrderWithItems extends Order {
  items: OrderItem[];
}

export function OrderTrackingModal({ isOpen, onClose }: OrderTrackingModalProps) {
  const { isLoading: isSessionLoading } = useCart();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [deskId, setDeskId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Initialize table/desk info from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    const deskParam = params.get('desk');

    if (tableParam) {
      setTableNumber(tableParam);
    }

    if (deskParam) {
      setDeskId(deskParam);
    }

    console.log(`Order tracking for Table: ${tableParam}, Desk ID: ${deskParam}`);
  }, []);

  useEffect(() => {
    if (isOpen && !isSessionLoading) {
      const currentSessionId = (window as any).__currentSessionId;
      if (currentSessionId && currentSessionId !== sessionId) {
        setSessionId(currentSessionId);
      }
    }
    if (!isOpen) {
      setSessionId(null);
    }
  }, [isOpen, isSessionLoading, sessionId]);

  // Additional effect to continuously sync with global session changes
  useEffect(() => {
    if (isOpen && !isSessionLoading) {
      const checkSessionChanges = () => {
        const currentGlobalSessionId = (window as any).__currentSessionId;
        if (currentGlobalSessionId && currentGlobalSessionId !== sessionId) {
          console.log("Session ID changed, updating local state:", currentGlobalSessionId);
          setSessionId(currentGlobalSessionId);
        }
      };

      // Check immediately and then periodically
      checkSessionChanges();
      const interval = setInterval(checkSessionChanges, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, isSessionLoading, sessionId]);

  const { data: allOrders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", sessionId],
    queryFn: async () => {
      console.log("Fetching orders for session:", sessionId);
      const response = await apiRequest("GET", "/api/customer/orders");
      if (!response.ok) {
        if (response.status === 404) {
          return []; 
        }
        if (response.status === 401) {
          return [];
        }
        throw new Error(`Error fetching orders: ${response.statusText} (status: ${response.status})`);
      }
      return response.json();
    },
    enabled: !!sessionId && isOpen,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("404") || error?.message?.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
  });
  
  // Filter orders by current table number
  const orders = allOrders.filter(order => {
    // If we have a table number, only show orders for this table
    if (tableNumber && order.tableNumber) {
      return order.tableNumber === tableNumber;
    }
    // If we have a desk ID, only show orders for this desk
    if (deskId && order.deskId) {
      return order.deskId.toString() === deskId;
    }
    // If no table or desk ID, fall back to showing all orders for this session
    return true;
  });

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="text-yellow-600" />;
      case "preparing":
        return <Package className="text-blue-600" />;
      case "ready":
        return <CheckCircle className="text-green-600" />;
      case "completed":
        return <CheckCircle className="text-gray-600" />;
      default:
        return <Clock className="text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "等待處理";
      case "preparing":
        return "準備中";
      case "ready":
        return "已完成";
      case "completed":
        return "已送達";
      default:
        return "處理中";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "preparing":
        return "text-blue-600 bg-blue-50";
      case "ready":
        return "text-green-600 bg-green-50";
      case "completed":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-yellow-600 bg-yellow-50";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-restaurant-secondary">
            {tableNumber ? `桌號 ${tableNumber} 訂單` : "我的訂單"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="text-gray-500" />
          </button>
        </div>

        <div 
          ref={scrollContainerRef}
          className="p-6 overflow-y-auto flex-1 scroll-smooth"
        >
          {(isLoading || isSessionLoading) ? (
            <div className="text-center py-8">
              <Clock className="text-gray-400 text-4xl mx-auto animate-pulse mb-4" />
              <p className="text-gray-500">
                {isSessionLoading ? "等待會話準備中..." : "載入訂單資料中..."}
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {tableNumber ? `桌號 ${tableNumber} 目前沒有訂單` : "目前沒有訂單"}
              </p>
              <button
                onClick={onClose}
                className="text-primary font-medium mt-4"
              >
                去點餐
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order: OrderWithItems) => (
                <div key={order.id} className="border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-restaurant-secondary">
                        訂單 #{order.id}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    {getStatusIcon(order.status)}
                  </div>

                  <div className="space-y-2 mb-3">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item: OrderItem, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {item.itemName} x {item.quantity}
                          </span>
                          <span className="font-medium">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm">無訂單項目</div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-600">小計</span>
                      <span>${order.subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-600">服務費</span>
                      <span>${order.serviceFee}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-primary">
                      <span>總計</span>
                      <span>${order.total}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-3">
                    下單時間: {order.createdAt ? new Date(order.createdAt).toLocaleString('zh-TW') : ''}
                  </div>

                  {order.status === "preparing" && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 text-sm font-medium mb-1">
                        預計完成時間: 15-20 分鐘
                      </p>
                      <p className="text-blue-600 text-xs">
                        您的餐點正在用心製作中，請稍候
                      </p>
                    </div>
                  )}

                  {order.status === "ready" && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-green-800 text-sm font-medium mb-1">
                        餐點已完成！
                      </p>
                      <p className="text-green-600 text-xs">
                        請到櫃檯領取您的餐點
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {orders.length > 1 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-center space-x-2">
              <button 
                onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                回到最新訂單
              </button>
              <button
                onClick={() => {
                  const container = scrollContainerRef.current;
                  if (container) {
                    container.scrollTo({ 
                      top: container.scrollHeight, 
                      behavior: 'smooth' 
                    });
                  }
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                查看較早訂單
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 