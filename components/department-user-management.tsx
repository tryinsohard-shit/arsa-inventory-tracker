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
import { useAlertDialog } from "@/components/ui/alert-dialog"
import { dataStore } from "@/lib/data-store"
import { generateTemporaryPassword } from "@/lib/password-utils"
import type { User } from "@/lib/types"

interface DepartmentUserManagementProps {
  currentUser: User
}

export function DepartmentUserManagement({ currentUser }: DepartmentUserManagementProps) {
  const { alert: alertDialog, confirm: confirmDialog, success: successDialog } = useAlertDialog()
  const { users, addUser, updateUser, deleteUser } = useUsers()
  const { departments, subDepartments: allSubDepartments } = useDepartments()
  const [isOpen, setIsOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [formData, setFormData] = useState<{
    email: string
    name: string
    role: "staff" | "viewer"
    subDepartmentId: string
  }>({
    email: "",
    name: "",
    role: "staff",
    subDepartmentId: "",
  })

  const subDepartments = dataStore.getSubDepartments(currentUser.departmentId || "")

  // Manager can only see/manage staff and viewers in their department, NOT admins or other managers
  const departmentUsers = users.filter(
    (u) =>
      u.departmentId === currentUser.departmentId &&
      u.role !== "admin" &&
      u.role !== "manager",
  )

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email,
        name: user.name,
        role: user.role as "staff" | "viewer", // Manager can only edit staff/viewer
        subDepartmentId: user.subDepartmentId || "",
      })
    } else {
      setEditingUser(null)
      setFormData({
        email: "",
        name: "",
        role: "staff",
        subDepartmentId: "",
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
      subDepartmentId: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.name) {
      await alertDialog("Please fill in all required fields", "Missing Fields")
      return
    }

    try {
      const departmentName = departments.find((d) => d.id === currentUser.departmentId)?.name

      if (editingUser) {
        await updateUser(editingUser.id, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          departmentId: currentUser.departmentId || "",
          subDepartmentId: formData.subDepartmentId || undefined,
          department: departmentName,
        })
      } else {
        await addUser({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          departmentId: currentUser.departmentId || "",
          subDepartmentId: formData.subDepartmentId || undefined,
          department: departmentName,
        })
      }
      handleCloseDialog()
    } catch (err) {
      console.error("Error saving user:", err)
    }
  }

  const handlePasswordReset = async (userId: string) => {
    if (!newPassword) {
      await alertDialog("Please enter a new password", "Password Required")
      return
    }

    const success = await dataStore.setUserPassword(userId, newPassword)
    if (success) {
      await successDialog("Password reset successfully!", "Password Updated")
      setShowPasswordReset(null)
      setNewPassword("")
    } else {
      await alertDialog("Failed to reset password. Please try again.", "Error")
    }
  }

  const handleDelete = async (userId: string) => {
    const confirmed = await confirmDialog("Are you sure you want to delete this user?", "Delete User")
    if (confirmed) {
      try {
        await deleteUser(userId)
      } catch (err) {
        console.error("Error deleting user:", err)
      }
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "staff":
        return "bg-blue-100 text-blue-800"
      case "viewer":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const currentDept = departments.find((d) => d.id === currentUser.departmentId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Department Users</h2>
          <p className="text-muted-foreground">Manage users in {currentDept?.name}</p>
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
                  ? "Update user information for your department"
                  : `Add a new user account to ${currentDept?.name}`}
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
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
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
                <Button type="submit" disabled={false} className="flex-1">
                  {editingUser ? "Update User" : "Create User"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1 bg-transparent">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departmentUsers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No users in your department yet. Create your first user account.</p>
            </CardContent>
          </Card>
        ) : (
          departmentUsers.map((user) => {
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
                    <p className="text-sm font-medium">{currentDept?.name}</p>
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
