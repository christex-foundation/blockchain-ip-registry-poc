'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { usePrivyAuth } from '@/components/privy/use-privy-auth'
import { Shield, Zap, Mail } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary mx-auto"></div>
          <p className="content-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary mx-auto"></div>
          <p className="content-secondary">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center px-12 bg-gradient-to-br from-primary/5 to-accent/20">
          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-soft">
                  <div className="w-5 h-5 bg-white rounded-sm"></div>
                </div>
                <span className="text-2xl font-semibold text-foreground">IP OnChain</span>
              </div>
              <h1 className="text-4xl font-bold text-foreground leading-tight">
                Secure Your
                <br />
                <span className="text-primary">Creative Assets</span>
              </h1>
              <p className="content-secondary text-lg">
                Blockchain-powered intellectual property management with automated royalty distribution.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Immutable Ownership</h3>
                  <p className="content-tertiary">Blockchain-verified proof of creation and ownership</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Automated Royalties</h3>
                  <p className="content-tertiary">Instant distribution to all contributors</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Header */}
            <div className="lg:hidden text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-soft">
                  <div className="w-5 h-5 bg-white rounded-sm"></div>
                </div>
                <span className="text-2xl font-semibold text-foreground">IP OnChain</span>
              </div>
            </div>

            {/* Login Header */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
              <p className="content-secondary">
                Sign in to access your IP management dashboard
              </p>
            </div>

            {/* Login Card */}
            <Card className="p-8 shadow-medium border border-border bg-card">
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <p className="content-secondary">
                    Sign in with your email. A Solana wallet will be automatically created for you.
                  </p>
                </div>

                <Button 
                  onClick={handleLogin}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 font-medium rounded-lg shadow-soft transition-all duration-200"
                >
                  Sign In with Email
                </Button>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="content-tertiary">Secure Auth</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="content-tertiary">Auto Wallet</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Footer */}
            <div className="text-center">
              <p className="content-tertiary">
                Powered by <span className="font-semibold text-primary">Privy</span> • 
                Secured by <span className="font-semibold text-primary">Solana</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
