"use client"

import { useState, useCallback } from "react"
import { dataStore } from "@/lib/data-store"
import type { User } from "@/lib/types"

export function useUsers() {
  const [users, setUsers] = useState<User[]>(dataStore.getUsers())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshUsers = useCallback(() => {
    setUsers(dataStore.getUsers())
  }, [])

  const addUser = useCallback(
    async (user: Omit<User, "id" | "createdAt">) => {
      setIsLoading(true)
      setError(null)
      try {
        // Check if email already exists
        if (dataStore.getUserByEmail(user.email)) {
          throw new Error("Email already exists")
        }

        const newUser = dataStore.addUser(user)
        refreshUsers()
        return newUser
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add user"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUsers],
  )

  const updateUser = useCallback(
    async (id: string, updates: Partial<User>) => {
      setIsLoading(true)
      setError(null)
      try {
        const updatedUser = dataStore.updateUser(id, updates)
        if (!updatedUser) {
          throw new Error("User not found")
        }
        refreshUsers()
        return updatedUser
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update user"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUsers],
  )

  const deleteUser = useCallback(
    async (id: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const success = dataStore.deleteUser(id)
        if (!success) {
          throw new Error("User not found")
        }
        refreshUsers()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete user"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [refreshUsers],
  )

  const getUsersByDepartment = useCallback((departmentId: string) => {
    return dataStore.getUsersByDepartment(departmentId)
  }, [])

  const getUsersBySubDepartment = useCallback((subDepartmentId: string) => {
    return dataStore.getUsersBySubDepartment(subDepartmentId)
  }, [])

  return {
    users,
    isLoading,
    error,
    addUser,
    updateUser,
    deleteUser,
    refreshUsers,
    getUsersByDepartment,
    getUsersBySubDepartment,
  }
}
