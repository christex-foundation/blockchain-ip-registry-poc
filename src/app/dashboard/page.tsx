'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

// Mock data - will be replaced with real data from blockchain/database
const mockRegisteredWorks = [
  {
    id: '1',
    title: 'Midnight Dreams',
    isrc: 'USUM71234567',
    mintAddress: 'ABC123...XYZ789',
    contributors: [
      { name: 'Artist One', wallet: '9WzDXw...', share: 60 },
      { name: 'Producer Two', wallet: '5KjHgT...', share: 40 },
    ],
    totalRoyalties: 2.5,
    lastDistribution: '2024-01-15',
    status: 'active'
  },
  {
    id: '2', 
    title: 'Electric Sunset',
    isrc: 'USUM71234568',
    mintAddress: 'DEF456...ABC123',
    contributors: [
      { name: 'Band Lead', wallet: '7TgFdS...', share: 50 },
      { name: 'Songwriter', wallet: '3MnBvC...', share: 30 },
      { name: 'Engineer', wallet: '8LpQwE...', share: 20 },
    ],
    totalRoyalties: 1.8,
    lastDistribution: '2024-01-10',
    status: 'active'
  }
]

export default function DashboardPage() {
  const handleDistributeRoyalties = (workId: string) => {
    // TODO: Navigate to distribution page
    console.log(`Distributing royalties for work ${workId}`)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">IP Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your registered intellectual property and royalty distributions
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
              <div className="text-3xl font-bold">{mockRegisteredWorks.length}</div>
            </CardHeader>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Royalties (SOL)
              </CardTitle>
              <div className="text-3xl font-bold">
                {mockRegisteredWorks.reduce((sum, work) => sum + work.totalRoyalties, 0).toFixed(1)}
              </div>
            </CardHeader>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Contributors
              </CardTitle>
              <div className="text-3xl font-bold">
                {new Set(mockRegisteredWorks.flatMap(work => work.contributors.map(c => c.wallet))).size}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>ISRC</TableHead>
                  <TableHead>Contributors</TableHead>
                  <TableHead>Royalties (SOL)</TableHead>
                  <TableHead>Last Distribution</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRegisteredWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{work.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {work.mintAddress}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{work.isrc}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {work.contributors.map((contributor, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{contributor.name}</span>
                            <span className="text-muted-foreground"> ({contributor.share}%)</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{work.totalRoyalties} SOL</TableCell>
                    <TableCell>{work.lastDistribution}</TableCell>
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
          </CardContent>
        </Card>

        {/* Development Notice */}
        <div className="text-center text-sm text-muted-foreground glass rounded-lg p-4">
          <p>🚧 Development Mode - Mock data shown</p>
          <p>Real blockchain integration will be implemented in upcoming weeks</p>
        </div>
      </div>
    </div>
  )
} 
