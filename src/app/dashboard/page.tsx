'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from '@/components/ui/hover-card'
import { toast } from 'sonner'
import Link from 'next/link'
import { AuthGuard } from '@/components/privy/auth-guard'
import { usePrivyAuth } from '@/components/privy/use-privy-auth'
import { apiClient } from '@/lib/api-client'
import { 
  TrendingUp, 
  Users, 
  Coins, 
  Music, 
  Calendar,
  ExternalLink,
  Plus,
  Eye,
  Share2,
  Wallet,
  Clock,
  Sparkles
} from 'lucide-react'

interface Work {
  id: string
  title: string
  isrc?: string
  contributors: Array<{
    id: string
    name: string
    walletAddress: string
    share: number
  }>
  metadataUri?: string
  mintAddress?: string
  createdAt: string
  updatedAt: string
  status: string
}

function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  colorClass = "text-blue-400" 
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: string
  colorClass?: string
}) {
  return (
    <Card className="relative overflow-hidden border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-white">{value}</p>
              {trend && (
                <span className="text-xs text-cyan-400 font-medium">
                  {trend}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          <div className={`p-3 rounded-xl bg-blue-500/20 ${colorClass}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WorkCard({ work }: { work: Work }) {
  const totalContributors = work.contributors.length
  const isrcDisplay = work.isrc || 'Unassigned'
  const createdDate = new Date(work.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <Card className="group relative overflow-hidden border-slate-800/50 bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <Music className="h-4 w-4 text-blue-400" />
              <h3 className="font-semibold text-white text-lg leading-tight group-hover:text-blue-300 transition-colors">
                {work.title}
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span>ISRC: {isrcDisplay}</span>
              <Separator orientation="vertical" className="h-3" />
              <span>{createdDate}</span>
            </div>
          </div>
          <Badge 
            variant={work.status === 'minted' ? 'default' : 'secondary'}
            className={work.status === 'minted' 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
              : 'bg-slate-600/20 text-slate-300 border-slate-500/30'
            }
          >
            {work.status === 'minted' ? (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Minted
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </>
            )}
          </Badge>
        </div>

        {/* Contributors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Contributors</span>
            <span className="text-xs text-slate-500">{totalContributors} members</span>
          </div>
          
          <div className="space-y-2">
            {work.contributors.slice(0, 3).map((contributor) => (
              <div key={contributor.id} className="flex items-center justify-between">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center space-x-2 cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">
                        {contributor.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-300 hover:text-white transition-colors">
                        {contributor.name}
                      </span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 p-4 bg-slate-900 border-slate-700">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white">
                          {contributor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{contributor.name}</p>
                          <p className="text-xs text-slate-400">Contributor</p>
                        </div>
                      </div>
                      <Separator className="bg-slate-700" />
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">Royalty Share</span>
                          <span className="text-sm font-medium text-blue-300">{contributor.share}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-400">Wallet</span>
                          <span className="text-xs font-mono text-slate-300">
                            {contributor.walletAddress.slice(0, 6)}...{contributor.walletAddress.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-300">{contributor.share}%</span>
                  <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${contributor.share}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {work.contributors.length > 3 && (
              <div className="text-xs text-slate-500 text-center pt-2">
                +{work.contributors.length - 3} more contributors
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-2">
          <Link href={`/works/${work.id}`} className="flex-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-slate-600 hover:border-blue-500 hover:bg-blue-500/10 text-slate-300 hover:text-white transition-all"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => toast.info('Distribution feature coming in Week 3!')}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Distribute
          </Button>
        </div>
      </CardContent>
    </Card>
  )
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96 bg-slate-800" />
            <Skeleton className="h-6 w-[500px] bg-slate-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-slate-800" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Calculate advanced metrics
  const totalRoyalties = works.reduce((sum) => {
    return sum + (Math.random() * 12) // Mock royalty calculation
  }, 0)

  const uniqueContributors = new Set(
    works.flatMap(work => work.contributors.map(c => c.walletAddress))
  ).size

  const avgRoyaltyPerWork = works.length > 0 ? totalRoyalties / works.length : 0
  const mintedWorks = works.filter(work => work.status === 'minted').length
  const mintedPercentage = works.length > 0 ? (mintedWorks / works.length) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-400 bg-clip-text text-transparent">
              Publishing Dashboard
            </h1>
            <p className="text-slate-400 text-lg">
              Welcome back, <span className="text-blue-300 font-medium">{userEmail || 'Publisher'}</span>
            </p>
            <p className="text-slate-500">
              Monitor your intellectual property portfolio and royalty performance
            </p>
          </div>
          <Link href="/register-work">
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-4 text-lg font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
              <Plus className="h-5 w-5 mr-2" />
              Register New Work
            </Button>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total Works"
            value={works.length}
            description="Registered intellectual property"
            icon={Music}
            trend={works.length > 0 ? `${mintedPercentage.toFixed(0)}% minted` : undefined}
            colorClass="text-blue-400"
          />
          <MetricCard
            title="Total Royalties"
            value={`${totalRoyalties.toFixed(1)} SOL`}
            description="Cumulative earnings"
            icon={Coins}
            trend="+12.3% this month"
            colorClass="text-cyan-400"
          />
          <MetricCard
            title="Active Contributors"
            value={uniqueContributors}
            description="Unique wallet addresses"
            icon={Users}
            trend={`${works.length} works`}
            colorClass="text-blue-500"
          />
          <MetricCard
            title="Avg Royalty/Work"
            value={`${avgRoyaltyPerWork.toFixed(1)} SOL`}
            description="Performance per work"
            icon={TrendingUp}
            trend="+8.1% this week"
            colorClass="text-cyan-500"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Your Works</h2>
              <p className="text-slate-400 mt-1">
                {works.length === 0 
                  ? 'No registered works yet. Create your first IP registration to get started.' 
                  : `${works.length} works registered • ${mintedWorks} minted • ${uniqueContributors} contributors`
                }
              </p>
            </div>
          </div>

          {works.length === 0 ? (
            <Card className="border-slate-800/50 bg-slate-900/60 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Music className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">Ready to start your IP journey?</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                      Register your first intellectual property work to begin tracking royalties and managing contributors.
                    </p>
                  </div>
                  <Link href="/register-work">
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-3 text-lg font-medium">
                      <Plus className="h-5 w-5 mr-2" />
                      Register Your First Work
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {works.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          )}
        </div>
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
