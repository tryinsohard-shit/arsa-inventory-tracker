"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit2, Plus, Mail, UserIcon, Key } from "lucide-react"
import { useUsers } from "@/hooks/use-users"
import { useDepartments } from "@/hooks/use-departments"
import { dataStore } from "@/lib/data-store"
import { generateTemporaryPassword } from "@/lib/password-utils"
import type { User } from "@/lib/types"

export function UserManagement() {
  const { users, isLoading, error, addUser, updateUser, deleteUser } = useUsers()
  const { departments, subDepartments: allSubDepartments } = useDepartments()
  const [isOpen, setIsOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [formData, setFormData] = useState<{
    email: string
    name: string
    role: "admin" | "manager" | "staff" | "viewer"
    departmentId: string
    subDepartmentId: string
    password: string
  }>({
    email: "",
    name: "",
    role: "staff",
    departmentId: "",
    subDepartmentId: "",
    password: "",
  })

  const subDepartments = allSubDepartments.filter((sd) => sd.departmentId === formData.departmentId)

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId || "",
        subDepartmentId: user.subDepartmentId || "",
        password: "",
      })
    } else {
      setEditingUser(null)
      setFormData({
        email: "",
        name: "",
        role: "staff",
        departmentId: "",
        subDepartmentId: "",
        password: generateTemporaryPassword(),
      })
    }
    setIsOpen(true)
  }

  const handleCloseDialog = () => {
    setIsOpen(false)
    setEditingUser(null)
    setFormData({
      email: "",
      name: "",
      role: "staff",
      departmentId: "",
      subDepartmentId: "",
      password: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.name || !formData.departmentId) {
      alert("Please fill in all required fields")
      return
    }

    if (!editingUser && !formData.password) {
      alert("Please set a password for the new user")
      return
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          departmentId: formData.departmentId,
          subDepartmentId: formData.subDepartmentId,
          department: departments.find((d) => d.id === formData.departmentId)?.name,
        })
      } else {
        const newUser = await addUser({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          departmentId: formData.departmentId,
          subDepartmentId: formData.subDepartmentId,
          department: departments.find((d) => d.id === formData.departmentId)?.name,
        })
        // Only set password if user was created successfully (has UUID, not temporary ID)
        if (newUser && !newUser.id.startsWith("user-")) {
          await dataStore.setUserPassword(newUser.id, formData.password)
        }
      }
      handleCloseDialog()
    } catch (err) {
      console.error("Error saving user:", err)
    }
  }

  const handlePasswordReset = async (userId: string) => {
    if (!newPassword) {
      alert("Please enter a new password")
      return
    }

    const success = await dataStore.setUserPassword(userId, newPassword)
    if (success) {
      alert("Password reset successfully!")
      setShowPasswordReset(null)
      setNewPassword("")
    } else {
      alert("Failed to reset password. Please try again.")
    }
  }

  const handleDelete = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId)
      } catch (err) {
        console.error("Error deleting user:", err)
      }
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "manager":
        return "bg-orange-100 text-orange-800"
      case "staff":
        return "bg-blue-100 text-blue-800"
      case "viewer":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">User Management</h2>
          <p className="text-muted-foreground">Create and manage user accounts by department</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update user information and department assignment"
                  : "Add a new user account and assign to a department"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="text"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData((prev) => ({ ...prev, password: generateTemporaryPassword() }))}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Department Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, departmentId: value, subDepartmentId: "" }))
                  }
                >
                  <SelectTrigger id="department">
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

              {subDepartments.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="subdepartment">Sub-Department</Label>
                  <Select
                    value={formData.subDepartmentId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, subDepartmentId: value }))}
                  >
                    <SelectTrigger id="subdepartment">
                      <SelectValue placeholder="Select sub-department (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {subDepartments.map((subdept) => (
                        <SelectItem key={subdept.id} value={subdept.id}>
                          {subdept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : editingUser ? "Update User" : "Create User"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1 bg-transparent">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No users yet. Create your first user account.</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => {
            const dept = departments.find((d) => d.id === user.departmentId)
            const subdept = subDepartments.find((s) => s.id === user.subDepartmentId)

            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </CardDescription>
                    </div>
                    <Badge className={getRoleColor(user.role)} variant="secondary">
                      {user.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Department</p>
                    <p className="text-sm font-medium">{dept?.name || "Unassigned"}</p>
                  </div>

                  {subdept && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Sub-Department</p>
                      <p className="text-sm font-medium">{subdept.name}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(user)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Dialog
                      open={showPasswordReset === user.id}
                      onOpenChange={(open) => setShowPasswordReset(open ? user.id : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 flex items-center gap-2 bg-transparent">
                          <Key className="h-3 w-3" />
                          Reset Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Password for {user.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                              id="new-password"
                              type="text"
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setNewPassword(generateTemporaryPassword())}
                          >
                            Generate Password
                          </Button>
                          <div className="flex gap-2">
                            <Button onClick={() => handlePasswordReset(user.id)} className="flex-1">
                              Reset Password
                            </Button>
                            <Button variant="outline" onClick={() => setShowPasswordReset(null)} className="flex-1">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="flex-1 flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
