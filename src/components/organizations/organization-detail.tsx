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
        return <Shield className="h-4 w-4 text-blue-500" />
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
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
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive">
              {error || 'Organization not found'}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/organizations">Back to Organizations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {organization.name}
          </h1>
          <p className="text-muted-foreground">
            Organization details and member management
          </p>
        </div>
        <Button onClick={() => setShowAddMemberDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Basic information and on-chain status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Created {new Date(organization.created_at || '').toLocaleDateString()}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Collection Status</span>
              </div>
              {organization.collection_address ? (
                <div className="space-y-2">
                  <Badge variant="default" className="flex items-center gap-1 w-fit">
                    <ExternalLink className="h-3 w-3" />
                    On-chain Collection Active
                  </Badge>
                  <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                    {organization.collection_address}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-fit"
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
                <Badge variant="secondary">Setting up collection...</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({onChainMembers.length})
            </CardTitle>
            <CardDescription>
              Organization members with their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onChainMembers.length === 0 ? (
              <div className="text-center py-4">
                <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No members found. Add members to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {onChainMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                        {getRoleIcon(member.role)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(parseInt(member.joined)).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
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
