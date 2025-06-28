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
      <div className="container mx-auto px-4 py-8">
        <OrganizationDetail organizationId={params.id} />
      </div>
    </AuthGuard>
  )
}