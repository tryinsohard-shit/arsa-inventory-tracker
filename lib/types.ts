export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "staff" | "viewer" | "manager"
  department?: string
  departmentId?: string
  subDepartmentId?: string
  passwordHash?: string
  createdAt: Date
}

export interface InventoryItem {
  id: string
  name: string
  description: string
  category: string
  serialNumber?: string
  status: "available" | "borrowed" | "maintenance" | "retired"
  location: string
  purchaseDate?: Date
  value?: number
  photo_url?: string
  photo_file_id?: string // Added to store the ImageKit file ID for deletion
  createdAt: Date
  updatedAt: Date
}

export interface BorrowRequest {
  id: string
  itemId: string
  userId: string
  departmentId: string
  subDepartmentId?: string
  borrowDate?: Date
  expectedReturnDate: Date
  actualReturnDate?: Date
  status: "pending" | "approved" | "rejected" | "borrowed" | "returned"
  purpose?: string
  notes?: string
  returnCondition?: "good" | "fair" | "damaged"
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

export interface Department {
  id: string
  name: string
  description?: string
  parentDepartmentId?: string
  createdAt: Date
  updatedAt: Date
}

export interface SubDepartment {
  id: string
  name: string
  departmentId: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

