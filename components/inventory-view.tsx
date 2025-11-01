"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  Calendar,
  DollarSign,
  MapPin,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Image as ImageIcon,
} from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "./auth-provider"
import { useAlertDialog } from "@/components/ui/alert-dialog"
import type { InventoryItem } from "@/lib/types"
import { uploadInventoryPhoto, deleteInventoryPhoto } from "@/lib/photo-storage"

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-200",
  borrowed: "bg-blue-100 text-blue-800 border-blue-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  retired: "bg-gray-100 text-gray-800 border-gray-200",
}

const conditionColors = {
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
}

const statusIcons = {
  available: CheckCircle,
  borrowed: Clock,
  maintenance: AlertCircle,
  retired: XCircle,
}

export function InventoryView() {
  const { user } = useAuth()
  const { confirm: confirmDialog, success: successDialog } = useAlertDialog()
  const [items, setItems] = useState(dataStore.getItems())
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    serialNumber: "",
    condition: "excellent" as const,
    status: "available" as const,
    location: "",
    purchasePrice: "",
    photo_url: "",
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("")

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = error => reject(error);
    });
  }

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map((item) => item.category)))
    return cats.sort()
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [items, searchTerm, categoryFilter, statusFilter])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      serialNumber: "",
      condition: "excellent",
      status: "available",
      location: "",
      purchasePrice: "",
      photo_url: "",
    })
    setError("")
    setEditingItem(null)
    setSelectedFile(null)
    setUploadProgress(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.description || !formData.category || !formData.location) {
      setError("Please fill in all required fields")
      return
    }

    // Check if user is authenticated
    if (!user) {
      setError("User not authenticated. Please log in first.");
      return;
    }

    try {
      let photoUrl = formData.photo_url;
      let photoFileId = editingItem?.photo_file_id; // Keep existing fileId if editing

      // Handle photo upload if a new file is selected
      if (selectedFile) {
        // If editing and there's an existing photo, delete it first
        if (editingItem && editingItem.photo_url && editingItem.photo_file_id) {
          await deleteInventoryPhoto(editingItem.photo_file_id);
        }

        // Show upload progress
        setUploadProgress(10);
        
        // Convert file to base64
        const base64Data = await fileToBase64(selectedFile);
        setUploadProgress(30);

        // Upload the new photo using the photo storage library - this will throw if it fails
        // The library returns only the URL, but we need both URL and file ID
        setUploadProgress(50);
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: JSON.stringify({
            file: base64Data,
            fileName: selectedFile.name,
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        setUploadProgress(80);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const uploadResult = await response.json();
        setUploadProgress(100);
        
        photoUrl = uploadResult.url;
        photoFileId = uploadResult.fileId; // Get the fileId for future deletion
        
        // Show success notification for image upload
        await successDialog("Foto berhasil di-upload!", "Upload Berhasil");
        
        // Reset progress after successful upload
        setUploadProgress(null);
      } else if (selectedFile === null && formData.photo_url === "") {
        // If we're removing a photo (setting to empty)
        if (editingItem && editingItem.photo_url && editingItem.photo_file_id) {
          await deleteInventoryPhoto(editingItem.photo_file_id);
        }
        photoUrl = undefined;
        photoFileId = undefined;
      }

      if (editingItem) {
        const updatedItem = await dataStore.updateItem(editingItem.id, {
          ...formData,
          photo_url: photoUrl,
          photo_file_id: photoFileId, // Include the file ID
          purchasePrice: formData.purchasePrice ? Number.parseFloat(formData.purchasePrice) : undefined,
        })
        if (updatedItem) {
          setItems(dataStore.getItems())
          setIsAddDialogOpen(false)
          resetForm()
          // Show success notification
          await successDialog(
            selectedFile 
              ? "Item berhasil di-update dengan foto baru!" 
              : "Item berhasil di-update!",
            "Update Berhasil"
          );
        }
      } else {
        const newItem = await dataStore.addItem({
          ...formData,
          photo_url: photoUrl,
          photo_file_id: photoFileId, // Include the file ID
          purchasePrice: formData.purchasePrice ? Number.parseFloat(formData.purchasePrice) : undefined,
        })
        setItems(dataStore.getItems())
        setIsAddDialogOpen(false)
        resetForm()
        // Show success notification
        await successDialog(
          selectedFile 
            ? "Item berhasil dibuat dengan foto!" 
            : "Item berhasil dibuat!",
          "Berhasil Dibuat"
        );
      }
    } catch (err) {
      setUploadProgress(null); // Make sure to reset progress on error
      setError("Failed to save item: " + (err as Error).message)
    }
  }

  // Helper function to convert file to data URL (including the prefix)
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataURL = reader.result as string;
        resolve(dataURL); // Return the full data URL (with prefix)
      };
      reader.onerror = error => reject(error);
    });
  }
  
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      serialNumber: item.serialNumber || "",
      condition: item.condition,
      status: item.status,
      location: item.location,
      purchasePrice: item.purchasePrice?.toString() || "",
      photo_url: item.photo_url || "",
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    const confirmed = await confirmDialog("Are you sure you want to delete this item?", "Delete Item")
    if (confirmed) {
      try {
        // If the item has a photo, delete it from storage
        if (itemToDelete?.photo_url && itemToDelete.photo_file_id) {
          await deleteInventoryPhoto(itemToDelete.photo_file_id);
        }
      } catch (error) {
        console.error("Error deleting photo:", error);
        // Continue with item deletion even if photo deletion fails
      }
      
      await dataStore.deleteItem(id)
      setItems(dataStore.getItems())
    }
  }

  const canModify = user?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Inventory</h2>
          <p className="text-muted-foreground">Manage your organization's assets</p>
        </div>
        {canModify && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Update the item details below." : "Enter the details for the new inventory item."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Item name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Laptops, Monitors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the item"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
                      placeholder="Serial or asset number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Storage location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value: any) => setFormData((prev) => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="borrowed">Borrowed</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, purchasePrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="photo">Item Photo</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                    {uploadProgress !== null && (
                      <div className="flex-1 max-w-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300 ease-out"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-blue-600 min-w-[3rem] text-right">
                            {uploadProgress}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Mengupload foto...</p>
                      </div>
                    )}
                  </div>
                  {formData.photo_url && !selectedFile && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <Label>Current Photo:</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // If there's an existing photo, delete it from storage
                            if (editingItem?.photo_file_id) {
                              await deleteInventoryPhoto(editingItem.photo_file_id);
                            }
                            setFormData({...formData, photo_url: ""});
                            setSelectedFile(null); // Also clear the selected file
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <img 
                          src={formData.photo_url} 
                          alt="Current item" 
                          className="w-16 h-16 object-cover rounded border" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error('Form preview image failed to load:', formData.photo_url);
                            if (!target.src.includes('placeholder-image')) {
                              target.src = '/placeholder-image.jpg'; // fallback image
                            }
                          }}
                          onLoad={() => {
                            console.log('Form preview image loaded successfully:', formData.photo_url);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingItem ? "Update Item" : "Add Item"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="borrowed">Borrowed</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const StatusIcon = statusIcons[item.status]
          return (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow border border-border">
              {/* Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-foreground">{item.name}</CardTitle>
                    <CardDescription className="mt-2 text-sm">{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary text-primary-foreground capitalize text-xs font-medium px-3">
                    {item.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize text-xs font-medium px-3">
                    {item.condition}
                  </Badge>
                  <Badge variant="outline" className="capitalize text-xs font-medium px-3">
                    {item.category}
                  </Badge>
                </div>

                {/* Photo */}
                {item.photo_url && (
                  <div className="flex justify-center">
                    <img 
                      src={item.photo_url} 
                      alt={item.name}
                      className="w-full h-32 object-cover rounded border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error('Image failed to load:', item.photo_url);
                        if (!target.src.includes('placeholder-image')) {
                          target.src = '/placeholder-image.jpg'; // fallback image
                        }
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', item.photo_url);
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2 text-sm text-muted-foreground">
                  {item.serialNumber && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>{item.serialNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{item.location}</span>
                  </div>
                  {item.purchasePrice && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>${item.purchasePrice.toLocaleString()}</span>
                    </div>
                  )}
                  {item.purchaseDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{item.purchaseDate.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {canModify && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No items found</h3>
            <p className="text-muted-foreground">
              {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters to see more items."
                : "Get started by adding your first inventory item."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
