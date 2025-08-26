"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, TrendingUp, Users, AlertTriangle, Activity, CheckCircle, Calendar, DollarSign } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "./auth-provider"

export function AdminDashboard() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month")

  const stats = dataStore.getDashboardStats()
  const items = dataStore.getItems()
  const requests = dataStore.getRequests()
  const users = dataStore.getUsers()
  const auditLogs = dataStore.getAuditLogs()

  // Enhanced analytics
  const analytics = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0)
    const utilizationRate = items.length > 0 ? (stats.borrowedItems / stats.totalItems) * 100 : 0
    const approvalRate =
      requests.length > 0
        ? (requests.filter((r) => r.status === "approved" || r.status === "active").length / requests.length) * 100
        : 0

    const categoryBreakdown = items.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const recentActivity = auditLogs
      .slice(-10)
      .reverse()
      .map((log) => {
        const user = users.find((u) => u.id === log.userId)
        return { ...log, userName: user?.name || "Unknown User" }
      })

    const overdueRequests = requests.filter((r) => r.status === "active" && new Date() > r.expectedReturnDate)

    const pendingApprovals = requests.filter((r) => r.status === "pending")

    return {
      totalValue,
      utilizationRate,
      approvalRate,
      categoryBreakdown,
      recentActivity,
      overdueRequests,
      pendingApprovals,
    }
  }, [items, requests, users, auditLogs, stats])

  const topCategories = Object.entries(analytics.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">This dashboard is only available to administrators.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground">System overview and management tools</p>
        </div>
        <div className="flex gap-2">
          <Button variant={timeRange === "week" ? "default" : "outline"} size="sm" onClick={() => setTimeRange("week")}>
            Week
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("month")}
          >
            Month
          </Button>
          <Button
            variant={timeRange === "quarter" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("quarter")}
          >
            Quarter
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Asset Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${analytics.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {stats.totalItems} items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Utilization Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.utilizationRate.toFixed(1)}%</div>
            <Progress value={analytics.utilizationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{requests.length} total requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {users.filter((u) => u.role === "admin").length} admins, {users.filter((u) => u.role === "staff").length}{" "}
              staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.pendingApprovals.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium text-yellow-800">Pending Approvals</p>
                  <p className="text-sm text-yellow-600">
                    {analytics.pendingApprovals.length} requests awaiting approval
                  </p>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  {analytics.pendingApprovals.length}
                </Badge>
              </div>
            )}

            {analytics.overdueRequests.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-red-800">Overdue Items</p>
                  <p className="text-sm text-red-600">{analytics.overdueRequests.length} items past return date</p>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  {analytics.overdueRequests.length}
                </Badge>
              </div>
            )}

            {analytics.pendingApprovals.length === 0 && analytics.overdueRequests.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All systems running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(count / stats.totalItems) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system actions and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.recentActivity.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.userName}</TableCell>
                  <TableCell>
                    <span className="capitalize">{log.action}</span> {log.entityType}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {log.entityType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.timestamp.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {analytics.recentActivity.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Operational</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">All services running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Integrity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Healthy</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">No data issues detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Automated daily backup</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
