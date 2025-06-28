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
      <Card className="shadow-soft border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[#202020]">
            <Building2 className="h-5 w-5 text-[#7073d1]" />
            Organization
          </CardTitle>
          <CardDescription className="text-gray-600">Loading available organizations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            <p className="text-gray-600 text-sm">Finding your organizations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-soft border-0 bg-white border-red-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Building2 className="h-5 w-5" />
            Organization
          </CardTitle>
          <CardDescription className="text-gray-600">Unable to load organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-600">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-soft border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-[#202020]">
          <Building2 className="h-5 w-5 text-[#7073d1]" />
          Organization Selection
        </CardTitle>
        <CardDescription className="text-gray-600">
          Choose an organization to collaborate on this work, or select personal work for individual ownership
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={value || 'none'} onValueChange={handleValueChange}>
          <SelectTrigger className="h-12 shadow-soft border border-gray-200 bg-white hover:bg-gray-50 focus:border-[#7073d1] focus:ring-2 focus:ring-[#7073d1]/20">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-medium">
            <SelectItem value="none" className="hover:bg-gray-50 focus:bg-gray-50">
              <div className="flex items-center gap-3 py-2">
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-[#202020]">Personal Work</p>
                  <p className="text-xs text-gray-600">Individual intellectual property</p>
                </div>
              </div>
            </SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id} className="hover:bg-gray-50 focus:bg-gray-50">
                <div className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 bg-[#dcddff] rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-[#7073d1]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#202020]">{org.name}</span>
                      {org.collection_address && (
                        <Badge variant="secondary" className="text-xs shadow-soft bg-[#dcddff] text-[#202020] hover:bg-[#dcddff]">
                          On-chain
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      Collaborative organization
                    </p>
                  </div>
                </div>
              </SelectItem>
            ))}
            {showCreateOption && (
              <SelectItem value="create" className="hover:bg-gray-50 focus:bg-gray-50">
                <div className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 bg-[#dcddff]/60 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-[#202020]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#7073d1]">+ Create New Organization</p>
                    <p className="text-xs text-gray-600">Start a new collaborative group</p>
                  </div>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {organizations.length === 0 && (
          <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm text-balance">
              No organizations found. {showCreateOption ? 'Create one to start collaborating with others.' : 'Contact an organization owner to be added as a member.'}
            </p>
          </div>
        )}

        {organizations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[#dcddff]/30 rounded-lg text-center border border-[#dcddff]/50">
              <p className="font-semibold text-[#7073d1] text-lg">{organizations.length}</p>
              <p className="text-gray-600 text-sm">Available Organizations</p>
            </div>
            <div className="p-3 bg-[#dcddff]/20 rounded-lg text-center border border-[#dcddff]/40">
              <p className="font-semibold text-[#202020] text-lg">
                {organizations.filter(org => org.collection_address).length}
              </p>
              <p className="text-gray-600 text-sm">On-chain Collections</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}