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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary mx-auto"></div>
          <p className="content-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting unauthenticated users
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary mx-auto"></div>
          <p className="content-secondary">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Render children for authenticated users
  return <>{children}</>
} 
