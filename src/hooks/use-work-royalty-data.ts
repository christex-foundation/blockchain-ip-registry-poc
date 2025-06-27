import { useState, useEffect } from 'react'

export interface UsageEvent {
  id: string
  work_id: string
  event_type: 'stream' | 'download' | 'radio' | 'sync'
  platform: string
  play_count: number | null
  unit_count: number | null
  revenue_amount: number
  currency: string
  period_start: string
  period_end: string
  reported_at: string
}

export interface ContributorEarnings {
  contributorId: string
  contributorName: string
  contributorWallet: string
  sharePercentage: number
  totalEarned: number
  totalOwed: number
  totalDistributed: number
  lastDistributionDate: string | null
}

export interface WorkRoyaltyData {
  totalEarnings: number
  totalDistributed: number
  totalOwed: number
  usageEvents: UsageEvent[]
  contributorEarnings: ContributorEarnings[]
  isLoading: boolean
  error: string | null
}

export function useWorkRoyaltyData(workId: string, accessToken: string | null) {
  const [data, setData] = useState<WorkRoyaltyData>({
    totalEarnings: 0,
    totalDistributed: 0,
    totalOwed: 0,
    usageEvents: [],
    contributorEarnings: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    if (!accessToken || !workId) {
      setData(prev => ({ ...prev, isLoading: false }))
      return
    }

    const fetchWorkRoyaltyData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }))

        // Fetch usage events for this work
        const eventsResponse = await fetch(`/api/usage-events?workId=${workId}&limit=50`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })

        if (!eventsResponse.ok) {
          throw new Error('Failed to fetch usage events')
        }

        const eventsData = await eventsResponse.json()
        const usageEvents: UsageEvent[] = eventsData.events || []

        // Fetch earnings data for this work
        const earningsResponse = await fetch(`/api/royalties/earnings?workId=${workId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })

        let totalEarnings = 0
        let totalDistributed = 0
        
        if (earningsResponse.ok) {
          const earningsData = await earningsResponse.json()
          totalEarnings = earningsData.total_earnings || 0
          totalDistributed = earningsData.total_distributed || 0
        }

        // Calculate total earnings from usage events if earnings API doesn't have data
        if (totalEarnings === 0 && usageEvents.length > 0) {
          totalEarnings = usageEvents.reduce((sum, event) => sum + event.revenue_amount, 0)
        }

        const totalOwed = totalEarnings - totalDistributed

        // Calculate contributor earnings (we'll need to fetch work details for contributors)
        const workResponse = await fetch(`/api/works/${workId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })

        let contributorEarnings: ContributorEarnings[] = []

        if (workResponse.ok) {
          const workData = await workResponse.json()
          const work = workData.work

          if (work && work.contributors) {
            contributorEarnings = work.contributors.map((contributor: any) => {
              const contributorTotalEarned = (totalEarnings * contributor.share) / 100
              const contributorTotalDistributed = (totalDistributed * contributor.share) / 100
              const contributorTotalOwed = contributorTotalEarned - contributorTotalDistributed

              return {
                contributorId: contributor.id,
                contributorName: contributor.name,
                contributorWallet: contributor.walletAddress,
                sharePercentage: contributor.share,
                totalEarned: contributorTotalEarned,
                totalOwed: contributorTotalOwed,
                totalDistributed: contributorTotalDistributed,
                lastDistributionDate: null, // TODO: Track distribution history
              }
            })
          }
        }

        setData({
          totalEarnings,
          totalDistributed,
          totalOwed,
          usageEvents,
          contributorEarnings,
          isLoading: false,
          error: null,
        })

      } catch (error) {
        console.error('Failed to fetch work royalty data:', error)
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load royalty data'
        }))
      }
    }

    fetchWorkRoyaltyData()
  }, [workId, accessToken])

  return data
}