"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ClipboardList, BarChart3, Search, LogOut, Users } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "@/components/auth-provider"
import { LoginForm } from "@/components/login-form"
import { InventoryView } from "@/components/inventory-view"
import { RequestsView } from "@/components/requests-view"
import { AdminDashboard } from "@/components/admin-dashboard"
import { ReportsView } from "@/components/reports-view"
import { DepartmentManagement } from "@/components/department-management"
import { UserManagement } from "@/components/user-management"
import { DepartmentUserManagement } from "@/components/department-user-management"

export default function HomePage() {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "inventory" | "requests" | "reports" | "departments" | "users" | "dept-users"
  >("dashboard")
  const { user: currentUser, logout, isLoading } = useAuth()
  const stats = dataStore.getDashboardStats()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Indomaret Themed */}
      <header className="border-b bg-primary shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg p-1.5 shadow-sm">
                <img src="/logo-indomaret.png" alt="Indomaret" className="h-8 w-auto" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">Indomaret Inventory</h1>
                <p className="text-sm text-primary-foreground/80">Asset & Loan Management System</p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="capitalize bg-accent text-accent-foreground hover:bg-accent/90">
                {currentUser.role}
              </Badge>
              <div className="text-right text-primary-foreground">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs opacity-80">{currentUser.department}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout} 
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-primary-foreground border-primary-foreground/30"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={currentView === "dashboard" ? "default" : "outline"}
              onClick={() => setCurrentView("dashboard")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={currentView === "inventory" ? "default" : "outline"}
              onClick={() => setCurrentView("inventory")}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Inventory
            </Button>
            <Button
              variant={currentView === "requests" ? "default" : "outline"}
              onClick={() => setCurrentView("requests")}
              className="flex items-center gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              Requests
            </Button>
            {currentUser.role === "manager" && (
              <Button
                variant={currentView === "dept-users" ? "default" : "outline"}
                onClick={() => setCurrentView("dept-users")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Department Users
              </Button>
            )}
            {currentUser.role === "admin" && (
              <>
                <Button
                  variant={currentView === "reports" ? "default" : "outline"}
                  onClick={() => setCurrentView("reports")}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </Button>
                <Button
                  variant={currentView === "departments" ? "default" : "outline"}
                  onClick={() => setCurrentView("departments")}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Departments
                </Button>
                <Button
                  variant={currentView === "users" ? "default" : "outline"}
                  onClick={() => setCurrentView("users")}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Users
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Views */}
        {currentView === "dashboard" && (
          <>
            {currentUser.role === "admin" ? (
              <AdminDashboard />
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
                  <p className="text-muted-foreground">Overview of your inventory system</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{stats.totalItems}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.availableItems}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Borrowed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{stats.borrowedItems}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{stats.overdueItems}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => setCurrentView("inventory")} className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Browse Inventory
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentView("requests")}
                        className="flex items-center gap-2"
                      >
                        <ClipboardList className="h-4 w-4" />
                        My Requests
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {currentView === "inventory" && <InventoryView />}
        {currentView === "requests" && <RequestsView />}
        {currentView === "reports" && <ReportsView />}
        {currentView === "departments" && currentUser.role === "admin" && <DepartmentManagement />}
        {currentView === "users" && currentUser.role === "admin" && <UserManagement />}
        {currentView === "dept-users" && currentUser.role === "manager" && (
          <DepartmentUserManagement currentUser={currentUser} />
        )}
      </div>
    </div>
  )
}
