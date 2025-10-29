"use client"

import { useEffect, useState } from "react"
import { dataStore } from "@/lib/data-store"
import type { Department, SubDepartment } from "@/lib/types"

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDepartments = async () => {
      setIsLoading(true)
      await dataStore.loadDepartmentsFromSupabase()
      setDepartments(dataStore.getDepartments())
      setSubDepartments(dataStore.getSubDepartments())
      setIsLoading(false)
    }

    loadDepartments()
  }, [])

  const addDepartment = async (department: Omit<Department, "id" | "createdAt" | "updatedAt">) => {
    const newDept = await dataStore.addDepartment(department)
    setDepartments(dataStore.getDepartments())
    return newDept
  }

  const deleteDepartment = async (id: string) => {
    const success = await dataStore.deleteDepartment(id)
    if (success) {
      setDepartments(dataStore.getDepartments())
      setSubDepartments(dataStore.getSubDepartments())
    }
    return success
  }

  const addSubDepartment = async (subDepartment: Omit<SubDepartment, "id" | "createdAt" | "updatedAt">) => {
    const newSubDept = await dataStore.addSubDepartment(subDepartment)
    setSubDepartments(dataStore.getSubDepartments())
    return newSubDept
  }

  const deleteSubDepartment = async (id: string) => {
    const success = await dataStore.deleteSubDepartment(id)
    if (success) {
      setSubDepartments(dataStore.getSubDepartments())
    }
    return success
  }

  return {
    departments,
    subDepartments,
    isLoading,
    addDepartment,
    deleteDepartment,
    addSubDepartment,
    deleteSubDepartment,
  }
}
