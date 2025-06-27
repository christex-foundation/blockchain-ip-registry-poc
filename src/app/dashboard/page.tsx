'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useRoyaltyData } from '@/hooks/use-royalty-data'
import { 
  TrendingUp, 
  Users, 
  Coins, 
  Music, 
  Calendar,
  Plus,
  Eye,
  Share2,
  Clock,
  Sparkles,
  BarChart3
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
        <div className="grid gap-6">
          {/* Header */}
          <div className="grid grid-cols-[1fr_min-content] gap-4 items-start">
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#dcddff]/50 shadow-soft">
                  <Music className="w-4 h-4 text-[#7073d1]" />
                </div>
                <h3 className="font-semibold text-[#202020] text-xl leading-tight truncate font-['Space_Grotesk']">
                  {work.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#202020]/60 font-['Futura']">
                <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border">ISRC: {isrcDisplay}</span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {createdDate}
                </span>
              </div>
            </div>
            <Badge 
              variant={work.status === 'minted' ? 'default' : 'secondary'}
              className={work.status === 'minted' 
                ? 'bg-[#7073d1]/10 text-[#7073d1] border-[#7073d1]/20 hover:bg-[#7073d1]/20 font-medium shadow-soft' 
                : 'bg-gray-100 text-[#202020]/60 border-gray-200 hover:bg-gray-200 font-medium shadow-soft'
              }
            >
              {work.status === 'minted' ? (
                <>
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Minted
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1.5" />
                  Pending
                </>
              )}
            </Badge>
          </div>

          {/* Contributors Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-[1fr_min-content] gap-2 items-center">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7073d1]" />
                <span className="text-sm font-medium text-[#202020] font-['Space_Grotesk']">Contributors</span>
              </div>
              <span className="text-xs text-[#202020]/60 bg-[#dcddff]/30 px-2.5 py-1 rounded-full font-medium">
                {totalContributors} {totalContributors === 1 ? 'member' : 'members'}
              </span>
            </div>
            
            <div className="space-y-3">
              {work.contributors.slice(0, 3).map((contributor) => (
                <div key={contributor.id} className="grid grid-cols-[min-content_1fr_min-content] gap-3 items-center">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-all duration-200">
                        <div className="w-7 h-7 rounded-full bg-[#7073d1] flex items-center justify-center text-xs font-semibold text-white shadow-soft">
                          {contributor.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-[#202020] hover:text-[#7073d1] transition-colors truncate font-medium font-['Futura']">
                          {contributor.name}
                        </span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 p-4 bg-white border border-gray-200 shadow-strong">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#7073d1] flex items-center justify-center font-semibold text-white shadow-soft">
                            {contributor.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#202020] font-['Space_Grotesk']">{contributor.name}</p>
                            <p className="text-xs text-[#202020]/60 font-['Futura']">Contributor</p>
                          </div>
                        </div>
                        <Separator className="bg-gray-200" />
                        <div className="grid gap-3">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm text-[#202020]/60 font-['Futura']">Royalty Share</span>
                            <span className="text-sm font-semibold text-[#7073d1] text-right font-['Space_Grotesk']">{contributor.share}%</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-sm text-[#202020]/60 font-['Futura']">Wallet</span>
                            <span className="text-xs font-mono text-[#202020]/60 text-right bg-gray-50 px-2 py-1 rounded">
                              {contributor.walletAddress.slice(0, 6)}...{contributor.walletAddress.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <div className="flex items-center gap-2.5 justify-end">
                    <span className="text-sm font-semibold text-[#7073d1] font-['Space_Grotesk']">{contributor.share}%</span>
                    <div className="w-14 h-2 bg-[#dcddff]/30 rounded-full overflow-hidden shadow-soft">
                      <div 
                        className="h-full bg-[#7073d1] rounded-full transition-all duration-500 ease-out shadow-soft"
                        style={{ width: `${contributor.share}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {work.contributors.length > 3 && (
                <div className="text-xs text-[#202020]/60 text-center pt-2 border-t border-gray-100 font-['Futura']">
                  +{work.contributors.length - 3} more contributors
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-[1fr_min-content] gap-3 pt-4 border-t border-gray-200">
            <Link href={`/works/${work.id}`} className="min-w-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-gray-200 hover:border-[#7073d1] hover:bg-[#dcddff]/30 text-[#202020] hover:text-[#7073d1] transition-all duration-200 shadow-soft hover:shadow-medium font-medium font-['Futura'] bg-white"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                View Details
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => toast.info('Distribution feature coming in Week 3!')}
              className="bg-[#7073d1] hover:bg-[#5c5fb3] text-white shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5 font-medium font-['Space_Grotesk'] border-0"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
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
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { getAccessToken, user, userEmail } = usePrivyAuth()

  // Load user's works
  useEffect(() => {
    const loadWorks = async () => {
      try {
        const token = await getAccessToken()
        if (!token) {
          toast.error('Failed to get access token')
          return
        }

        setAccessToken(token)
        const response = await apiClient.getWorks(token)
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

  // Get royalty data (memoize workIds to prevent infinite re-renders)
  const workIds = useMemo(() => works.map(work => work.id), [works])
  const royaltyData = useRoyaltyData(accessToken, workIds)

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

  // Calculate advanced metrics using real data
  const totalRoyalties = royaltyData.totalRoyalties
  const uniqueContributors = new Set(
    works.flatMap(work => work.contributors.map(c => c.walletAddress))
  ).size
  const avgRoyaltyPerWork = works.length > 0 ? totalRoyalties / works.length : 0
  const mintedWorks = works.filter(work => work.status === 'minted').length
  const mintedPercentage = works.length > 0 ? (mintedWorks / works.length) * 100 : 0

  // Format trend display
  const formatTrend = (percentage: number, period: string) => {
    if (percentage === 0) return `No change this ${period}`
    const direction = percentage > 0 ? '+' : ''
    return `${direction}${percentage.toFixed(1)}% this ${period}`
  }

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
            <div className="flex gap-3 items-center">
              <Button 
                onClick={async () => {
                  if (!accessToken) return
                  try {
                    const response = await fetch('/api/mock-usage', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                      },
                      body: JSON.stringify({ days: 30, eventsPerDay: 8 })
                    })
                    const result = await response.json()
                    if (result.success) {
                      toast.success(`Generated ${result.eventsGenerated} mock usage events`)
                      // Trigger a refresh of royalty data
                      window.location.reload()
                    } else {
                      toast.error('Failed to generate mock data')
                    }
                  } catch (error) {
                    toast.error('Failed to generate mock data')
                  }
                }}
                variant="outline"
                size="default"
                className="border-[#7073d1] text-[#7073d1] hover:bg-[#dcddff]/30 hover:border-[#5c5fb3] bg-white font-medium shadow-soft hover:shadow-medium transition-all duration-200"
              >
                Generate Mock Data
              </Button>
              <Link href="/register-work">
                <Button 
                  size="default"
                  className="bg-[#7073d1] hover:bg-[#5c5fb3] text-white px-6 font-medium shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5 border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Register New Work
                </Button>
              </Link>
            </div>
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
                value={royaltyData.isLoading ? "Loading..." : `${totalRoyalties.toFixed(1)} SOL`}
                description="Cumulative lifetime earnings"
                icon={Coins}
                trend={royaltyData.isLoading ? undefined : formatTrend(royaltyData.monthlyTrend, "month")}
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
                value={royaltyData.isLoading ? "Loading..." : `${avgRoyaltyPerWork.toFixed(1)} SOL`}
                description="Average royalty per work"
                icon={TrendingUp}
                trend={royaltyData.isLoading ? undefined : formatTrend(royaltyData.weeklyTrend, "week")}
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
                      <Button 
                        size="lg"
                        className="bg-[#7073d1] hover:bg-[#5c5fb3] text-white px-8 font-medium shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5 border-0"
                      >
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
