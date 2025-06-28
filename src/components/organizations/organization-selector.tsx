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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </CardTitle>
          <CardDescription>Loading organizations...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Building2 className="h-4 w-4" />
            Organization
          </CardTitle>
          <CardDescription>Error: {error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Organization
        </CardTitle>
        <CardDescription>
          Choose an organization to mint this work under, or leave empty for personal work
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={value || 'none'} onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Personal Work</span>
              </div>
            </SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{org.name}</span>
                  {org.collection_address && (
                    <Badge variant="secondary" className="ml-2">
                      On-chain
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
            {showCreateOption && (
              <SelectItem value="create">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>+ Create New Organization</span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {organizations.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            No organizations found. {showCreateOption ? 'Create one to get started.' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  )
}