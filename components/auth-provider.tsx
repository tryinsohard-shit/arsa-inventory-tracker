"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@/lib/types"
import { dataStore } from "@/lib/data-store"
import { verifyPassword } from "@/lib/password-utils"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeData = async () => {
      // Check for stored session
      const storedUser = localStorage.getItem("inventory-user")
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          dataStore.setCurrentUser(userData)
          
          // Load all data from Supabase
          await Promise.all([
            dataStore.loadUsersFromSupabase().catch(console.error),
            dataStore.loadDepartmentsFromSupabase().catch(console.error),
            dataStore.loadInventoryFromSupabase().catch(console.error),
            dataStore.loadBorrowRequestsFromSupabase().catch(console.error),
          ])
        } catch (error) {
          localStorage.removeItem("inventory-user")
        }
      }
      setIsLoading(false)
    }
    
    initializeData()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    console.log("[v0] Login attempt:", { email })

    // Load all data from Supabase
    await Promise.all([
      dataStore.loadUsersFromSupabase(),
      dataStore.loadDepartmentsFromSupabase(),
      dataStore.loadInventoryFromSupabase(),
      dataStore.loadBorrowRequestsFromSupabase(),
    ])

    const users = dataStore.getUsers()
    console.log("[v0] Available users:", users)

    const foundUser = users.find((u) => u.email === email)
    console.log("[v0] Found user:", foundUser)

    if (foundUser && foundUser.passwordHash && verifyPassword(password, foundUser.passwordHash)) {
      console.log("[v0] Login successful")
      setUser(foundUser)
      dataStore.setCurrentUser(foundUser)
      localStorage.setItem("inventory-user", JSON.stringify(foundUser))
      setIsLoading(false)
      return true
    }

    console.log("[v0] Login failed - invalid credentials")
    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    dataStore.setCurrentUser(null as any)
    localStorage.removeItem("inventory-user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
