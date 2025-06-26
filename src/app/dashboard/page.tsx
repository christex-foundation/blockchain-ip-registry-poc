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
  Sparkles,
  BarChart3,
  Percent
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
  colorClass = "text-[#7073d1]" 
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: string
  colorClass?: string
}) {
  return (
    <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-soft hover:shadow-medium transition-all duration-300">
      <CardContent className="p-6">
        <div className="grid grid-cols-[1fr_min-content] gap-4 items-start">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">{value}</p>
              {trend && (
                <span className="text-xs text-[#7073d1] font-medium bg-[#dcddff]/50 px-2 py-1 rounded">
                  {trend}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          </div>
          <div className={`p-3 rounded-lg bg-[#dcddff]/30 ${colorClass}`}>
            <Icon className="w-5 h-5" />
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
    <Card className="group bg-white border border-gray-200 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="grid gap-4">
          {/* Header */}
          <div className="grid grid-cols-[1fr_min-content] gap-4 items-start">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#dcddff]/50">
                  <Music className="w-3.5 h-3.5 text-[#7073d1]" />
                </div>
                <h3 className="font-semibold text-[#202020] text-lg leading-tight truncate font-['Space_Grotesk']">
                  {work.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="font-mono text-xs">ISRC: {isrcDisplay}</span>
                <span>•</span>
                <span>{createdDate}</span>
              </div>
            </div>
            <Badge 
              variant={work.status === 'minted' ? 'default' : 'secondary'}
              className={work.status === 'minted' 
                ? 'bg-[#7073d1]/10 text-[#7073d1] border-[#7073d1]/20 hover:bg-[#7073d1]/20' 
                : 'bg-gray-100 text-gray-600 border-gray-200'
              }
            >
              {work.status === 'minted' ? (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Minted
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </>
              )}
            </Badge>
          </div>

          {/* Contributors Section */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-[1fr_min-content] gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">Contributors</span>
              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                {totalContributors} {totalContributors === 1 ? 'member' : 'members'}
              </span>
            </div>
            
            <div className="space-y-2">
              {work.contributors.slice(0, 3).map((contributor) => (
                <div key={contributor.id} className="grid grid-cols-[min-content_1fr_min-content] gap-3 items-center">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-[#7073d1] flex items-center justify-center text-xs font-semibold text-white">
                          {contributor.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 hover:text-[#7073d1] transition-colors truncate">
                          {contributor.name}
                        </span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 p-4 bg-white border border-gray-200 shadow-strong">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#7073d1] flex items-center justify-center font-semibold text-white">
                            {contributor.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#202020]">{contributor.name}</p>
                            <p className="text-xs text-gray-500">Contributor</p>
                          </div>
                        </div>
                        <Separator className="bg-gray-100" />
                        <div className="grid gap-3">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm text-gray-600">Royalty Share</span>
                            <span className="text-sm font-semibold text-[#7073d1] text-right">{contributor.share}%</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm text-gray-600">Wallet</span>
                            <span className="text-xs font-mono text-gray-500 text-right">
                              {contributor.walletAddress.slice(0, 6)}...{contributor.walletAddress.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-semibold text-[#7073d1]">{contributor.share}%</span>
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#7073d1] rounded-full transition-all duration-300"
                        style={{ width: `${contributor.share}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {work.contributors.length > 3 && (
                <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-50">
                  +{work.contributors.length - 3} more contributors
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-[1fr_min-content] gap-2 pt-3 border-t border-gray-100">
            <Link href={`/works/${work.id}`} className="min-w-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-gray-200 hover:border-[#7073d1] hover:bg-[#dcddff]/30 text-gray-700 hover:text-[#7073d1] transition-all"
              >
                <Eye className="w-3 h-3 mr-1" />
                View Details
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => toast.info('Distribution feature coming in Week 3!')}
              className="bg-[#7073d1] hover:bg-[#5c5fb3] text-white shadow-soft hover:shadow-medium transition-all"
            >
              <Share2 className="w-3 h-3 mr-1" />
              Distribute
            </Button>
          </div>
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8">
            <div className="space-y-4">
              <Skeleton className="h-12 w-96 bg-gray-200" />
              <Skeleton className="h-6 w-[500px] bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 bg-gray-200" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80 bg-gray-200" />
              ))}
            </div>
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-8">
          {/* Header */}
          <div className="grid grid-cols-[1fr_min-content] gap-8 items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-[#202020] font-['Space_Grotesk']">
                  Publishing Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Welcome back, <span className="text-[#7073d1] font-medium">{userEmail || 'Publisher'}</span>
                </p>
              </div>
              <p className="text-gray-500 max-w-2xl leading-relaxed">
                Monitor your intellectual property portfolio and royalty performance with comprehensive analytics and insights.
              </p>
            </div>
            <Link href="/register-work">
              <Button className="bg-[#7073d1] hover:bg-[#5c5fb3] text-white px-6 py-3 font-medium shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5">
                <Plus className="w-4 h-4 mr-2" />
                Register New Work
              </Button>
            </Link>
          </div>

          {/* Metrics Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#dcddff]/50">
                <BarChart3 className="w-4 h-4 text-[#7073d1]" />
              </div>
              <h2 className="text-lg font-semibold text-[#202020] font-['Space_Grotesk']">Portfolio Overview</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <MetricCard
                title="Total Works"
                value={works.length}
                description="Registered intellectual property assets"
                icon={Music}
                trend={works.length > 0 ? `${mintedPercentage.toFixed(0)}% minted` : undefined}
                colorClass="text-[#7073d1]"
              />
              <MetricCard
                title="Total Royalties"
                value={`${totalRoyalties.toFixed(1)} SOL`}
                description="Cumulative lifetime earnings"
                icon={Coins}
                trend="+12.3% this month"
                colorClass="text-[#7073d1]"
              />
              <MetricCard
                title="Active Contributors"
                value={uniqueContributors}
                description="Unique collaborator addresses"
                icon={Users}
                trend={`Across ${works.length} works`}
                colorClass="text-[#7073d1]"
              />
              <MetricCard
                title="Avg Performance"
                value={`${avgRoyaltyPerWork.toFixed(1)} SOL`}
                description="Average royalty per work"
                icon={TrendingUp}
                trend="+8.1% this week"
                colorClass="text-[#7073d1]"
              />
            </div>
          </div>

          {/* Works Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#dcddff]/50">
                  <Music className="w-4 h-4 text-[#7073d1]" />
                </div>
                <h2 className="text-lg font-semibold text-[#202020] font-['Space_Grotesk']">Registered Works</h2>
              </div>
              <p className="text-gray-500 leading-relaxed">
                {works.length === 0 
                  ? 'No registered works yet. Create your first IP registration to get started.' 
                  : `Managing ${works.length} registered works with ${mintedWorks} successfully minted and ${uniqueContributors} active contributors.`
                }
              </p>
            </div>

            {works.length === 0 ? (
              <Card className="bg-white border border-gray-200 shadow-soft">
                <CardContent className="p-12 text-center">
                  <div className="grid gap-6 max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#dcddff]/50 flex items-center justify-center">
                      <Music className="w-8 h-8 text-[#7073d1]" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-[#202020] font-['Space_Grotesk']">
                        Ready to start your IP journey?
                      </h3>
                      <p className="text-gray-500 leading-relaxed">
                        Register your first intellectual property work to begin tracking royalties, managing contributors, and building your portfolio.
                      </p>
                    </div>
                    <Link href="/register-work">
                      <Button className="bg-[#7073d1] hover:bg-[#5c5fb3] text-white px-8 py-3 font-medium shadow-soft hover:shadow-medium transition-all">
                        <Plus className="w-4 h-4 mr-2" />
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
