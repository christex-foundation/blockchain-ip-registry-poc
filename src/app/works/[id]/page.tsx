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
          <h1 className="text-2xl font-bold mb-4 text-[#202020] font-futura">Loading Work</h1>
          <p className="text-gray-600 font-space-grotesk">
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
          <h1 className="text-2xl font-bold mb-4 text-[#202020] font-futura">
            {error === 'Work not found' ? 'Work Not Found' : 'Error Loading Work'}
          </h1>
          <p className="text-gray-600 mb-6 font-space-grotesk">
            {error || 'The requested work could not be found.'}
          </p>
          <Link href="/dashboard">
            <Button className="bg-[#7073d1] hover:bg-[#5a5db8] text-white shadow-soft font-space-grotesk">
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white shadow-soft rounded-xl border border-gray-200 p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#dcddff] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#7073d1]" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-[#202020] font-futura">{work.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-gray-600 font-space-grotesk">
                    <span className="flex items-center gap-1">
                      <Info className="w-4 h-4" />
                      ISRC: {work.isrc}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Registered: {formatDate(work.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gradient-to-r from-[#7073d1] to-[#8b8dd6] rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-space-grotesk">Status</p>
                      <p className="text-2xl font-bold font-futura capitalize">{work.status}</p>
                    </div>
                    <Shield className="w-8 h-8 text-white/80" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-space-grotesk">Contributors</p>
                      <p className="text-2xl font-bold text-[#202020] font-futura">{work.contributors.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-[#7073d1]" />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-space-grotesk">Total Shares</p>
                      <p className="text-2xl font-bold text-[#202020] font-futura">{work.totalShares}%</p>
                    </div>
                    <Activity className="w-8 h-8 text-[#7073d1]" />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-space-grotesk">Total Earnings</p>
                      <p className="text-2xl font-bold text-[#202020] font-futura">
                        {royaltyData.isLoading ? '...' : formatCurrency(royaltyData.totalEarnings)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-[#7073d1]" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 ml-8">
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50 font-space-grotesk"
                >
                  Back to Dashboard
                </Button>
              </Link>
              <Button
                onClick={handleDistributeRoyalties}
                className="bg-[#7073d1] hover:bg-[#5a5db8] text-white shadow-medium font-space-grotesk"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Distribute Royalties
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Work Information */}
            <Card className="bg-white shadow-medium border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#dcddff] to-[#f8f9ff] border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-[#202020] font-futura flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#7073d1]" />
                  Work Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Info Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-[#dcddff] rounded-full flex items-center justify-center">
                      <Info className="w-6 h-6 text-[#7073d1]" />
                    </div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-space-grotesk">Title</label>
                    <p className="font-bold text-[#202020] mt-1 font-futura">{work.title}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-[#dcddff] rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-[#7073d1]" />
                    </div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-space-grotesk">ISRC</label>
                    <p className="font-bold text-[#202020] mt-1 font-mono text-sm">{work.isrc}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-space-grotesk">Status</label>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100 font-space-grotesk">
                      {work.status}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-[#dcddff] rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[#7073d1]" />
                    </div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-space-grotesk">Registration</label>
                    <p className="font-bold text-[#202020] mt-1 font-futura text-sm">{formatDate(work.createdAt)}</p>
                  </div>
                </div>
                
                {/* NFT Address Section */}
                {work.mintAddress && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700 font-space-grotesk flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        NFT Mint Address
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(work.mintAddress!)}
                        className="text-xs font-space-grotesk"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code className="text-xs bg-white px-3 py-2 rounded border border-gray-300 font-mono cursor-pointer hover:bg-gray-50 block">
                            {work.mintAddress}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-xs">Click to view full address</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contributors */}
            <Card className="bg-white shadow-medium border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#dcddff] to-[#f8f9ff] border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-[#202020] font-futura flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#7073d1]" />
                  Contributors & Royalty Shares
                </CardTitle>
                <CardDescription className="text-gray-600 font-space-grotesk">
                  Registered contributors and their ownership percentages
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {work.contributors.map((contributor, index) => (
                    <div key={contributor.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#dcddff] rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#7073d1]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#202020] font-futura">{contributor.name}</h3>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-300 font-mono cursor-pointer hover:bg-gray-50">
                                  {contributor.walletAddress.slice(0, 8)}...{contributor.walletAddress.slice(-8)}
                                </code>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-[#202020] font-futura">Full Wallet Address</h4>
                                  <code className="text-xs bg-gray-100 p-2 rounded block font-mono break-all">
                                    {contributor.walletAddress}
                                  </code>
                                  <Button
                                    size="sm"
                                    onClick={() => copyToClipboard(contributor.walletAddress)}
                                    className="w-full bg-[#7073d1] hover:bg-[#5a5db8] text-white font-space-grotesk"
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
                            <span className="text-lg font-bold text-[#7073d1] font-futura">{contributor.share}%</span>
                          </div>
                          <Progress value={contributor.share} className="w-20 h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Ownership Distribution */}
                <div className="mt-6 p-4 bg-gradient-to-r from-[#f8f9ff] to-[#dcddff] rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-[#202020] mb-3 font-futura">Ownership Distribution</h4>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    {work.contributors.map((contributor, index) => (
                      <div key={contributor.id} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: index === 0 ? '#7073d1' : '#dcddff' }}
                        />
                        <span className="text-sm font-medium text-[#202020] font-space-grotesk">
                          {contributor.name}: {contributor.share}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Royalty Income Overview */}
            <Card className="bg-white shadow-medium border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#dcddff] to-[#f8f9ff] border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-[#202020] font-futura flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#7073d1]" />
                  Royalty Income Overview
                </CardTitle>
                <CardDescription className="text-gray-600 font-space-grotesk">
                  Total earnings and distribution status for this work
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {royaltyData.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7073d1]" />
                    <span className="ml-2 text-gray-600 font-space-grotesk">Loading royalty data...</span>
                  </div>
                ) : royaltyData.error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 font-space-grotesk">{royaltyData.error}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-700 text-sm font-space-grotesk">Total Earnings</p>
                          <p className="text-2xl font-bold text-green-800 font-futura">
                            {formatCurrency(royaltyData.totalEarnings)}
                          </p>
                        </div>
                        <ArrowUpRight className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 text-sm font-space-grotesk">Total Distributed</p>
                          <p className="text-2xl font-bold text-blue-800 font-futura">
                            {formatCurrency(royaltyData.totalDistributed)}
                          </p>
                        </div>
                        <ArrowDownRight className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-700 text-sm font-space-grotesk">Pending Distribution</p>
                          <p className="text-2xl font-bold text-orange-800 font-futura">
                            {formatCurrency(royaltyData.totalOwed)}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contributor Earnings Breakdown */}
            {!royaltyData.isLoading && !royaltyData.error && royaltyData.contributorEarnings.length > 0 && (
              <Card className="bg-white shadow-medium border border-gray-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#dcddff] to-[#f8f9ff] border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-[#202020] font-futura flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#7073d1]" />
                    Contributor Earnings Breakdown
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-space-grotesk">
                    Individual earnings and distribution status for each contributor
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {royaltyData.contributorEarnings.map((contributor) => (
                      <div key={contributor.contributorId} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#dcddff] rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-[#7073d1]" />
                            </div>
                            <div>
                              <h4 className="font-bold text-[#202020] font-futura">{contributor.contributorName}</h4>
                              <p className="text-sm text-gray-600 font-space-grotesk">{contributor.sharePercentage}% ownership</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#202020] font-futura">
                              {formatCurrency(contributor.totalOwed)}
                            </p>
                            <p className="text-sm text-gray-600 font-space-grotesk">pending</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-gray-600 font-space-grotesk">Total Earned</p>
                            <p className="font-bold text-[#202020] font-futura">
                              {formatCurrency(contributor.totalEarned)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600 font-space-grotesk">Distributed</p>
                            <p className="font-bold text-[#202020] font-futura">
                              {formatCurrency(contributor.totalDistributed)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600 font-space-grotesk">Pending</p>
                            <p className="font-bold text-orange-600 font-futura">
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

            {/* Usage Events Timeline */}
            {!royaltyData.isLoading && !royaltyData.error && royaltyData.usageEvents.length > 0 && (
              <Card className="bg-white shadow-medium border border-gray-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#dcddff] to-[#f8f9ff] border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-[#202020] font-futura flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#7073d1]" />
                    Usage Events Timeline
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-space-grotesk">
                    Recent usage events and revenue generation for this work
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {royaltyData.usageEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#dcddff] rounded-full flex items-center justify-center">
                            <Activity className="w-5 h-5 text-[#7073d1]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`${getEventTypeColor(event.event_type)} text-xs font-space-grotesk`}>
                                {event.event_type}
                              </Badge>
                              <span className="text-sm font-medium text-gray-700 font-space-grotesk">
                                {event.platform}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 font-space-grotesk flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(event.reported_at)}
                            </p>
                            {event.play_count && (
                              <p className="text-xs text-gray-600 font-space-grotesk">
                                {event.play_count.toLocaleString()} plays
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#202020] font-futura">
                            {formatCurrency(event.revenue_amount, event.currency)}
                          </p>
                          <p className="text-xs text-gray-600 font-space-grotesk">
                            {formatDate(event.period_start)} - {formatDate(event.period_end)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Usage Events Message */}
            {!royaltyData.isLoading && !royaltyData.error && royaltyData.usageEvents.length === 0 && (
              <Card className="bg-white shadow-medium border border-gray-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#dcddff] to-[#f8f9ff] border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-[#202020] font-futura flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#7073d1]" />
                    Usage Events Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2 font-futura">No Usage Events Yet</h3>
                    <p className="text-gray-600 font-space-grotesk">
                      When this work generates revenue from streaming, downloads, or other usage, 
                      the events will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white shadow-medium border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-[#dcddff] to-[#f8f9ff] border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-[#202020] font-futura">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button 
                  onClick={handleDistributeRoyalties}
                  className="w-full bg-[#7073d1] hover:bg-[#5a5db8] text-white shadow-soft font-space-grotesk"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Distribute Royalties
                </Button>
                
                {work.mintAddress && (
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 hover:bg-gray-50 font-space-grotesk"
                    onClick={() => window.open(`https://solscan.io/token/${work.mintAddress}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Solscan
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Blockchain Info */}
            <Card className="bg-white shadow-medium border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-[#dcddff] to-[#f8f9ff] border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-[#202020] font-futura flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#7073d1]" />
                  Blockchain Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-space-grotesk">Network</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-[#202020] font-space-grotesk">Solana</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-space-grotesk">Token Standard</label>
                  <p className="text-sm font-medium text-[#202020] font-space-grotesk">Metaplex Core</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide font-space-grotesk">Status</label>
                  <Badge className={`mt-1 font-space-grotesk ${
                    work.status === 'minted' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                  }`}>
                    {work.status === 'minted' ? 'Minted' : 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}