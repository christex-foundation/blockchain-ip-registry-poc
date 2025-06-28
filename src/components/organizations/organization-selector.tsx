'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, User } from 'lucide-react'

interface Organization {
  id: string
  name: string
  collection_address: string | null
  created_at: string | null
  updated_at: string | null
}

interface OrganizationSelectorProps {
  value?: string
  onValueChange?: (value: string | undefined) => void
  placeholder?: string
  showCreateOption?: boolean
  onCreateClick?: () => void
}

export function OrganizationSelector({
  value,
  onValueChange,
  placeholder = "Select organization (optional)",
  showCreateOption = false,
  onCreateClick,
}: OrganizationSelectorProps) {
  const { getAccessToken } = usePrivy()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleValueChange = (newValue: string) => {
    if (newValue === 'none') {
      onValueChange?.(undefined)
    } else if (newValue === 'create') {
      onCreateClick?.()
    } else {
      onValueChange?.(newValue)
    }
  }

  if (loading) {
    return (
      <Card className="shadow-soft border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organization
          </CardTitle>
          <CardDescription>Loading available organizations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
            <p className="content-tertiary text-sm">Finding your organizations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-soft border-0 border-destructive/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Building2 className="h-5 w-5" />
            Organization
          </CardTitle>
          <CardDescription>Unable to load organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-destructive/5 rounded-lg">
            <p className="text-sm text-destructive">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-soft border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Organization Selection
        </CardTitle>
        <CardDescription>
          Choose an organization to collaborate on this work, or select personal work for individual ownership
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={value || 'none'} onValueChange={handleValueChange}>
          <SelectTrigger className="h-12 shadow-soft border-0 bg-muted/30">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-3 py-2">
                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Personal Work</p>
                  <p className="text-xs text-muted-foreground">Individual intellectual property</p>
                </div>
              </div>
            </SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{org.name}</span>
                      {org.collection_address && (
                        <Badge variant="secondary" className="text-xs shadow-soft">
                          On-chain
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Collaborative organization
                    </p>
                  </div>
                </div>
              </SelectItem>
            ))}
            {showCreateOption && (
              <SelectItem value="create">
                <div className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 bg-accent/40 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">+ Create New Organization</p>
                    <p className="text-xs text-muted-foreground">Start a new collaborative group</p>
                  </div>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {organizations.length === 0 && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="content-secondary text-sm text-balance">
              No organizations found. {showCreateOption ? 'Create one to start collaborating with others.' : 'Contact an organization owner to be added as a member.'}
            </p>
          </div>
        )}

        {organizations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-primary/5 rounded-lg text-center">
              <p className="font-semibold text-primary text-lg">{organizations.length}</p>
              <p className="content-tertiary text-sm">Available Organizations</p>
            </div>
            <div className="p-3 bg-accent/20 rounded-lg text-center">
              <p className="font-semibold text-secondary text-lg">
                {organizations.filter(org => org.collection_address).length}
              </p>
              <p className="content-tertiary text-sm">On-chain Collections</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}