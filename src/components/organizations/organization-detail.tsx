'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Users,
  ExternalLink,
  Calendar,
  Hash,
  UserPlus,
  Crown,
  Shield,
  User,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import { AddMemberDialog } from './add-member-dialog'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  collection_address: string | null
  created_at: string | null
  updated_at: string | null
  members?: OrganizationMember[]
}

interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string | null
}

interface OnChainMember {
  userId: string
  role: string
  joined: string
  name: string
}

interface OrganizationDetailProps {
  organizationId: string
}

export function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const { getAccessToken } = usePrivy()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [onChainMembers, setOnChainMembers] = useState<OnChainMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)

  useEffect(() => {
    fetchOrganization()
    fetchMembers()
  }, [organizationId])

  const fetchOrganization = async () => {
    try {
      const token = await getAccessToken()
      if (!token) return

      const response = await fetch(`/api/organizations/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organization')
      }

      const data = await response.json()
      setOrganization(data.organization)
    } catch (err) {
      console.error('Error fetching organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const token = await getAccessToken()
      if (!token) return

      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }

      const data = await response.json()
      setOnChainMembers(data.onChainMembers || [])
    } catch (err) {
      console.error('Error fetching members:', err)
    }
  }

  const handleMemberAdded = () => {
    fetchMembers()
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-primary" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const
      case 'admin':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-12 w-80" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="lg:justify-self-end">
            <Skeleton className="h-12 w-36" />
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-soft">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-6 w-16 ml-auto" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm" className="shadow-soft">
            <Link href="/organizations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        
        <Card className="shadow-soft border-0">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4 max-w-md mx-auto">
              <div className="h-20 w-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <Building2 className="h-10 w-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="content-primary">Organization not found</h3>
                <p className="content-secondary">
                  {error || 'The organization you are looking for does not exist or you do not have access to it.'}
                </p>
              </div>
              <Button asChild variant="outline" className="bg-white shadow-soft border-gray-200 text-[#202020] hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                <Link href="/organizations">Back to Organizations</Link>
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
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm" className="bg-white shadow-soft border-gray-200 text-[#202020] hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
              <Link href="/organizations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-balance flex items-center gap-3 text-[#202020] font-['Space_Grotesk']">
            <Building2 className="h-10 w-10 text-[#7073d1]" />
            {organization.name}
          </h1>
          <p className="text-gray-600 text-balance">
            Comprehensive organization management with on-chain member verification and collaborative IP workflows
          </p>
        </div>
        <div className="lg:justify-self-end">
          <Button 
            onClick={() => setShowAddMemberDialog(true)}
            className="h-12 px-6 bg-[#7073d1] hover:bg-[#5c5fb3] text-white shadow-medium hover:shadow-strong transition-all duration-200 hover:-translate-y-0.5 border-0"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-[#7073d1]/5 to-[#7073d1]/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#7073d1]/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-[#7073d1]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">{onChainMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-[#dcddff]/30 to-[#dcddff]/40">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#dcddff]/60 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-[#7073d1]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Collection Status</p>
                <p className="text-lg font-semibold">
                  {organization.collection_address ? 'Active' : 'Setup'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Owners</p>
                <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">
                  {onChainMembers.filter(m => m.role === 'owner').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm font-semibold">
                  {new Date(organization.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Organization Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft border border-gray-200 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Organization Details
              </CardTitle>
              <CardDescription>
                Comprehensive information and on-chain verification status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Collection Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-medium">Collection Status</span>
                </div>
                
                {organization.collection_address ? (
                  <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="flex items-center gap-1 shadow-soft">
                        <ExternalLink className="h-3 w-3" />
                        On-chain Collection Active
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="content-tertiary">Collection Address</p>
                      <div className="p-3 bg-background/80 rounded-lg border">
                        <p className="text-sm font-mono text-primary break-all">
                          {organization.collection_address}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="bg-white shadow-soft border-gray-200 text-[#202020] hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                      <Link
                        href={`https://core.metaplex.com/explorer/collection/${organization.collection_address}?env=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Solana Explorer
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="shadow-soft">
                        <Clock className="h-3 w-3 mr-1" />
                        Setting up collection...
                      </Badge>
                    </div>
                    <p className="content-secondary text-sm">
                      Your on-chain collection is being initialized. This process may take a few minutes.
                    </p>
                  </div>
                )}
              </div>

              {/* Creation Info */}
              <Separator />
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="content-tertiary">Organization Created</p>
                  <p className="font-medium">
                    {new Date(organization.created_at || '').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members Panel */}
        <Card className="shadow-soft border border-gray-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({onChainMembers.length})
            </CardTitle>
            <CardDescription>
              Organization members with roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onChainMembers.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="h-16 w-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">No members yet</h4>
                  <p className="content-secondary text-sm text-balance">
                    Add members to start collaborating on intellectual property works.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {onChainMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="group p-4 border rounded-lg hover:shadow-soft transition-all duration-200 hover:border-primary/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-primary/10 to-accent/20 rounded-full flex items-center justify-center">
                          {getRoleIcon(member.role)}
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">
                            {member.name}
                          </p>
                          <p className="content-tertiary text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Joined {new Date(parseInt(member.joined)).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={getRoleBadgeVariant(member.role)} 
                        className="shadow-soft"
                      >
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddMemberDialog
        open={showAddMemberDialog}
        onOpenChange={setShowAddMemberDialog}
        organizationId={organizationId}
        onSuccess={handleMemberAdded}
      />
    </div>
  )
}
