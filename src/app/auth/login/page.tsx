'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { usePrivyAuth } from '@/components/privy/use-privy-auth'

export default function LoginPage() {
  const router = useRouter()
  const { ready, authenticated, login, user } = usePrivyAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (ready && authenticated && user) {
      toast.success('Already logged in! Redirecting to dashboard...')
      router.push('/dashboard')
    }
  }, [ready, authenticated, user, router])

  const handleLogin = async () => {
    try {
      await login()
      // The useEffect above will handle the redirect after successful login
    } catch (error) {
      console.error('Login failed:', error)
      toast.error('Login failed. Please try again.')
    }
  }

  // Don't render login form if already authenticated
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

  if (authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <span className="text-2xl font-bold">IP ONCHAIN</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground">
              Access your IP management dashboard
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="glass p-8 space-y-6">
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in with your email to access the platform. A Solana wallet will be automatically created for you.
            </p>
          </div>

          <Button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-lg font-medium glow"
          >
            Sign In with Privy
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>🔐 Secure authentication powered by Privy</p>
            <p>🔑 Wallet creation and signing abstracted</p>
          </div>
        </Card>

        {/* Features */}
        <div className="text-center text-xs text-muted-foreground space-y-2">
          <p>✅ Email/password authentication</p>
          <p>✅ Automatic Solana wallet creation</p>
          <p>✅ No manual wallet management required</p>
        </div>
      </div>
    </div>
  )
} 
