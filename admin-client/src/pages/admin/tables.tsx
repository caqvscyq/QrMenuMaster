import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Ban, RefreshCw, CheckCircle, Table as TableIcon, PlusCircle, Plus } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/components/ui/use-toast";

type Desk = {
  id: number;
  number: string;
  name: string | null;
  capacity: number;
  area: string | null;
  isActive: boolean;
  isOccupied: boolean;
  currentOrder?: {
    id: number;
    status: string;
    total: string;
    createdAt: string;
    paid: boolean;
  } | null;
};

export default function TablesPage() {
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [editFormData, setEditFormData] = useState({
    number: "",
    name: "",
    capacity: 4,
    area: ""
  });
  const [newTableData, setNewTableData] = useState({
    number: "",
    name: "",
    capacity: 4,
    area: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tables data
  const { data: desks = [], isLoading, refetch } = useQuery<Desk[]>({
    queryKey: ["admin-desks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/desks");
      return response.json();
    },
  });
  
  // Auto-refresh tables data every 15 seconds to catch new orders
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing table data to check for new orders");
      refetch();
    }, 15000); // 15 seconds
    
    return () => clearInterval(intervalId);
  }, [refetch]);

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
      queryClient.invalidateQueries({ queryKey: ["admin-desks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to release table. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to edit a table
  const editMutation = useMutation({
    mutationFn: async (data: { deskId: number; updateData: any }) => {
      const response = await apiRequest("PUT", `/api/admin/desks/${data.deskId}`, data.updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Table updated",
        description: `Table ${editFormData.number} has been updated successfully.`,
      });
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-desks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update table. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to add a new table
  const addTableMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/desks", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Table added",
        description: `Table ${newTableData.number} has been added successfully.`,
      });
      setAddDialogOpen(false);
      setNewTableData({
        number: "",
        name: "",
        capacity: 4,
        area: ""
      });
      queryClient.invalidateQueries({ queryKey: ["admin-desks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add table. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReleaseTable = (desk: Desk) => {
    setSelectedDesk(desk);
    setReleaseDialogOpen(true);
  };

  const handleEditTable = (desk: Desk) => {
    setSelectedDesk(desk);
    setEditFormData({
      number: desk.number,
      name: desk.name || "",
      capacity: desk.capacity,
      area: desk.area || ""
    });
    setEditDialogOpen(true);
  };

  const confirmReleaseTable = () => {
    if (selectedDesk) {
      releaseMutation.mutate(selectedDesk.id);
    }
  };

  const confirmEditTable = () => {
    if (selectedDesk) {
      editMutation.mutate({
        deskId: selectedDesk.id,
        updateData: editFormData
      });
    }
  };

  const handleAddTable = () => {
    addTableMutation.mutate(newTableData);
  };
  
  // Mutation to check for new orders and update table statuses
  const checkTableStatusesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/desks/check-status");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Table statuses updated",
        description: "All tables have been checked for new orders",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update table statuses",
        variant: "destructive",
      });
    }
  });

  // Count tables by status
  const availableTables = desks.filter(desk => !desk.isOccupied).length;
  const occupiedTables = desks.filter(desk => desk.isOccupied).length;

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-secondary-gray dark:text-white">Table Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage restaurant tables and seating arrangements</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-orange hover:bg-primary-orange/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>
                  Add a new table to your restaurant layout.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Table Number</Label>
                    <Input 
                      id="number" 
                      value={newTableData.number} 
                      onChange={(e) => setNewTableData({...newTableData, number: e.target.value})}
                      placeholder="A1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Table Name (Optional)</Label>
                    <Input 
                      id="name" 
                      value={newTableData.name} 
                      onChange={(e) => setNewTableData({...newTableData, name: e.target.value})}
                      placeholder="Window Table"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input 
                      id="capacity" 
                      type="number" 
                      min="1"
                      value={newTableData.capacity} 
                      onChange={(e) => setNewTableData({...newTableData, capacity: parseInt(e.target.value) || 4})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area (Optional)</Label>
                    <Input 
                      id="area" 
                      value={newTableData.area} 
                      onChange={(e) => setNewTableData({...newTableData, area: e.target.value})}
                      placeholder="Main Hall"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddTable} 
                  className="bg-primary-orange hover:bg-primary-orange/90"
                  disabled={addTableMutation.isPending || !newTableData.number}
                >
                  {addTableMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Table
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            onClick={() => checkTableStatusesMutation.mutate()} 
            className="flex items-center gap-2"
            disabled={checkTableStatusesMutation.isPending}
          >
            {checkTableStatusesMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Check New Orders
          </Button>
          <Button onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Table Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tables</p>
                <p className="text-2xl font-bold">{desks.length}</p>
              </div>
              <TableIcon className="h-8 w-8 text-gray-400" />
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Available</p>
                <p className="text-2xl font-bold text-green-600">{availableTables}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Occupied</p>
                <p className="text-2xl font-bold text-orange-600">{occupiedTables}</p>
              </div>
              <TableIcon className="h-8 w-8 text-orange-500" />
            </CardContent>
          </Card>
        </div>

        {/* Table Grid */}
        {isLoading ? (
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {desks.map((desk) => (
              <Card key={desk.id} className={desk.isOccupied ? "border-orange-300" : "border-green-300"}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{desk.name || `Table ${desk.number}`}</CardTitle>
                    <Badge variant={desk.isOccupied ? "destructive" : "outline"}>
                      {desk.isOccupied ? "Occupied" : "Available"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Area: {desk.area || "Main"} | Capacity: {desk.capacity}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {desk.isOccupied && desk.currentOrder ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Order #:</span>
                        <span className="text-sm">{desk.currentOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span className="text-sm">{desk.currentOrder.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="text-sm font-bold">${desk.currentOrder.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Paid:</span>
                        <span className="text-sm">{desk.currentOrder.paid ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-sm text-gray-500 text-center">
                      No active orders
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {desk.isOccupied ? (
                    <div className="w-full space-y-2">
                      <Button 
                        onClick={() => handleReleaseTable(desk)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Release Table (Mark as Paid)
                      </Button>
                      {desk.currentOrder && !desk.currentOrder.paid && (
                        <p className="text-xs text-amber-600 text-center">
                          ⚠️ Payment pending - Click to mark as paid and release
                        </p>
                      )}
                      <Button 
                        onClick={() => handleEditTable(desk)}
                        className="w-full"
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Edit Table
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full space-y-2">
                      <Button className="w-full" variant="outline" disabled>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Table Available
                      </Button>
                      <Button 
                        onClick={() => handleEditTable(desk)}
                        className="w-full"
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Edit Table
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Release Table Confirmation Dialog */}
        <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Release Table {selectedDesk?.number}</DialogTitle>
              <DialogDescription>
                This will:
                <br />• Mark all pending orders as PAID and COMPLETED
                <br />• Free the table for the next customer
                <br />• Clear all current order associations
                <br /><br />
                <strong>Only do this after the customer has paid their bill!</strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReleaseDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmReleaseTable}
                disabled={releaseMutation.isPending}
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

        {/* Edit Table Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Table {selectedDesk?.number}</DialogTitle>
              <DialogDescription>
                Update table information and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Table Number</label>
                  <input
                    type="text"
                    value={editFormData.number}
                    onChange={(e) => setEditFormData({...editFormData, number: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Table Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Main Hall Table A1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Capacity</label>
                  <input
                    type="number"
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({...editFormData, capacity: parseInt(e.target.value) || 4})}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Area</label>
                  <input
                    type="text"
                    value={editFormData.area}
                    onChange={(e) => setEditFormData({...editFormData, area: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Main Hall"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmEditTable}
                disabled={editMutation.isPending}
              >
                {editMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Update Table
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 