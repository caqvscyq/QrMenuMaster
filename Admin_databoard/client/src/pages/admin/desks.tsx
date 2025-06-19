import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  MapPin, 
  QrCode,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Check,
  RefreshCw,
  CreditCard,
  Copy,
  ClipboardCheck,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import type { DeskWithStatus, InsertDesk } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface DeskFormData {
  number: string;
  name: string;
  capacity: number;
  area: string;
}

export default function AdminDesks() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingDesk, setEditingDesk] = useState<DeskWithStatus | null>(null);
  const [formData, setFormData] = useState<DeskFormData>({
    number: "",
    name: "",
    capacity: 4,
    area: ""
  });
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusToggleDialogOpen, setStatusToggleDialogOpen] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState<DeskWithStatus | null>(null);
  const [copiedUrls, setCopiedUrls] = useState<Record<number, boolean>>({});
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeDesk, setQrCodeDesk] = useState<DeskWithStatus | null>(null);
  const { toast } = useToast();

  // Fetch desks
  const { data: desks, isLoading: desksLoading, error: desksError, refetch } = useQuery<DeskWithStatus[]>({
    queryKey: ["desks"],
    queryFn: async () => {
      console.log("Fetching desks with user:", user);
      try {
        const response = await apiRequest("GET", "/api/admin/desks");
        const data = await response.json();
        console.log("Desk data received:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error in desks fetch:", error);
        // Return an empty array as fallback to prevent UI from breaking
        toast({
          title: "Error loading tables",
          description: "Could not load tables data. Using empty state.",
          variant: "destructive",
        });
        return [];
      }
    },
    staleTime: 30000,
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  console.log("Desks state:", { desks, desksLoading, desksError, user });

  // Create desk mutation
  const createDeskMutation = useMutation({
    mutationFn: async (deskData: InsertDesk) => {
      const response = await fetch("/api/admin/desks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.id}`,
        },
        body: JSON.stringify(deskData),
      });
      if (!response.ok) throw new Error("Failed to create desk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      setIsCreating(false);
      setFormData({ number: "", name: "", capacity: 4, area: "" });
    },
  });

  // Update desk mutation
  const updateDeskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertDesk> }) => {
      const response = await fetch(`/api/admin/desks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.id}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update desk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      setEditingDesk(null);
      setEditDialogOpen(false);
      setFormData({ number: "", name: "", capacity: 4, area: "" });
      toast({
        title: "Table updated",
        description: "Table has been updated successfully.",
      });
    },
  });

  // Delete desk mutation
  const deleteDeskMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/desks/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user?.id}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete desk");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desks"] });
    },
  });

  // Mutation to release a table
  const releaseMutation = useMutation({
    mutationFn: async (deskId: number) => {
      const response = await apiRequest("POST", `/api/admin/desks/${deskId}/release`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Table released",
        description: `Table ${selectedDesk?.number} has been released and is now available.`,
      });
      setReleaseDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to release table. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to toggle table status
  const statusToggleMutation = useMutation({
    mutationFn: async ({ deskId, newStatus }: { deskId: number; newStatus: 'available' | 'occupied' }) => {
      console.log('Status toggle mutation called:', { deskId, newStatus });
      
      const response = await apiRequest("POST", `/api/admin/desks/${deskId}/toggle-status`, { status: newStatus });
      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('Status toggle success:', data);
      const statusText = variables.newStatus === 'available' ? 'available' : 'occupied';
      toast({
        title: "Table status updated",
        description: `Table ${selectedDesk?.number} is now ${statusText}.`,
      });
      setStatusToggleDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["desks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error) => {
      console.error('Status toggle mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update table status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Function to copy URL to clipboard
  const copyToClipboard = (desk: DeskWithStatus) => {
    const url = `http://localhost:5000?desk=${desk.id}&table=${desk.number}`;
    navigator.clipboard.writeText(url).then(
      () => {
        // Show success state
        setCopiedUrls(prev => ({ ...prev, [desk.id]: true }));
        toast({
          title: "URL copied",
          description: `QR code URL for Table ${desk.number} copied to clipboard`,
        });
        // Reset after 2 seconds
        setTimeout(() => {
          setCopiedUrls(prev => ({ ...prev, [desk.id]: false }));
        }, 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          title: "Failed to copy",
          description: "Please try again or copy manually",
          variant: "destructive",
        });
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDesk) {
      updateDeskMutation.mutate({
        id: editingDesk.id,
        data: {
          ...formData,
          shopId: 1,
        },
      });
    } else {
      createDeskMutation.mutate({
        ...formData,
        shopId: 1,
      });
    }
  };

  const startEdit = (desk: DeskWithStatus) => {
    setEditingDesk(desk);
    setFormData({
      number: desk.number,
      name: desk.name || "",
      capacity: desk.capacity,
      area: desk.area || "",
    });
    setEditDialogOpen(true);
  };

  const cancelEdit = () => {
    setEditingDesk(null);
    setIsCreating(false);
    setEditDialogOpen(false);
    setFormData({ number: "", name: "", capacity: 4, area: "" });
  };

  const handleEditSubmit = () => {
    if (editingDesk) {
      updateDeskMutation.mutate({
        id: editingDesk.id,
        data: {
          ...formData,
          shopId: 1,
        },
      });
    }
  };

  // Helper function to determine if a desk is actually occupied
  const isDeskOccupied = (desk: DeskWithStatus): boolean => {
    // A desk is considered occupied if the flag is set, it has an active order, or it has any past orders that haven't been cleared.
    const hasActiveOrder = !!desk.currentOrder && !desk.currentOrder.paid;
    const hasUnclearedOrders = typeof desk.orderCount === 'number' && desk.orderCount > 0;
    return !!desk.isOccupied || hasActiveOrder || hasUnclearedOrders;
  };

  const getStatusBadge = (desk: DeskWithStatus) => {
    if (!desk.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (isDeskOccupied(desk)) {
      return <Badge variant="destructive">Occupied</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Available</Badge>;
  };

  const getStatusIcon = (desk: DeskWithStatus) => {
    if (!desk.isActive) {
      return <AlertCircle className="text-gray-500" size={20} />;
    }
    if (isDeskOccupied(desk)) {
      return <Clock className="text-red-500" size={20} />;
    }
    return <CheckCircle className="text-green-500" size={20} />;
  };

  const handleReleaseTable = (desk: DeskWithStatus) => {
    console.log("Releasing table. Desk data:", JSON.stringify(desk, null, 2));
    setSelectedDesk(desk);
    setReleaseDialogOpen(true);
  };

  const confirmReleaseTable = () => {
    if (selectedDesk) {
      releaseMutation.mutate(selectedDesk.id);
    }
  };

  const handleStatusToggle = (desk: DeskWithStatus) => {
    setSelectedDesk(desk);
    setStatusToggleDialogOpen(true);
  };

  const confirmStatusToggle = (newStatus: 'available' | 'occupied') => {
    if (selectedDesk) {
      statusToggleMutation.mutate({
        deskId: selectedDesk.id,
        newStatus: newStatus
      });
    }
  };

  // Function to show QR code dialog
  const showQrCode = (desk: DeskWithStatus) => {
    setQrCodeDesk(desk);
    setShowQrDialog(true);
  };

  if (authLoading || desksLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-gray-500">Access Denied</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-secondary-gray dark:text-white">Table Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage restaurant tables and seating arrangements</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-primary-orange hover:bg-primary-orange/90 text-white"
              >
                <Plus className="mr-2" size={20} />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number">Table Number</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="e.g., A1, B5, VIP-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Table Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Window Side Table"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="area">Area</Label>
                    <Input
                      id="area"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="e.g., Main Hall, VIP, Terrace"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDeskMutation.isPending || updateDeskMutation.isPending} className="bg-primary-orange hover:bg-primary-orange/90">
                    Create Table
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Create/Edit Form */}
        {editingDesk && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                Edit Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-number">Table Number</Label>
                    <Input
                      id="edit-number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="e.g., A1, B5, VIP-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-name">Table Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Window Side Table"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-capacity">Capacity</Label>
                    <Input
                      id="edit-capacity"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-area">Area</Label>
                    <Input
                      id="edit-area"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="e.g., Main Hall, VIP, Terrace"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createDeskMutation.isPending || updateDeskMutation.isPending}>
                    Update Table
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tables Grid - Sorted by desk_id */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {desks?.sort((a, b) => a.id - b.id).map((desk) => {
            const isActuallyOccupied = isDeskOccupied(desk);
            return (
              <Card key={desk.id} className={`${isActuallyOccupied ? 'border-orange-300' : ''} ${desk.isOccupied ? 'border-orange-300' : ''} ${desk.currentOrder ? 'border-orange-300' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-1">
                        Table {desk.number}
                        {desk.isOccupied && <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Occupied</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{desk.name || `${desk.area || 'Main'} Table ${desk.number}`}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEdit(desk)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteDeskMutation.mutate(desk.id)}
                        disabled={isActuallyOccupied}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{desk.capacity} seats</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{desk.area || 'Main Hall'}</span>
                    </div>
                  </div>

                  {/* QR Code URL section */}
                  <div className="bg-blue-50 p-2 rounded border mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <QrCode className="mr-2 h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800">QR Code URL:</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-blue-600"
                          onClick={() => showQrCode(desk)}
                          title="Show QR Code"
                        >
                          <QrCode className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-blue-600"
                          onClick={() => copyToClipboard(desk)}
                          title="Copy URL"
                        >
                          {copiedUrls[desk.id] ? (
                            <ClipboardCheck className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-blue-600 break-all">
                      {`http://localhost:5000?desk=${desk.id}&table=${desk.number}`}
                    </p>
                  </div>

                  {isActuallyOccupied ? (
                    <Button 
                      className="w-full" 
                      onClick={() => handleReleaseTable(desk)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Release Table
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleStatusToggle(desk)}
                    >
                      <Check className="mr-2 h-4 w-4" /> Mark as Occupied
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Error Display */}
        {desksError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-red-800 font-medium">Error loading tables:</p>
              <p className="text-red-600 text-sm mt-1">{desksError.message}</p>
            </CardContent>
          </Card>
        )}

        {(!desks || desks.length === 0) && (
          <div className="bg-muted/30 border rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No tables yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first table to manage seating arrangements.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Table
              </Button>
            </div>
          </div>
        )}

        {/* Release Table Confirmation Dialog */}
        <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Release Table</DialogTitle>
              <DialogDescription>
                Are you sure you want to release table {selectedDesk?.number}? This will mark all orders as paid and completed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReleaseDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmReleaseTable}
                disabled={releaseMutation.isPending}
                className="bg-primary-orange hover:bg-primary-orange/90"
              >
                {releaseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Toggle Confirmation Dialog */}
        <Dialog open={statusToggleDialogOpen} onOpenChange={setStatusToggleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Table Status</DialogTitle>
              <DialogDescription>
                {selectedDesk && isDeskOccupied(selectedDesk) ? (
                  <>
                    Mark table {selectedDesk?.number} as <strong>Available</strong>?
                    <br />
                    <span className="text-amber-600 font-medium">
                      ⚠️ This will clear all orders and reset the table for new customers.
                    </span>
                  </>
                ) : (
                  <>
                    Mark table {selectedDesk?.number} as <strong>Occupied</strong>?
                    <br />
                    <span className="text-blue-600">
                      This indicates the table is currently in use by customers.
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusToggleDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const newStatus = (selectedDesk?.isOccupied || selectedDesk?.currentOrder) ? 'available' : 'occupied';
                  confirmStatusToggle(newStatus);
                }}
                disabled={statusToggleMutation.isPending}
                className={
                  selectedDesk?.isOccupied || selectedDesk?.currentOrder
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }
              >
                {statusToggleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {selectedDesk?.isOccupied || selectedDesk?.currentOrder ? "Mark Available" : "Mark Occupied"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code for Table {qrCodeDesk?.number}</DialogTitle>
              <DialogDescription>
                Scan this QR code with a mobile device to access the table's menu
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              {qrCodeDesk && (
                <>
                  <div className="bg-white p-4 rounded-lg border">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        `http://localhost:5001?desk=${qrCodeDesk.id}&table=${qrCodeDesk.number}`
                      )}`} 
                      alt={`QR Code for Table ${qrCodeDesk.number}`}
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    This QR code links to the customer ordering page for Table {qrCodeDesk.number}
                  </p>
                </>
              )}
            </div>
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQrDialog(false)}
              >
                Close
              </Button>
              <Button 
                type="button"
                onClick={() => {
                  if (qrCodeDesk) {
                    const url = `http://localhost:5001?desk=${qrCodeDesk.id}&table=${qrCodeDesk.number}`;
                    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&download=1`, '_blank');
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 