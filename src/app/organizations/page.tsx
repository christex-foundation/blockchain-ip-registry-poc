'use client'

import { OrganizationList } from '@/components/organizations'
import { AuthGuard } from '@/components/privy/auth-guard'

export default function OrganizationsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <OrganizationList />
      </div>
    </AuthGuard>
  )
}