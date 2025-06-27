import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Store, 
  Clock, 
  Phone, 
  Mail, 
  MapPin,
  Save,
  Bell,
  Palette
} from "lucide-react";

interface RestaurantSettings {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  openingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  notifications: {
    emailOrders: boolean;
    smsOrders: boolean;
    lowStock: boolean;
  };
  orderSettings: {
    minimumOrderAmount: number;
    estimatedDeliveryTime: number;
    acceptingOrders: boolean;
  };
}

const defaultSettings: RestaurantSettings = {
  name: "Afly OrderMeals",
  description: "Quality food delivered with exceptional service",
  phone: "(555) 123-4567",
  email: "info@aflyordermeals.com",
  address: "123 Food Street, City, State 12345",
  openingHours: {
    monday: { open: "11:00", close: "22:00", closed: false },
    tuesday: { open: "11:00", close: "22:00", closed: false },
    wednesday: { open: "11:00", close: "22:00", closed: false },
    thursday: { open: "11:00", close: "22:00", closed: false },
    friday: { open: "11:00", close: "23:00", closed: false },
    saturday: { open: "10:00", close: "23:00", closed: false },
    sunday: { open: "10:00", close: "21:00", closed: false },
  },
  notifications: {
    emailOrders: true,
    smsOrders: false,
    lowStock: true,
  },
  orderSettings: {
    minimumOrderAmount: 15,
    estimatedDeliveryTime: 30,
    acceptingOrders: true,
  },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For now, we'll use local state since there's no settings API endpoint
  // In a real application, you would fetch settings from the backend

  const handleSaveSettings = () => {
    // Simulate saving settings
    toast({
      title: "Settings saved",
      description: "Your restaurant settings have been updated successfully.",
    });
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Restaurant Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure your restaurant information and preferences</p>
        </div>

        {/* Restaurant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Restaurant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => updateSetting('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => updateSetting('phone', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => updateSetting('email', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => updateSetting('description', e.target.value)}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => updateSetting('address', e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Opening Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Opening Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center space-x-4">
                  <div className="w-24">
                    <span className="text-sm font-medium capitalize">{day}</span>
                  </div>
                  
                  <Switch
                    checked={!settings.openingHours[day as keyof typeof settings.openingHours].closed}
                    onCheckedChange={(checked) => 
                      updateSetting(`openingHours.${day}.closed`, !checked)
                    }
                  />
                  
                  {!settings.openingHours[day as keyof typeof settings.openingHours].closed && (
                    <>
                      <Input
                        type="time"
                        value={settings.openingHours[day as keyof typeof settings.openingHours].open}
                        onChange={(e) => updateSetting(`openingHours.${day}.open`, e.target.value)}
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={settings.openingHours[day as keyof typeof settings.openingHours].close}
                        onChange={(e) => updateSetting(`openingHours.${day}.close`, e.target.value)}
                        className="w-32"
                      />
                    </>
                  )}
                  
                  {settings.openingHours[day as keyof typeof settings.openingHours].closed && (
                    <span className="text-gray-500">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="h-5 w-5 mr-2" />
              Order Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="accepting-orders">Currently Accepting Orders</Label>
                <p className="text-sm text-gray-600">Toggle to temporarily stop accepting new orders</p>
              </div>
              <Switch
                id="accepting-orders"
                checked={settings.orderSettings.acceptingOrders}
                onCheckedChange={(checked) => updateSetting('orderSettings.acceptingOrders', checked)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-order">Minimum Order Amount ($)</Label>
                <Input
                  id="min-order"
                  type="number"
                  value={settings.orderSettings.minimumOrderAmount}
                  onChange={(e) => updateSetting('orderSettings.minimumOrderAmount', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="delivery-time">Estimated Delivery Time (minutes)</Label>
                <Input
                  id="delivery-time"
                  type="number"
                  value={settings.orderSettings.estimatedDeliveryTime}
                  onChange={(e) => updateSetting('orderSettings.estimatedDeliveryTime', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Order Notifications</Label>
                <p className="text-sm text-gray-600">Receive emails for new orders</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.notifications.emailOrders}
                onCheckedChange={(checked) => updateSetting('notifications.emailOrders', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notifications">SMS Order Notifications</Label>
                <p className="text-sm text-gray-600">Receive text messages for new orders</p>
              </div>
              <Switch
                id="sms-notifications"
                checked={settings.notifications.smsOrders}
                onCheckedChange={(checked) => updateSetting('notifications.smsOrders', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="stock-notifications">Low Stock Alerts</Label>
                <p className="text-sm text-gray-600">Get notified when items are running low</p>
              </div>
              <Switch
                id="stock-notifications"
                checked={settings.notifications.lowStock}
                onCheckedChange={(checked) => updateSetting('notifications.lowStock', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="bg-orange-600 hover:bg-orange-700">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}