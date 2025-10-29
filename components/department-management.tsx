"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { useDepartments } from "@/hooks/use-departments"

export function DepartmentManagement() {
  const {
    departments,
    subDepartments,
    isLoading,
    addDepartment,
    deleteDepartment,
    addSubDepartment,
    deleteSubDepartment,
  } = useDepartments()
  const [expandedDept, setExpandedDept] = useState<string | null>(null)
  const [showAddDept, setShowAddDept] = useState(false)
  const [showAddSubDept, setShowAddSubDept] = useState<string | null>(null)
  const [newDeptName, setNewDeptName] = useState("")
  const [newDeptDesc, setNewDeptDesc] = useState("")
  const [newSubDeptName, setNewSubDeptName] = useState("")
  const [newSubDeptDesc, setNewSubDeptDesc] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return

    setIsSubmitting(true)
    try {
      await addDepartment({
        name: newDeptName,
        description: newDeptDesc,
      })
      setNewDeptName("")
      setNewDeptDesc("")
      setShowAddDept(false)
    } catch (error) {
      console.error("[v0] Error adding department:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSubDepartment = async (departmentId: string) => {
    if (!newSubDeptName.trim()) return

    setIsSubmitting(true)
    try {
      await addSubDepartment({
        name: newSubDeptName,
        departmentId,
        description: newSubDeptDesc,
      })
      setNewSubDeptName("")
      setNewSubDeptDesc("")
      setShowAddSubDept(null)
    } catch (error) {
      console.error("[v0] Error adding sub-department:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (confirm("Are you sure you want to delete this department and all its sub-departments?")) {
      setIsSubmitting(true)
      try {
        await deleteDepartment(id)
      } catch (error) {
        console.error("[v0] Error deleting department:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleDeleteSubDepartment = async (id: string) => {
    if (confirm("Are you sure you want to delete this sub-department?")) {
      setIsSubmitting(true)
      try {
        await deleteSubDepartment(id)
      } catch (error) {
        console.error("[v0] Error deleting sub-department:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const getDeptSubDepartments = (deptId: string) => {
    return subDepartments.filter((subdept) => subdept.departmentId === deptId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Department Management</h2>
        <p className="text-muted-foreground">Manage organizational departments and sub-departments</p>
      </div>

      {/* Add Department Section */}
      {showAddDept ? (
        <Card>
          <CardHeader>
            <CardTitle>Add New Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Department Name</label>
              <Input
                placeholder="e.g., Human Resources"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Department description"
                value={newDeptDesc}
                onChange={(e) => setNewDeptDesc(e.target.value)}
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddDepartment} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Department
              </Button>
              <Button variant="outline" onClick={() => setShowAddDept(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowAddDept(true)} className="flex items-center gap-2" disabled={isSubmitting}>
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      )}

      {/* Departments List */}
      <div className="space-y-3">
        {departments.map((dept) => {
          const deptSubDepts = getDeptSubDepartments(dept.id)
          const isExpanded = expandedDept === dept.id

          return (
            <Card key={dept.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                      className="p-0 h-auto"
                      disabled={isSubmitting}
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      {dept.description && <CardDescription className="text-sm">{dept.description}</CardDescription>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{deptSubDepts.length} sub-depts</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDepartment(dept.id)}
                      className="text-destructive hover:text-destructive"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Sub-departments */}
              {isExpanded && (
                <CardContent className="space-y-3 border-t pt-4">
                  {deptSubDepts.length > 0 && (
                    <div className="space-y-2">
                      {deptSubDepts.map((subdept) => (
                        <div key={subdept.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="ml-8">
                            <p className="font-medium text-sm">{subdept.name}</p>
                            {subdept.description && (
                              <p className="text-xs text-muted-foreground">{subdept.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubDepartment(subdept.id)}
                            className="text-destructive hover:text-destructive"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Sub-department */}
                  {showAddSubDept === dept.id ? (
                    <div className="space-y-3 p-3 bg-muted rounded-lg ml-8">
                      <Input
                        placeholder="Sub-department name"
                        value={newSubDeptName}
                        onChange={(e) => setNewSubDeptName(e.target.value)}
                        className="text-sm"
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Description"
                        value={newSubDeptDesc}
                        onChange={(e) => setNewSubDeptDesc(e.target.value)}
                        className="text-sm"
                        disabled={isSubmitting}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddSubDepartment(dept.id)}
                          disabled={isSubmitting}
                          className="text-xs"
                        >
                          {isSubmitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAddSubDept(null)}
                          disabled={isSubmitting}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddSubDept(dept.id)}
                      className="ml-8 flex items-center gap-2"
                      disabled={isSubmitting}
                    >
                      <Plus className="h-3 w-3" />
                      Add Sub-department
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
