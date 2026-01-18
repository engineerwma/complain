"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading
    
    // If no session and not on auth page, redirect to sign in
    if (!session && window.location.pathname !== "/auth/signin") {
      router.push("/auth/signin")
    }
    
    // If session exists and on auth page, redirect to dashboard
    if (session && window.location.pathname === "/auth/signin") {
      router.push("/dashboard")
    }
  }, [session, status, router])

  return <>{children}</>
}