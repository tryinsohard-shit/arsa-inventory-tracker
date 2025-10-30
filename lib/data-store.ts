import type { User, InventoryItem, BorrowRequest, AuditLog, DashboardStats, Department, SubDepartment } from "./types"
import { supabase } from "./supabase-client"
import { hashPassword } from "./password-utils"

class DataStore {
  private users: User[] = []
  private items: InventoryItem[] = []
  private requests: BorrowRequest[] = []
  private auditLogs: AuditLog[] = []
  private currentUser: User | null = null
  private departments: Department[] = []
  private subDepartments: SubDepartment[] = []

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

  async loadUsersFromSupabase(): Promise<void> {
    const { data: users, error } = await supabase.from("users").select("*")

    if (error) {
      console.error("[v0] Error loading users from Supabase:", error)
      throw new Error(`Failed to load users from database: ${error.message}`)
    }

    if (users) {
      this.users = users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.department_id,
        subDepartmentId: user.sub_department_id,
        passwordHash: user.password_hash,
        createdAt: new Date(user.created_at),
      }))
      console.log("[v0] Loaded", this.users.length, "users from Supabase")
    }
  }

  async addUser(user: Omit<User, "id" | "createdAt" | "passwordHash">): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email: user.email,
          name: user.name,
          role: user.role,
          department_id: user.departmentId,
          sub_department_id: user.subDepartmentId,
          is_active: true,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error adding user to Supabase:", error)
      throw new Error(`Failed to add user to database: ${error.message}`)
    }

    if (data && data[0]) {
      const newUser: User = {
        id: data[0].id,
        email: data[0].email,
        name: data[0].name,
        role: data[0].role,
        departmentId: data[0].department_id,
        subDepartmentId: data[0].sub_department_id,
        passwordHash: "",
        createdAt: new Date(data[0].created_at),
      }
      this.users.push(newUser)
      this.addAuditLog("user", newUser.id, "user_created", { user: newUser })
      return newUser
    }

    throw new Error("Failed to create user: No data returned from database")
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const supabaseUpdates: any = {}
    if (updates.email) supabaseUpdates.email = updates.email
    if (updates.name) supabaseUpdates.name = updates.name
    if (updates.role) supabaseUpdates.role = updates.role
    if (updates.departmentId !== undefined) supabaseUpdates.department_id = updates.departmentId
    if (updates.subDepartmentId !== undefined) supabaseUpdates.sub_department_id = updates.subDepartmentId

    const { error } = await supabase.from("users").update(supabaseUpdates).eq("id", id)

    if (error) {
      console.error("[v0] Error updating user in Supabase:", error)
      throw new Error(`Failed to update user in database: ${error.message}`)
    }

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

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting user from Supabase:", error)
      throw new Error(`Failed to delete user from database: ${error.message}`)
    }

    const index = this.users.findIndex((user) => user.id === id)
    if (index !== -1) {
      this.users.splice(index, 1)
      this.addAuditLog("user", id, "user_deleted", {})
    }
    return true
  }

  getUsersByDepartment(departmentId: string): User[] {
    return this.users.filter((user) => user.departmentId === departmentId)
  }

  getUsersBySubDepartment(subDepartmentId: string): User[] {
    return this.users.filter((user) => user.subDepartmentId === subDepartmentId)
  }

  // Password management
  async setUserPassword(userId: string, password: string): Promise<boolean> {
    try {
      const passwordHash = hashPassword(password)
      
      // Update in Supabase
      const { error } = await supabase
        .from("users")
        .update({ password_hash: passwordHash })
        .eq("id", userId)
      
      if (error) throw error
      
      // Update local memory
      const user = this.users.find((u) => u.id === userId)
      if (user) {
        user.passwordHash = passwordHash
      }
      
      this.addAuditLog("user", userId, "password_changed", {})
      return true
    } catch (error: any) {
      console.error("[v0] Error updating password:", error)
      console.error("[v0] Error details:", error.message || error)
      return false
    }
  }

  getUserPasswordHash(userId: string): string | undefined {
    const user = this.users.find((u) => u.id === userId)
    return user?.passwordHash
  }

  // Inventory management
  async loadInventoryFromSupabase(): Promise<void> {
    const { data: items, error } = await supabase.from("inventory_items").select("*")

    if (error) {
      console.error("[v0] Error loading inventory from Supabase:", error)
      throw new Error(`Failed to load inventory from database: ${error.message}`)
    }

    if (items) {
      this.items = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        serialNumber: item.serial_number,
        status: item.status,
        location: item.location,
        purchaseDate: item.purchase_date ? new Date(item.purchase_date) : undefined,
        value: item.value,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }))
      console.log("[v0] Loaded", this.items.length, "inventory items from Supabase")
    }
  }

  getItems(): InventoryItem[] {
    return [...this.items]
  }

  getItemById(id: string): InventoryItem | undefined {
    return this.items.find((item) => item.id === id)
  }

  async addItem(item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from("inventory_items")
      .insert([
        {
          name: item.name,
          description: item.description,
          category: item.category,
          serial_number: item.serialNumber,
          status: item.status,
          location: item.location,
          purchase_date: item.purchaseDate,
          value: item.value,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error adding inventory item to Supabase:", error)
      throw new Error(`Failed to add inventory item to database: ${error.message}`)
    }

    if (data && data[0]) {
      const newItem: InventoryItem = {
        id: data[0].id,
        name: data[0].name,
        description: data[0].description,
        category: data[0].category,
        serialNumber: data[0].serial_number,
        status: data[0].status,
        location: data[0].location,
        purchaseDate: data[0].purchase_date ? new Date(data[0].purchase_date) : undefined,
        value: data[0].value,
        createdAt: new Date(data[0].created_at),
        updatedAt: new Date(data[0].updated_at),
      }
      this.items.push(newItem)
      this.addAuditLog("item", newItem.id, "created", { item: newItem })
      return newItem
    }

    throw new Error("Failed to create inventory item: No data returned from database")
  }

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const supabaseUpdates: any = {}
    if (updates.name) supabaseUpdates.name = updates.name
    if (updates.description !== undefined) supabaseUpdates.description = updates.description
    if (updates.category) supabaseUpdates.category = updates.category
    if (updates.serialNumber !== undefined) supabaseUpdates.serial_number = updates.serialNumber
    if (updates.status) supabaseUpdates.status = updates.status
    if (updates.location !== undefined) supabaseUpdates.location = updates.location
    if (updates.purchaseDate !== undefined) supabaseUpdates.purchase_date = updates.purchaseDate
    if (updates.value !== undefined) supabaseUpdates.value = updates.value
    supabaseUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase.from("inventory_items").update(supabaseUpdates).eq("id", id)

    if (error) {
      console.error("[v0] Error updating inventory item in Supabase:", error)
      throw new Error(`Failed to update inventory item in database: ${error.message}`)
    }

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

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting inventory item from Supabase:", error)
      throw new Error(`Failed to delete inventory item from database: ${error.message}`)
    }

    const index = this.items.findIndex((item) => item.id === id)
    if (index !== -1) {
      this.items.splice(index, 1)
      this.addAuditLog("item", id, "deleted", {})
    }
    return true
  }

  // Borrow request management
  async loadBorrowRequestsFromSupabase(): Promise<void> {
    const { data: requests, error } = await supabase.from("borrow_requests").select("*")

    if (error) {
      console.error("[v0] Error loading borrow requests from Supabase:", error)
      throw new Error(`Failed to load borrow requests from database: ${error.message}`)
    }

    if (requests) {
      this.requests = requests.map((req: any) => ({
        id: req.id,
        itemId: req.item_id,
        userId: req.user_id,
        departmentId: req.department_id,
        subDepartmentId: req.sub_department_id,
        status: req.status,
        borrowDate: req.borrow_date ? new Date(req.borrow_date) : undefined,
        expectedReturnDate: new Date(req.expected_return_date),
        actualReturnDate: req.actual_return_date ? new Date(req.actual_return_date) : undefined,
        returnCondition: req.return_condition,
        purpose: req.purpose,
        notes: req.notes,
        createdAt: new Date(req.created_at),
        updatedAt: new Date(req.updated_at),
      }))
      console.log("[v0] Loaded", this.requests.length, "borrow requests from Supabase")
    }
  }

  getRequests(): BorrowRequest[] {
    return [...this.requests]
  }

  getRequestById(id: string): BorrowRequest | undefined {
    return this.requests.find((request) => request.id === id)
  }

  async addRequest(request: Omit<BorrowRequest, "id" | "createdAt" | "updatedAt">): Promise<BorrowRequest> {
    const { data, error } = await supabase
      .from("borrow_requests")
      .insert([
        {
          item_id: request.itemId,
          user_id: request.userId,
          department_id: request.departmentId,
          sub_department_id: request.subDepartmentId,
          status: request.status,
          borrow_date: request.borrowDate,
          expected_return_date: request.expectedReturnDate,
          actual_return_date: request.actualReturnDate,
          return_condition: request.returnCondition,
          purpose: request.purpose,
          notes: request.notes,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error adding borrow request to Supabase:", error)
      throw new Error(`Failed to add borrow request to database: ${error.message}`)
    }

    if (data && data[0]) {
      const newRequest: BorrowRequest = {
        id: data[0].id,
        itemId: data[0].item_id,
        userId: data[0].user_id,
        departmentId: data[0].department_id,
        subDepartmentId: data[0].sub_department_id,
        status: data[0].status,
        borrowDate: data[0].borrow_date ? new Date(data[0].borrow_date) : undefined,
        expectedReturnDate: new Date(data[0].expected_return_date),
        actualReturnDate: data[0].actual_return_date ? new Date(data[0].actual_return_date) : undefined,
        returnCondition: data[0].return_condition,
        purpose: data[0].purpose,
        notes: data[0].notes,
        createdAt: new Date(data[0].created_at),
        updatedAt: new Date(data[0].updated_at),
      }
      this.requests.push(newRequest)
      this.addAuditLog("request", newRequest.id, "created", { request: newRequest })
      return newRequest
    }

    throw new Error("Failed to create borrow request: No data returned from database")
  }

  async updateRequest(id: string, updates: Partial<BorrowRequest>): Promise<BorrowRequest | null> {
    const supabaseUpdates: any = {}
    if (updates.itemId) supabaseUpdates.item_id = updates.itemId
    if (updates.userId) supabaseUpdates.user_id = updates.userId
    if (updates.departmentId) supabaseUpdates.department_id = updates.departmentId
    if (updates.subDepartmentId !== undefined) supabaseUpdates.sub_department_id = updates.subDepartmentId
    if (updates.status) supabaseUpdates.status = updates.status
    if (updates.borrowDate !== undefined) supabaseUpdates.borrow_date = updates.borrowDate
    if (updates.expectedReturnDate) supabaseUpdates.expected_return_date = updates.expectedReturnDate
    if (updates.actualReturnDate !== undefined) supabaseUpdates.actual_return_date = updates.actualReturnDate
    if (updates.returnCondition !== undefined) supabaseUpdates.return_condition = updates.returnCondition
    if (updates.purpose !== undefined) supabaseUpdates.purpose = updates.purpose
    if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes
    supabaseUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase.from("borrow_requests").update(supabaseUpdates).eq("id", id)

    if (error) {
      console.error("[v0] Error updating borrow request in Supabase:", error)
      throw new Error(`Failed to update borrow request in database: ${error.message}`)
    }

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
      (request) => request.status === "borrowed" && new Date() > request.expectedReturnDate,
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
    const { data: departments, error: deptError } = await supabase.from("departments").select("*")

    if (deptError) {
      console.error("[v0] Error loading departments from Supabase:", deptError)
      throw new Error(`Failed to load departments from database: ${deptError.message}`)
    }

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

    if (subDeptError) {
      console.error("[v0] Error loading sub-departments from Supabase:", subDeptError)
      throw new Error(`Failed to load sub-departments from database: ${subDeptError.message}`)
    }

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
  }

  getDepartments(): Department[] {
    return [...this.departments]
  }

  getDepartmentById(id: string): Department | undefined {
    return this.departments.find((dept) => dept.id === id)
  }

  async addDepartment(department: Omit<Department, "id" | "createdAt" | "updatedAt">): Promise<Department> {
    const { data, error } = await supabase
      .from("departments")
      .insert([
        {
          name: department.name,
          description: department.description,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error adding department:", error)
      throw new Error(`Failed to add department to database: ${error.message}`)
    }

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

    throw new Error("Failed to create department: No data returned from database")
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

    if (error) {
      console.error("[v0] Error adding sub-department:", error)
      throw new Error(`Failed to add sub-department to database: ${error.message}`)
    }

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

    throw new Error("Failed to create sub-department: No data returned from database")
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
