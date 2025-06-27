'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Users, Plus, ExternalLink, Calendar, TrendingUp, BarChart3 } from 'lucide-react'
import { CreateOrganizationDialog } from './create-organization-dialog'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  collection_address: string | null
  created_at: string | null
  updated_at: string | null
}

export function OrganizationList() {
  const { getAccessToken } = usePrivy()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const token = await getAccessToken()
      if (!token) return

      const response = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }

      const data = await response.json()
      setOrganizations(data.organizations || [])
    } catch (err) {
      console.error('Error fetching organizations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleOrganizationCreated = (newOrganization: Organization) => {
    setOrganizations(prev => [newOrganization, ...prev])
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-2">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="lg:justify-self-end">
            <Skeleton className="h-12 w-44" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-soft">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-2">
            <h1 className="text-4xl font-bold text-balance text-[#202020] font-['Space_Grotesk']">Organizations</h1>
            <p className="text-gray-600 text-balance">
              Manage your organizations and their on-chain collections
            </p>
          </div>
          <div className="lg:justify-self-end">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="h-12 px-6 shadow-medium hover:shadow-strong transition-all duration-200"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Organization
            </Button>
          </div>
        </div>
        
        <Card className="shadow-soft border border-gray-200 bg-white">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[#202020] font-semibold">Unable to load organizations</h3>
                <p className="text-gray-600">Error: {error}</p>
              </div>
              <Button variant="outline" onClick={fetchOrganizations} className="bg-white border-gray-200 hover:border-[#7073d1] hover:bg-[#dcddff]/30 text-[#202020] hover:text-[#7073d1] shadow-soft hover:shadow-medium transition-all duration-200">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-2">
          <h1 className="text-4xl font-bold text-balance text-[#202020] font-['Space_Grotesk']">Organizations</h1>
          <p className="text-gray-600 text-balance">
            Manage your organizations and their on-chain collections for collaborative intellectual property works
          </p>
        </div>
        <div className="lg:justify-self-end">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="h-12 px-6 bg-[#7073d1] hover:bg-[#5c5fb3] text-white shadow-medium hover:shadow-strong transition-all duration-200 hover:-translate-y-0.5 border-0"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Organization
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {organizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-[#7073d1]/5 to-[#7073d1]/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#7073d1]/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#7073d1]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Organizations</p>
                  <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">{organizations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-[#dcddff]/30 to-[#dcddff]/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#dcddff]/60 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-[#7073d1]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Collections</p>
                  <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">
                    {organizations.filter(org => org.collection_address).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Setup</p>
                  <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">
                    {organizations.filter(org => !org.collection_address).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <Card className="shadow-soft border border-gray-200 bg-white">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6 max-w-md mx-auto">
              <div className="h-20 w-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#202020] font-['Space_Grotesk']">No organizations yet</h3>
                <p className="text-gray-600 text-balance">
                  Create your first organization to start managing intellectual property works as a collaborative group with on-chain verification.
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#7073d1] hover:bg-[#5c5fb3] text-white shadow-medium hover:shadow-strong transition-all duration-200 hover:-translate-y-0.5 border-0"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card 
              key={org.id} 
              className="group shadow-soft hover:shadow-medium transition-all duration-200 border border-gray-200 bg-white hover:scale-[1.02] hover:-translate-y-1"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-[#202020] group-hover:text-[#7073d1] transition-colors font-['Space_Grotesk'] font-semibold">
                      <Building2 className="h-5 w-5 text-[#7073d1]" />
                      {org.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      Created {new Date(org.created_at || '').toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {org.collection_address ? (
                    <Badge className="flex items-center gap-1 shadow-soft bg-[#7073d1]/10 text-[#7073d1] border-[#7073d1]/20 hover:bg-[#7073d1]/20">
                      <ExternalLink className="h-3 w-3" />
                      On-chain Active
                    </Badge>
                  ) : (
                    <Badge className="shadow-soft bg-gray-100 text-[#202020]/60 border-gray-200 hover:bg-gray-200">
                      Setting up...
                    </Badge>
                  )}
                </div>
                
                {/* Collection Address */}
                {org.collection_address && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Collection Address</p>
                    <div className="text-xs font-mono text-[#7073d1] bg-white px-2 py-1 rounded border">
                      {org.collection_address.slice(0, 12)}...{org.collection_address.slice(-12)}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button asChild size="sm" className="flex-1 bg-[#7073d1] hover:bg-[#5c5fb3] text-white shadow-soft hover:shadow-medium transition-all duration-200 border-0">
                    <Link href={`/organizations/${org.id}`}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage
                    </Link>
                  </Button>
                  {org.collection_address && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="bg-white border-gray-200 hover:border-[#7073d1] hover:bg-[#dcddff]/30 text-[#202020] hover:text-[#7073d1] shadow-soft hover:shadow-medium transition-all duration-200"
                    >
                      <Link
                        href={`https://core.metaplex.com/explorer/collection/${org.collection_address}?env=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleOrganizationCreated}
      />
    </div>
  )
}
