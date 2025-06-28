'use client'

import { OrganizationList } from '@/components/organizations'
import { AuthGuard } from '@/components/privy/auth-guard'

export default function OrganizationsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <OrganizationList />
        </div>
      </div>
    </AuthGuard>
  )
}