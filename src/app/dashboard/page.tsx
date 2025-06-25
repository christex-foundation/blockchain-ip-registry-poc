'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import Link from 'next/link'
import { AuthGuard } from '@/components/privy/auth-guard'
import { usePrivyAuth } from '@/components/privy/use-privy-auth'
import { apiClient } from '@/lib/api-client'

interface Work {
  id: string
  title: string
  isrc?: string
  contributors: Array<{
    name: string
    wallet: string
    share: number
  }>
  metadataUri?: string
  createdAt: string
  status: string
}

function DashboardContent() {
  const [works, setWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getAccessToken, user, userEmail } = usePrivyAuth()

  // Load user's works
  useEffect(() => {
    const loadWorks = async () => {
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          toast.error('Failed to get access token')
          return
        }

        const response = await apiClient.getWorks(accessToken)
        setWorks(response.works || [])
      } catch (error) {
        console.error('Failed to load works:', error)
        toast.error('Failed to load works')
      } finally {
        setIsLoading(false)
      }
    }

    loadWorks()
  }, [getAccessToken])

  const handleDistributeRoyalties = async (workId: string) => {
    toast.info(`Distribution feature coming in Week 3! Work ID: ${workId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="glass">
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
          <Card className="glass">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate stats
  const totalRoyalties = works.reduce((sum) => {
    // Mock royalty calculation - in production this would come from blockchain data
    return sum + (Math.random() * 5) // Random amount for demo
  }, 0)

  const activeContributors = new Set(
    works.flatMap(work => work.contributors.map(c => c.wallet))
  ).size

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">IP Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome {userEmail || user?.id} - Manage your registered intellectual property and royalty distributions
            </p>
          </div>
          <Link href="/register-work">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium glow">
              Register New Work
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Registered Works
              </CardTitle>
              <div className="text-3xl font-bold">{works.length}</div>
            </CardHeader>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Royalties (SOL)
              </CardTitle>
              <div className="text-3xl font-bold">
                {totalRoyalties.toFixed(1)}
              </div>
            </CardHeader>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Contributors
              </CardTitle>
              <div className="text-3xl font-bold">
                {activeContributors}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Registered Works Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Registered Works</CardTitle>
            <CardDescription>
              View and manage your intellectual property registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {works?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No works registered yet</p>
                <Link href="/register-work">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    Register Your First Work
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>ISRC</TableHead>
                    <TableHead>Contributors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {works.map((work) => (
                    <TableRow key={work.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{work.title}</div>
                          {work.metadataUri && (
                            <div className="text-xs text-muted-foreground">
                              Metadata: {work.metadataUri.substring(0, 30)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{work.isrc || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {work.contributors.map((contributor, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{contributor.name}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {contributor.share}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {work.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(work.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/works/${work.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handleDistributeRoyalties(work.id)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          >
                            Distribute
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
} 
