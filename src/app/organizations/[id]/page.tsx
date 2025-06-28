'use client'

import { OrganizationDetail } from '@/components/organizations'
import { AuthGuard } from '@/components/privy/auth-guard'

interface OrganizationPageProps {
  params: {
    id: string
  }
}

export default function OrganizationPage({ params }: OrganizationPageProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <OrganizationDetail organizationId={params.id} />
        </div>
      </div>
    </AuthGuard>
  )
}