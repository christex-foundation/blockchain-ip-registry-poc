'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivyAuth } from './use-privy-auth'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/auth/login' }: AuthGuardProps) {
  const router = useRouter()
  const { ready, authenticated } = usePrivyAuth()

  useEffect(() => {
    if (ready && !authenticated) {
      router.push(redirectTo)
    }
  }, [ready, authenticated, router, redirectTo])

  // Show loading while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting unauthenticated users
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Render children for authenticated users
  return <>{children}</>
} 
