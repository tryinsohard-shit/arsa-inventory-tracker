import type { User, InventoryItem, BorrowRequest, AuditLog, DashboardStats, Department, SubDepartment } from "./types"
import { mockUsers, mockInventoryItems, mockBorrowRequests, mockDepartments, mockSubDepartments } from "./mock-data"
import { supabase } from "./supabase-client"
import { hashPassword } from "./password-utils"

class DataStore {
  private users: User[] = [...mockUsers]
  private items: InventoryItem[] = [...mockInventoryItems]
  private requests: BorrowRequest[] = [...mockBorrowRequests]
  private auditLogs: AuditLog[] = []
  private currentUser: User | null = null
  private departments: Department[] = [...mockDepartments]
  private subDepartments: SubDepartment[] = [...mockSubDepartments]

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

  getUserById(id: string): User | undefined {
    return this.users.find((user) => user.id === id)
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email)
  }

  addUser(user: Omit<User, "id" | "createdAt" | "passwordHash">): User {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
      passwordHash: "", // Will be set separately
    }
    this.users.push(newUser)
    this.addAuditLog("user", newUser.id, "user_created", { user: newUser })
    return newUser
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex((user) => user.id === id)
    if (index === -1) return null

    const updatedUser = {
      ...this.users[index],
      ...updates,
    }
    this.users[index] = updatedUser
    this.addAuditLog("user", id, "user_updated", { updates })
    return updatedUser
  }

  deleteUser(id: string): boolean {
    const index = this.users.findIndex((user) => user.id === id)
    if (index === -1) return false

    this.users.splice(index, 1)
    this.addAuditLog("user", id, "user_deleted", {})
    return true
  }

  getUsersByDepartment(departmentId: string): User[] {
    return this.users.filter((user) => user.departmentId === departmentId)
  }

  getUsersBySubDepartment(subDepartmentId: string): User[] {
    return this.users.filter((user) => user.subDepartmentId === subDepartmentId)
  }

  // Password management
  setUserPassword(userId: string, password: string): boolean {
    const user = this.users.find((u) => u.id === userId)
    if (!user) return false

    user.passwordHash = hashPassword(password)
    this.addAuditLog("user", userId, "password_changed", {})
    return true
  }

  getUserPasswordHash(userId: string): string | undefined {
    const user = this.users.find((u) => u.id === userId)
    return user?.passwordHash
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

  // Department management
  async loadDepartmentsFromSupabase(): Promise<void> {
    try {
      const { data: departments, error: deptError } = await supabase.from("departments").select("*")

      if (deptError) throw deptError

      if (departments) {
        this.departments = departments.map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          description: dept.description,
          createdAt: new Date(dept.created_at),
          updatedAt: new Date(dept.updated_at),
        }))
      }

      const { data: subDepts, error: subDeptError } = await supabase.from("sub_departments").select("*")

      if (subDeptError) throw subDeptError

      if (subDepts) {
        this.subDepartments = subDepts.map((subdept: any) => ({
          id: subdept.id,
          name: subdept.name,
          departmentId: subdept.department_id,
          description: subdept.description,
          createdAt: new Date(subdept.created_at),
          updatedAt: new Date(subdept.updated_at),
        }))
      }
    } catch (error) {
      console.error("[v0] Error loading departments from Supabase:", error)
    }
  }

  getDepartments(): Department[] {
    return [...this.departments]
  }

  getDepartmentById(id: string): Department | undefined {
    return this.departments.find((dept) => dept.id === id)
  }

  async addDepartment(department: Omit<Department, "id" | "createdAt" | "updatedAt">): Promise<Department> {
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert([
          {
            name: department.name,
            description: department.description,
          },
        ])
        .select()

      if (error) throw error

      if (data && data[0]) {
        const newDepartment: Department = {
          id: data[0].id,
          name: data[0].name,
          description: data[0].description,
          createdAt: new Date(data[0].created_at),
          updatedAt: new Date(data[0].updated_at),
        }
        this.departments.push(newDepartment)
        this.addAuditLog("user", newDepartment.id, "department_created", { department: newDepartment })
        return newDepartment
      }
    } catch (error) {
      console.error("[v0] Error adding department:", error)
    }

    // Fallback to local storage
    const newDepartment: Department = {
      ...department,
      id: `dept-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.departments.push(newDepartment)
    this.addAuditLog("user", newDepartment.id, "department_created", { department: newDepartment })
    return newDepartment
  }

  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department | null> {
    const index = this.departments.findIndex((dept) => dept.id === id)
    if (index === -1) return null

    const updatedDepartment = {
      ...this.departments[index],
      ...updates,
      updatedAt: new Date(),
    }
    this.departments[index] = updatedDepartment
    this.addAuditLog("user", id, "department_updated", { updates })
    return updatedDepartment
  }

  async deleteDepartment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("departments").delete().eq("id", id)

      if (error) throw error

      const index = this.departments.findIndex((dept) => dept.id === id)
      if (index !== -1) {
        this.departments.splice(index, 1)
        this.subDepartments = this.subDepartments.filter((subdept) => subdept.departmentId !== id)
        this.addAuditLog("user", id, "department_deleted", {})
        return true
      }
    } catch (error) {
      console.error("[v0] Error deleting department:", error)
    }

    return false
  }

  // SubDepartment management
  getSubDepartments(departmentId?: string): SubDepartment[] {
    if (departmentId) {
      return this.subDepartments.filter((subdept) => subdept.departmentId === departmentId)
    }
    return [...this.subDepartments]
  }

  getSubDepartmentById(id: string): SubDepartment | undefined {
    return this.subDepartments.find((subdept) => subdept.id === id)
  }

  async addSubDepartment(subDepartment: Omit<SubDepartment, "id" | "createdAt" | "updatedAt">): Promise<SubDepartment> {
    try {
      const { data, error } = await supabase
        .from("sub_departments")
        .insert([
          {
            name: subDepartment.name,
            department_id: subDepartment.departmentId,
            description: subDepartment.description,
          },
        ])
        .select()

      if (error) throw error

      if (data && data[0]) {
        const newSubDepartment: SubDepartment = {
          id: data[0].id,
          name: data[0].name,
          departmentId: data[0].department_id,
          description: data[0].description,
          createdAt: new Date(data[0].created_at),
          updatedAt: new Date(data[0].updated_at),
        }
        this.subDepartments.push(newSubDepartment)
        this.addAuditLog("user", newSubDepartment.id, "subdepartment_created", { subDepartment: newSubDepartment })
        return newSubDepartment
      }
    } catch (error) {
      console.error("[v0] Error adding sub-department:", error)
    }

    // Fallback to local storage
    const newSubDepartment: SubDepartment = {
      ...subDepartment,
      id: `subdept-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.subDepartments.push(newSubDepartment)
    this.addAuditLog("user", newSubDepartment.id, "subdepartment_created", { subDepartment: newSubDepartment })
    return newSubDepartment
  }

  async updateSubDepartment(id: string, updates: Partial<SubDepartment>): Promise<SubDepartment | null> {
    const index = this.subDepartments.findIndex((subdept) => subdept.id === id)
    if (index === -1) return null

    const updatedSubDepartment = {
      ...this.subDepartments[index],
      ...updates,
      updatedAt: new Date(),
    }
    this.subDepartments[index] = updatedSubDepartment
    this.addAuditLog("user", id, "subdepartment_updated", { updates })
    return updatedSubDepartment
  }

  async deleteSubDepartment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("sub_departments").delete().eq("id", id)

      if (error) throw error

      const index = this.subDepartments.findIndex((subdept) => subdept.id === id)
      if (index !== -1) {
        this.subDepartments.splice(index, 1)
        this.addAuditLog("user", id, "subdepartment_deleted", {})
        return true
      }
    } catch (error) {
      console.error("[v0] Error deleting sub-department:", error)
    }

    return false
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
