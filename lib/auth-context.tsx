"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import type { Database } from "./supabase/types"
import { createClient } from "./supabase/client"

type UserRow = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ user: User; error: null } | { user: null; error: string }>
  register: (name: string, email: string, password: string) => Promise<{ user: User; error: null } | { user: null; error: string }>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<Pick<User, "name" | "timezone">>) => Promise<User | null>
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single<UserRow>()
        
        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            timezone: userData.timezone,
            created_at: userData.created_at,
          })
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<{ user: User; error: null } | { user: null; error: string }> => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error.message || "Invalid email or password" }
    }

    if (!data.user) {
      return { user: null, error: "Invalid email or password" }
    }

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single<UserRow>()

    if (userData) {
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        timezone: userData.timezone,
        created_at: userData.created_at,
      }
      setUser(user)
      return { user, error: null }
    }

    return { user: null, error: "Failed to load user profile" }
  }

  const register = async (name: string, email: string, password: string): Promise<{ user: User; error: null } | { user: null; error: string }> => {
    const supabase = createClient()
    
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      // Parse Supabase auth errors
      if (authError.message.includes("already registered")) {
        return { user: null, error: "This email is already registered" }
      }
      if (authError.message.includes("invalid email")) {
        return { user: null, error: "Please enter a valid email address" }
      }
      if (authError.message.includes("password")) {
        return { user: null, error: "Password must be at least 6 characters" }
      }
      return { user: null, error: authError.message || "Registration failed" }
    }

    if (!authData.user) {
      return { user: null, error: "Failed to create account" }
    }

    // Create user profile in users table
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const { data: userData, error: profileError } = await (supabase
      .from("users")
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          timezone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ] as any)
      .select() as any)
      .single()

    if (profileError) {
      // Profile creation failed, clean up the auth account
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
      return { user: null, error: "Failed to create user profile" }
    }

    if (!userData) {
      return { user: null, error: "Failed to load user profile" }
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      timezone: userData.timezone,
      created_at: userData.created_at,
    }
    setUser(user)
    return { user, error: null }
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateProfile = async (updates: Partial<Pick<User, "name" | "timezone">>): Promise<User | null> => {
    if (!user) return null

    const supabase = createClient()
    const { data: userData, error } = await ((supabase
      .from("users") as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select() as any)
      .single()

    if (error || !userData) return null

    const updatedUser: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      timezone: userData.timezone,
      created_at: userData.created_at,
    }
    setUser(updatedUser)
    return updatedUser
  }

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    const supabase = createClient()

    // First verify the old password by trying to sign in (this validates the password)
    if (user) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      })

      if (verifyError) return false
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    return !error
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
