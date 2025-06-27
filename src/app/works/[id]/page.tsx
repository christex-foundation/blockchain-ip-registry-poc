'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { Calendar, DollarSign, Users, Shield, Copy, ExternalLink, Info, TrendingUp, Activity, Loader2, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWorkRoyaltyData } from '@/hooks/use-work-royalty-data'

interface Contributor {
  id: string
  name: string
  walletAddress: string
  share: number
}

interface Work {
  id: string
  title: string
  isrc: string
  contributors: Contributor[]
  metadataUri: string | null
  mintAddress: string | null
  createdAt: string
  updatedAt: string
  status: 'minted' | 'pending'
  totalShares: number
  organizationId: string | null
  createdByUserId: string | null
}

export default function WorkDetailsPage() {
  const params = useParams()
  const { getAccessToken } = usePrivy()
  const workId = params.id as string
  
  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  
  // Fetch royalty data for this work
  const royaltyData = useWorkRoyaltyData(workId, accessToken)

  useEffect(() => {
    const fetchWork = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const token = await getAccessToken()
        if (!token) {
          throw new Error('No access token available')
        }
        setAccessToken(token)

        const response = await fetch(`/api/works/${workId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Work not found')
          }
          throw new Error('Failed to fetch work')
        }

        const data = await response.json()
        if (data.success && data.work) {
          setWork(data.work)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Error fetching work:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (workId) {
      fetchWork()
    }
  }, [workId, getAccessToken])

  const handleDistributeRoyalties = () => {
    toast.info('Royalty distribution feature coming soon!')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'SOL') => {
    return `${amount.toFixed(4)} ${currency}`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'stream': return 'bg-blue-100 text-blue-800'
      case 'download': return 'bg-green-100 text-green-800'
      case 'radio': return 'bg-purple-100 text-purple-800'
      case 'sync': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-white to-gray-50">
        <Card className="shadow-medium border border-gray-200 p-8 text-center bg-white">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#7073d1]" />
          <h1 className="text-2xl font-bold mb-4 text-[#202020] font-['Space_Grotesk']">Loading Work</h1>
          <p className="text-gray-600 font-['Futura']">
            Fetching work details...
          </p>
        </Card>
      </div>
    )
  }

  if (error || !work) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-white to-gray-50">
        <Card className="shadow-medium border border-gray-200 p-8 text-center bg-white">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-[#202020] font-['Space_Grotesk']">
            {error === 'Work not found' ? 'Work Not Found' : 'Error Loading Work'}
          </h1>
          <p className="text-gray-600 mb-6 font-['Futura']">
            {error || 'The requested work could not be found.'}
          </p>
          <Link href="/dashboard">
            <Button className="bg-[#7073d1] hover:bg-[#5a5db8] text-white shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5 border-0 font-['Futura']">
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Header */}
        <div className="bg-white shadow-soft rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#7073d1] to-[#8b8dd6] flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#202020] font-['Space_Grotesk'] mb-2">{work.title}</h1>
                <div className="flex items-center gap-6 text-gray-600 font-['Futura']">
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span className="font-mono text-sm">{work.isrc}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(work.createdAt)}
                  </span>
                  <Badge className={`${
                    work.status === 'minted' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                  }`}>
                    {work.status === 'minted' ? 'Minted' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  className="bg-white border-gray-200 hover:border-[#7073d1] hover:bg-[#dcddff]/30 text-[#202020] hover:text-[#7073d1] shadow-soft hover:shadow-medium transition-all duration-200"
                >
                  Back to Dashboard
                </Button>
              </Link>
              <Button
                onClick={handleDistributeRoyalties}
                className="bg-[#7073d1] hover:bg-[#5a5db8] text-white shadow-medium hover:shadow-strong transition-all duration-200 hover:-translate-y-0.5 border-0"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Distribute Royalties
              </Button>
            </div>
          </div>
          
          {/* Hero Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-[#7073d1]/5 to-[#7073d1]/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-[#7073d1]/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#7073d1]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-['Futura']">Contributors</p>
                    <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">{work.contributors.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-[#dcddff]/30 to-[#dcddff]/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-[#dcddff]/60 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-[#7073d1]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-['Futura']">Total Shares</p>
                    <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">{work.totalShares}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-['Futura']">Total Earnings</p>
                    <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">
                      {royaltyData.isLoading ? '...' : formatCurrency(royaltyData.totalEarnings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-orange-200 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-['Futura']">Pending</p>
                    <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">
                      {royaltyData.isLoading ? '...' : formatCurrency(royaltyData.totalOwed)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Contributors Section */}
            <Card className="bg-white shadow-soft border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#dcddff]/20 to-[#f8f9ff]/20 border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-[#202020] font-['Space_Grotesk'] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#7073d1]" />
                  Contributors & Royalty Shares
                </CardTitle>
                <CardDescription className="text-gray-600 font-['Futura']">
                  Ownership distribution across all contributors
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {work.contributors.map((contributor, index) => (
                    <div key={contributor.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#dcddff] rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#7073d1]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#202020] font-['Space_Grotesk']">{contributor.name}</h3>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <code className="text-xs bg-gray-900 text-gray-100 px-2 py-1 rounded border border-gray-300 font-mono cursor-pointer hover:bg-gray-800">
                                  {contributor.walletAddress.slice(0, 8)}...{contributor.walletAddress.slice(-8)}
                                </code>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-[#202020] font-['Space_Grotesk']">Full Wallet Address</h4>
                                  <code className="text-xs bg-gray-900 text-gray-100 p-2 rounded block font-mono break-all">
                                    {contributor.walletAddress}
                                  </code>
                                  <Button
                                    size="sm"
                                    onClick={() => copyToClipboard(contributor.walletAddress)}
                                    className="w-full bg-[#7073d1] hover:bg-[#5a5db8] text-white font-['Futura']"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy Address
                                  </Button>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white rounded-full border-4 border-[#7073d1] flex items-center justify-center mb-2">
                            <span className="text-lg font-bold text-[#7073d1] font-['Space_Grotesk']">{contributor.share}%</span>
                          </div>
                          <Progress value={contributor.share} className="w-20 h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Royalty Income Overview */}
            <Card className="bg-white shadow-soft border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#dcddff]/20 to-[#f8f9ff]/20 border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-[#202020] font-['Space_Grotesk'] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#7073d1]" />
                  Financial Overview
                </CardTitle>
                <CardDescription className="text-gray-600 font-['Futura']">
                  Earnings and distribution status for this work
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {royaltyData.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7073d1]" />
                    <span className="ml-2 text-gray-600 font-['Futura']">Loading financial data...</span>
                  </div>
                ) : royaltyData.error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 font-['Futura']">{royaltyData.error}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-blue-200 rounded-lg flex items-center justify-center">
                            <ArrowDownRight className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-['Futura']">Distributed</p>
                            <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">
                              {formatCurrency(royaltyData.totalDistributed)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-soft border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-orange-200 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-['Futura']">Available</p>
                            <p className="text-2xl font-bold text-[#202020] font-['Space_Grotesk']">
                              {formatCurrency(royaltyData.totalOwed)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contributor Earnings Breakdown */}
            {!royaltyData.isLoading && !royaltyData.error && royaltyData.contributorEarnings.length > 0 && (
              <Card className="bg-white shadow-soft border border-gray-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#dcddff]/20 to-[#f8f9ff]/20 border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-[#202020] font-['Space_Grotesk'] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#7073d1]" />
                    Contributor Earnings
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-['Futura']">
                    Individual earnings breakdown for each contributor
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {royaltyData.contributorEarnings.map((contributor) => (
                      <div key={contributor.contributorId} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#dcddff] rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-[#7073d1]" />
                            </div>
                            <div>
                              <h4 className="font-bold text-[#202020] font-['Space_Grotesk']">{contributor.contributorName}</h4>
                              <p className="text-sm text-gray-600 font-['Futura']">{contributor.sharePercentage}% ownership</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#202020] font-['Space_Grotesk']">
                              {formatCurrency(contributor.totalOwed)}
                            </p>
                            <p className="text-sm text-gray-600 font-['Futura']">available</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-gray-600 font-['Futura']">Total Earned</p>
                            <p className="font-bold text-[#202020] font-['Space_Grotesk']">
                              {formatCurrency(contributor.totalEarned)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600 font-['Futura']">Distributed</p>
                            <p className="font-bold text-[#202020] font-['Space_Grotesk']">
                              {formatCurrency(contributor.totalDistributed)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600 font-['Futura']">Available</p>
                            <p className="font-bold text-orange-600 font-['Space_Grotesk']">
                              {formatCurrency(contributor.totalOwed)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white shadow-soft border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-[#dcddff]/20 to-[#f8f9ff]/20 border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-[#202020] font-['Space_Grotesk']">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button 
                  onClick={handleDistributeRoyalties}
                  className="w-full bg-[#7073d1] hover:bg-[#5a5db8] text-white shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5 border-0 font-['Futura']"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Distribute Royalties
                </Button>
                
                {work.mintAddress && (
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-gray-200 hover:border-[#7073d1] hover:bg-[#dcddff]/30 text-[#202020] hover:text-[#7073d1] shadow-soft hover:shadow-medium transition-all duration-200 font-['Futura']"
                    onClick={() => window.open(`https://core.metaplex.com/explorer/${work.mintAddress}?env=devnet`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Blockchain Details */}
            <Card className="bg-white shadow-soft border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-[#dcddff]/20 to-[#f8f9ff]/20 border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-[#202020] font-['Space_Grotesk'] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#7073d1]" />
                  Blockchain Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-['Futura']">Network</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-[#202020] font-['Space_Grotesk']">Solana Devnet</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-['Futura']">Token Standard</label>
                  <p className="text-sm font-medium text-[#202020] font-['Space_Grotesk'] mt-1">Metaplex Core</p>
                </div>
                
                {work.mintAddress && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-['Futura'] flex items-center gap-2">
                      <ExternalLink className="w-3 h-3" />
                      NFT Address
                    </label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <code className="text-xs bg-gray-900 text-gray-100 px-2 py-1 rounded border border-gray-300 font-mono block break-all">
                        {work.mintAddress}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(work.mintAddress!)}
                        className="w-full mt-2 text-xs font-['Futura']"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Address
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            {!royaltyData.isLoading && !royaltyData.error && royaltyData.usageEvents.length > 0 && (
              <Card className="bg-white shadow-soft border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-[#dcddff]/20 to-[#f8f9ff]/20 border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-[#202020] font-['Space_Grotesk'] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#7073d1]" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {royaltyData.usageEvents.slice(0, 5).map((event) => (
                      <div key={event.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getEventTypeColor(event.event_type)} text-xs font-['Futura']`}>
                            {event.event_type}
                          </Badge>
                          <span className="text-xs font-medium text-gray-600 font-['Futura']">
                            {event.platform}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-600 font-['Futura'] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(event.reported_at)}
                          </p>
                          <p className="text-sm font-bold text-[#202020] font-['Space_Grotesk']">
                            {formatCurrency(event.revenue_amount, event.currency)}
                          </p>
                        </div>
                        {event.play_count && (
                          <p className="text-xs text-gray-600 font-['Futura'] mt-1">
                            {event.play_count.toLocaleString()} plays
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {royaltyData.usageEvents.length > 5 && (
                    <div className="text-center mt-3">
                      <p className="text-xs text-gray-500 font-['Futura']">
                        +{royaltyData.usageEvents.length - 5} more events
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No Activity Message */}
            {!royaltyData.isLoading && !royaltyData.error && royaltyData.usageEvents.length === 0 && (
              <Card className="bg-white shadow-soft border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-[#dcddff]/20 to-[#f8f9ff]/20 border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-[#202020] font-['Space_Grotesk'] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#7073d1]" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-center py-6">
                    <Activity className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-900 mb-1 font-['Space_Grotesk']">No Activity Yet</h3>
                    <p className="text-xs text-gray-600 font-['Futura']">
                      Revenue events will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}