'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Mock data - will be replaced with real data from blockchain/database
const mockWorkData = {
  '1': {
    id: '1',
    title: 'Midnight Dreams',
    isrc: 'USUM71234567',
    mintAddress: 'ABC123def456GHI789jkl012MNO345pqr678STU901vwx234YZ',
    description: 'A dreamy electronic track with ambient soundscapes',
    registrationDate: '2024-01-10',
    contributors: [
      { name: 'Artist One', wallet: '9WzDXwBbTzgTHzgTXzgTHzgTXzgTHzgTXzgTHzgT', share: 60 },
      { name: 'Producer Two', wallet: '5KjHgTfRdSeWqAzVmMuTmmkHGgGhVaaCBWRBLZcfSens', share: 40 },
    ],
    totalRoyalties: 2.5,
    lastDistribution: '2024-01-15',
    status: 'active',
    metadata: {
      name: 'Midnight Dreams',
      symbol: 'IPOC',
      description: 'IP OnChain registration for Midnight Dreams',
      image: 'https://example.com/artwork.jpg',
      attributes: [
        { trait_type: 'ISRC', value: 'USUM71234567' },
        { trait_type: 'Genre', value: 'Electronic' },
        { trait_type: 'Duration', value: '3:45' },
        { trait_type: 'Contributors', value: 2 },
        { trait_type: 'Registration Date', value: '2024-01-10' }
      ]
    },
    distributionHistory: [
      { date: '2024-01-15', amount: 1.2, txHash: 'tx123...abc', status: 'completed' },
      { date: '2024-01-01', amount: 0.8, txHash: 'tx456...def', status: 'completed' },
      { date: '2023-12-15', amount: 0.5, txHash: 'tx789...ghi', status: 'completed' },
    ]
  }
}

export default function WorkDetailsPage() {
  const params = useParams()
  const workId = params.id as string
  const work = mockWorkData[workId as keyof typeof mockWorkData]

  if (!work) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Work Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested work could not be found.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const handleDistributeRoyalties = () => {
    // TODO: Navigate to distribution page or open distribution modal
    console.log(`Distributing royalties for work ${workId}`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">{work.title}</h1>
            <p className="text-muted-foreground mt-2">
              ISRC: {work.isrc} • Registered: {work.registrationDate}
            </p>
          </div>
          <div className="flex space-x-4">
            <Link href="/dashboard">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
            <Button
              onClick={handleDistributeRoyalties}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white glow"
            >
              Distribute Royalties
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Work Information */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Work Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Title</label>
                    <p className="font-medium">{work.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ISRC</label>
                    <p className="font-medium">{work.isrc}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant="default">{work.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                    <p className="font-medium">{work.registrationDate}</p>
                  </div>
                </div>
                <Separator className="my-4" />
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">NFT Mint Address</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code className="text-xs bg-secondary/20 px-2 py-1 rounded font-mono cursor-pointer hover:bg-secondary/30">
                            {work.mintAddress.slice(0, 12)}...{work.mintAddress.slice(-12)}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-xs">{work.mintAddress}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(work.mintAddress)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contributors */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Contributors & Royalty Shares</CardTitle>
                <CardDescription>
                  Registered contributors and their ownership percentages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {work.contributors.map((contributor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{contributor.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-secondary/20 px-2 py-1 rounded font-mono">
                            {contributor.wallet.slice(0, 8)}...{contributor.wallet.slice(-8)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-bold">
                            {contributor.share}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Distribution History */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Royalty Distribution History</CardTitle>
                <CardDescription>
                  Past royalty distributions to contributors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount (SOL)</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {work.distributionHistory.map((distribution, index) => (
                      <TableRow key={index}>
                        <TableCell>{distribution.date}</TableCell>
                        <TableCell className="font-bold">{distribution.amount} SOL</TableCell>
                        <TableCell>
                          <code className="text-xs bg-secondary/20 px-2 py-1 rounded font-mono">
                            {distribution.txHash}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {distribution.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{work.totalRoyalties} SOL</div>
                  <p className="text-sm text-muted-foreground">Total Royalties</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{work.contributors.length}</div>
                  <p className="text-sm text-muted-foreground">Contributors</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{work.distributionHistory.length}</div>
                  <p className="text-sm text-muted-foreground">Distributions</p>
                </div>
              </CardContent>
            </Card>

            {/* NFT Metadata */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">NFT Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{work.metadata.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Symbol</label>
                  <p className="text-sm">{work.metadata.symbol}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Attributes</label>
                  <div className="space-y-1">
                    {work.metadata.attributes.map((attr, index) => (
                      <div key={index} className="text-xs bg-secondary/10 px-2 py-1 rounded">
                        <span className="font-medium">{attr.trait_type}:</span> {attr.value}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Development Notice */}
        <div className="text-center text-sm text-muted-foreground glass rounded-lg p-4">
          <p>🚧 Development Mode - Mock data shown</p>
          <p>Real blockchain data and transaction history will be implemented in upcoming weeks</p>
        </div>
      </div>
    </div>
  )
} 
