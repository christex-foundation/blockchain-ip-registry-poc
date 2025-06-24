'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const handleEmailLogin = () => {
    // TODO: Implement Privy email/password login
    console.log('Privy login will be implemented here')
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
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <Button 
            onClick={handleEmailLogin}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-lg font-medium glow"
          >
            Sign In
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Secure authentication powered by Privy
          </div>
        </Card>

        {/* Development Notice */}
        <div className="text-center text-xs text-muted-foreground">
          <p>🚧 Development Mode</p>
          <p>Privy integration will be implemented in Week 1</p>
        </div>
      </div>
    </div>
  )
} 
