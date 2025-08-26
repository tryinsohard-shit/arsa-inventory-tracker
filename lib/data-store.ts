import type { User, InventoryItem, BorrowRequest, AuditLog, DashboardStats } from "./types"
import { mockUsers, mockInventoryItems, mockBorrowRequests } from "./mock-data"

class DataStore {
  private users: User[] = [...mockUsers]
  private items: InventoryItem[] = [...mockInventoryItems]
  private requests: BorrowRequest[] = [...mockBorrowRequests]
  private auditLogs: AuditLog[] = []
  private currentUser: User | null = null

  // User management
  getCurrentUser(): User | null {
    return this.currentUser
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user
  }

  getUsers(): User[] {
    return [...this.users]
  }

  // Inventory management
  getItems(): InventoryItem[] {
    return [...this.items]
  }

  getItemById(id: string): InventoryItem | undefined {
    return this.items.find((item) => item.id === id)
  }

  addItem(item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">): InventoryItem {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.items.push(newItem)
    this.addAuditLog("item", newItem.id, "created", { item: newItem })
    return newItem
  }

  updateItem(id: string, updates: Partial<InventoryItem>): InventoryItem | null {
    const index = this.items.findIndex((item) => item.id === id)
    if (index === -1) return null

    const updatedItem = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date(),
    }
    this.items[index] = updatedItem
    this.addAuditLog("item", id, "updated", { updates })
    return updatedItem
  }

  deleteItem(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id)
    if (index === -1) return false

    this.items.splice(index, 1)
    this.addAuditLog("item", id, "deleted", {})
    return true
  }

  // Borrow request management
  getRequests(): BorrowRequest[] {
    return [...this.requests]
  }

  getRequestById(id: string): BorrowRequest | undefined {
    return this.requests.find((request) => request.id === id)
  }

  addRequest(request: Omit<BorrowRequest, "id" | "createdAt" | "updatedAt">): BorrowRequest {
    const newRequest: BorrowRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.requests.push(newRequest)
    this.addAuditLog("request", newRequest.id, "created", { request: newRequest })
    return newRequest
  }

  updateRequest(id: string, updates: Partial<BorrowRequest>): BorrowRequest | null {
    const index = this.requests.findIndex((request) => request.id === id)
    if (index === -1) return null

    const updatedRequest = {
      ...this.requests[index],
      ...updates,
      updatedAt: new Date(),
    }
    this.requests[index] = updatedRequest
    this.addAuditLog("request", id, "updated", { updates })
    return updatedRequest
  }

  // Dashboard statistics
  getDashboardStats(): DashboardStats {
    const totalItems = this.items.length
    const availableItems = this.items.filter((item) => item.status === "available").length
    const borrowedItems = this.items.filter((item) => item.status === "borrowed").length
    const pendingRequests = this.requests.filter((request) => request.status === "pending").length
    const overdueItems = this.requests.filter(
      (request) => request.status === "active" && new Date() > request.expectedReturnDate,
    ).length

    return {
      totalItems,
      availableItems,
      borrowedItems,
      pendingRequests,
      overdueItems,
    }
  }

  // Audit logging
  private addAuditLog(
    entityType: "item" | "request" | "user",
    entityId: string,
    action: string,
    details: Record<string, any>,
  ): void {
    if (!this.currentUser) return

    const log: AuditLog = {
      id: Date.now().toString(),
      userId: this.currentUser.id,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date(),
    }
    this.auditLogs.push(log)
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs]
  }
}

export const dataStore = new DataStore()
