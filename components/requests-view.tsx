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
  Check,
  X,
  Clock,
  Calendar,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Building2,
} from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "./auth-provider"
import type { BorrowRequest } from "@/lib/types"

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  active: "bg-blue-100 text-blue-800 border-blue-200",
  returned: "bg-gray-100 text-gray-800 border-gray-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
}

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  active: Package,
  returned: RotateCcw,
  overdue: AlertTriangle,
}

export function RequestsView() {
  const { user } = useAuth()
  const [requests, setRequests] = useState(dataStore.getRequests())
  const [items] = useState(dataStore.getItems())
  const [users] = useState(dataStore.getUsers())
  const [departments] = useState(dataStore.getDepartments())
  const [subDepartments] = useState(dataStore.getSubDepartments())
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [returningRequest, setReturningRequest] = useState<BorrowRequest | null>(null)

  const availableItems = items.filter((item) => item.status === "available")
  const defaultItemId =
    availableItems.length > 0 ? availableItems[0].id : items.length > 0 ? items[0].id : "placeholder"
  const defaultDepartmentId = user?.departmentId || (departments.length > 0 ? departments[0].id : "placeholder")

  const [formData, setFormData] = useState({
    itemId: defaultItemId,
    expectedReturnDate: "",
    purpose: "",
    departmentId: defaultDepartmentId,
    subDepartmentId: "",
  })
  const [returnCondition, setReturnCondition] = useState<"excellent" | "good" | "fair" | "poor">("excellent")
  const [error, setError] = useState("")

  const selectedDeptSubDepts =
    formData.departmentId && formData.departmentId !== "" && formData.departmentId !== "placeholder"
      ? subDepartments.filter((sd) => sd.departmentId === formData.departmentId)
      : []

  const enrichedRequests = useMemo(() => {
    return requests.map((request) => {
      const item = items.find((i) => i.id === request.itemId)
      const borrower = users.find((u) => u.id === request.borrowerId)
      const approver = request.approvedBy ? users.find((u) => u.id === request.approvedBy) : null
      const dept = request.departmentId ? departments.find((d) => d.id === request.departmentId) : null
      const subDept = request.subDepartmentId ? subDepartments.find((sd) => sd.id === request.subDepartmentId) : null
      const isOverdue = request.status === "active" && new Date() > request.expectedReturnDate

      return {
        ...request,
        item,
        borrower,
        approver,
        dept,
        subDept,
        displayStatus: isOverdue ? "overdue" : request.status,
      }
    })
  }, [requests, items, users, departments, subDepartments])

  const filteredRequests = useMemo(() => {
    let filtered = enrichedRequests

    // Filter by user role
    if (user?.role === "staff") {
      filtered = filtered.filter((req) => req.borrowerId === user.id)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.borrower?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.dept?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.subDept?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.displayStatus === statusFilter)
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [enrichedRequests, searchTerm, statusFilter, user])

  const resetForm = () => {
    setFormData({
      itemId: defaultItemId,
      expectedReturnDate: "",
      purpose: "",
      departmentId: defaultDepartmentId,
      subDepartmentId: "",
    })
    setError("")
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (
      !formData.itemId ||
      !formData.expectedReturnDate ||
      !formData.purpose ||
      !formData.departmentId ||
      formData.itemId === "placeholder" ||
      formData.departmentId === "placeholder"
    ) {
      setError("Please fill in all required fields")
      return
    }

    if (!user) return

    const expectedDate = new Date(formData.expectedReturnDate)
    if (expectedDate <= new Date()) {
      setError("Expected return date must be in the future")
      return
    }

    try {
      await dataStore.addRequest({
        itemId: formData.itemId,
        borrowerId: user.id,
        departmentId: formData.departmentId,
        subDepartmentId: formData.subDepartmentId || undefined,
        requestedDate: new Date(),
        expectedReturnDate: expectedDate,
        status: "pending",
        purpose: formData.purpose,
      })
      setRequests(dataStore.getRequests())
      setIsNewRequestOpen(false)
      resetForm()
    } catch (err) {
      setError("Failed to submit request")
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    if (!user) return

    const request = dataStore.getRequestById(requestId)
    if (!request) return

    // Update request status
    await dataStore.updateRequest(requestId, {
      status: "active",
      approvedBy: user.id,
      approvedAt: new Date(),
    })

    // Update item status
    await dataStore.updateItem(request.itemId, { status: "borrowed" })

    setRequests(dataStore.getRequests())
  }

  const handleRejectRequest = async (requestId: string) => {
    if (!user) return

    await dataStore.updateRequest(requestId, {
      status: "rejected",
      approvedBy: user.id,
      approvedAt: new Date(),
    })

    setRequests(dataStore.getRequests())
  }

  const handleReturnItem = async () => {
    if (!returningRequest || !user) return

    // Update request
    await dataStore.updateRequest(returningRequest.id, {
      status: "returned",
      actualReturnDate: new Date(),
      returnCondition,
    })

    // Update item status and condition
    await dataStore.updateItem(returningRequest.itemId, {
      status: "available",
      condition: returnCondition,
    })

    setRequests(dataStore.getRequests())
    setIsReturnDialogOpen(false)
    setReturningRequest(null)
    setReturnCondition("excellent")
  }

  const canCreateRequest = user?.role === "staff" || user?.role === "admin"
  const canApprove = user?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Requests</h2>
          <p className="text-muted-foreground">
            {user?.role === "staff" ? "Manage your borrow requests" : "Manage all borrow requests"}
          </p>
        </div>
        {canCreateRequest && (
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Borrow Request</DialogTitle>
                <DialogDescription>Submit a request to borrow an inventory item.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, departmentId: value, subDepartmentId: "" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.departmentId && formData.departmentId !== "" && formData.departmentId !== "placeholder" && (
                  <div className="space-y-2">
                    <Label htmlFor="subDepartment">Sub-Department</Label>
                    <Select
                      value={formData.subDepartmentId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, subDepartmentId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-department (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {selectedDeptSubDepts.map((subDept) => (
                          <SelectItem key={subDept.id} value={subDept.id}>
                            {subDept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="item">Item *</Label>
                  <Select
                    value={formData.itemId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, itemId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {item.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedReturnDate">Expected Return Date *</Label>
                  <Input
                    id="expectedReturnDate"
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} // Tomorrow
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                    placeholder="Describe why you need this item"
                    rows={3}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Request</Button>
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
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const StatusIcon = statusIcons[request.displayStatus as keyof typeof statusIcons]
          return (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <StatusIcon className="h-5 w-5" />
                      {request.item?.name || "Unknown Item"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Requested by {request.borrower?.name} • {request.createdAt.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={statusColors[request.displayStatus as keyof typeof statusColors]}>
                    {request.displayStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Item:</strong> {request.item?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Borrower:</strong> {request.borrower?.name}
                      </span>
                    </div>
                    {request.dept && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          <strong>Department:</strong> {request.dept.name}
                          {request.subDept && ` - ${request.subDept.name}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Expected Return:</strong> {request.expectedReturnDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <strong>Purpose:</strong>
                      <p className="text-muted-foreground mt-1">{request.purpose}</p>
                    </div>
                    {request.approver && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          <strong>Approved by:</strong> {request.approver.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {request.status === "pending" && canApprove && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id)}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectRequest(request.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                    </>
                  )}
                  {(request.status === "active" || request.displayStatus === "overdue") && canApprove && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReturningRequest(request)
                        setIsReturnDialogOpen(true)
                      }}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Process Return
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No requests found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters to see more requests."
                : canCreateRequest
                  ? "Get started by creating your first borrow request."
                  : "No requests have been submitted yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
            <DialogDescription>
              Record the return of {returningRequest?.item?.name} by {returningRequest?.borrower?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returnCondition">Item Condition</Label>
              <Select value={returnCondition} onValueChange={(value: any) => setReturnCondition(value)}>
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
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReturnItem}>Process Return</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
