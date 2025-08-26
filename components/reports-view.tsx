"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Download,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  PieChart,
} from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "./auth-provider"

type ReportType = "inventory" | "usage" | "financial" | "activity"
type DateRange = "week" | "month" | "quarter" | "year"

export function ReportsView() {
  const { user } = useAuth()
  const [reportType, setReportType] = useState<ReportType>("inventory")
  const [dateRange, setDateRange] = useState<DateRange>("month")

  const items = dataStore.getItems()
  const requests = dataStore.getRequests()
  const users = dataStore.getUsers()
  const auditLogs = dataStore.getAuditLogs()

  const reportData = useMemo(() => {
    const now = new Date()
    const startDate = new Date()

    switch (dateRange) {
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const filteredRequests = requests.filter((r) => r.createdAt >= startDate)
    const filteredLogs = auditLogs.filter((l) => l.timestamp >= startDate)

    // Inventory Report Data
    const categoryStats = items.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { total: 0, available: 0, borrowed: 0, value: 0 }
        }
        acc[item.category].total++
        if (item.status === "available") acc[item.category].available++
        if (item.status === "borrowed") acc[item.category].borrowed++
        acc[item.category].value += item.purchasePrice || 0
        return acc
      },
      {} as Record<string, { total: number; available: number; borrowed: number; value: number }>,
    )

    const conditionStats = items.reduce(
      (acc, item) => {
        acc[item.condition] = (acc[item.condition] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Usage Report Data
    const borrowingTrends = filteredRequests.reduce(
      (acc, request) => {
        const month = request.createdAt.toLocaleString("default", { month: "short" })
        acc[month] = (acc[month] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topBorrowers = users
      .map((user) => ({
        ...user,
        borrowCount: filteredRequests.filter((r) => r.borrowerId === user.id).length,
      }))
      .filter((u) => u.borrowCount > 0)
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10)

    const mostBorrowedItems = items
      .map((item) => ({
        ...item,
        borrowCount: filteredRequests.filter((r) => r.itemId === item.id).length,
      }))
      .filter((i) => i.borrowCount > 0)
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10)

    // Financial Report Data
    const totalAssetValue = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0)
    const categoryValues = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      value: stats.value,
      percentage: totalAssetValue > 0 ? (stats.value / totalAssetValue) * 100 : 0,
    }))

    // Activity Report Data
    const activityByType = filteredLogs.reduce(
      (acc, log) => {
        const key = `${log.action}_${log.entityType}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const userActivity = users
      .map((user) => ({
        ...user,
        activityCount: filteredLogs.filter((l) => l.userId === user.id).length,
      }))
      .filter((u) => u.activityCount > 0)
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 10)

    return {
      categoryStats,
      conditionStats,
      borrowingTrends,
      topBorrowers,
      mostBorrowedItems,
      totalAssetValue,
      categoryValues,
      activityByType,
      userActivity,
      filteredRequests,
      filteredLogs,
    }
  }, [items, requests, users, auditLogs, dateRange])

  const handleExport = (format: "csv" | "pdf") => {
    // Simulate export functionality
    const filename = `${reportType}_report_${dateRange}.${format}`
    alert(
      `Exporting ${filename}...\n\nIn a real application, this would generate and download the ${format.toUpperCase()} file.`,
    )
  }

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">Reports are only available to administrators.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground">Comprehensive analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory Analysis</SelectItem>
                  <SelectItem value="usage">Usage & Trends</SelectItem>
                  <SelectItem value="financial">Financial Overview</SelectItem>
                  <SelectItem value="activity">User Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Report */}
      {reportType === "inventory" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(reportData.categoryStats).map(([category, stats]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category}</span>
                        <Badge variant="outline">{stats.total} items</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available:</span>
                          <span className="text-green-600">{stats.available}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Borrowed:</span>
                          <span className="text-blue-600">{stats.borrowed}</span>
                        </div>
                      </div>
                      <Progress value={(stats.borrowed / stats.total) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Item Condition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.conditionStats).map(([condition, count]) => (
                    <div key={condition} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{condition}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(count / items.length) * 100}%`,
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
        </div>
      )}

      {/* Usage Report */}
      {reportType === "usage" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Borrowers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topBorrowers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell className="text-right">{user.borrowCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Most Borrowed Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Times Borrowed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.mostBorrowedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.borrowCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Financial Report */}
      {reportType === "financial" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Asset Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">${reportData.totalAssetValue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Item Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${items.length > 0 ? Math.round(reportData.totalAssetValue / items.length).toLocaleString() : 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{reportData.categoryValues.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Value by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.categoryValues
                  .sort((a, b) => b.value - a.value)
                  .map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-sm text-muted-foreground">${cat.value.toLocaleString()}</span>
                      </div>
                      <Progress value={cat.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">{cat.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Report */}
      {reportType === "activity" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{reportData.filteredLogs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{reportData.userActivity.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{reportData.filteredRequests.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Daily Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(
                    reportData.filteredLogs.length /
                      (dateRange === "week" ? 7 : dateRange === "month" ? 30 : dateRange === "quarter" ? 90 : 365),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Most Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Activities</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.userActivity.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell className="text-right">{user.activityCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
