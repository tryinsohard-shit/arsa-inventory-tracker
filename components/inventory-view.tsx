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
} from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "./auth-provider"
import type { InventoryItem } from "@/lib/types"

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
  })
  const [error, setError] = useState("")

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
    })
    setError("")
    setEditingItem(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.description || !formData.category || !formData.location) {
      setError("Please fill in all required fields")
      return
    }

    try {
      if (editingItem) {
        const updatedItem = dataStore.updateItem(editingItem.id, {
          ...formData,
          purchasePrice: formData.purchasePrice ? Number.parseFloat(formData.purchasePrice) : undefined,
        })
        if (updatedItem) {
          setItems(dataStore.getItems())
          setIsAddDialogOpen(false)
          resetForm()
        }
      } else {
        const newItem = dataStore.addItem({
          ...formData,
          purchasePrice: formData.purchasePrice ? Number.parseFloat(formData.purchasePrice) : undefined,
        })
        setItems(dataStore.getItems())
        setIsAddDialogOpen(false)
        resetForm()
      }
    } catch (err) {
      setError("Failed to save item")
    }
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
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      dataStore.deleteItem(id)
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
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="mt-1">{item.description}</CardDescription>
                  </div>
                  <StatusIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={statusColors[item.status]}>
                    {item.status}
                  </Badge>
                  <Badge variant="secondary" className={conditionColors[item.condition]}>
                    {item.condition}
                  </Badge>
                  <Badge variant="outline">{item.category}</Badge>
                </div>

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
