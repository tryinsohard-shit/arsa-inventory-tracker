export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "staff" | "viewer"
  department?: string
  createdAt: Date
}

export interface InventoryItem {
  id: string
  name: string
  description: string
  category: string
  serialNumber?: string
  condition: "excellent" | "good" | "fair" | "poor"
  status: "available" | "borrowed" | "maintenance" | "retired"
  location: string
  purchaseDate?: Date
  purchasePrice?: number
  createdAt: Date
  updatedAt: Date
}

export interface BorrowRequest {
  id: string
  itemId: string
  borrowerId: string
  requestedDate: Date
  expectedReturnDate: Date
  actualReturnDate?: Date
  status: "pending" | "approved" | "rejected" | "active" | "returned" | "overdue"
  purpose: string
  approvedBy?: string
  approvedAt?: Date
  notes?: string
  returnCondition?: "excellent" | "good" | "fair" | "poor"
  createdAt: Date
  updatedAt: Date
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: "item" | "request" | "user"
  entityId: string
  details: Record<string, any>
  timestamp: Date
}

export interface DashboardStats {
  totalItems: number
  availableItems: number
  borrowedItems: number
  pendingRequests: number
  overdueItems: number
}
