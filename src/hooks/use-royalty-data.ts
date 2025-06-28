import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface RoyaltyMetrics {
  totalRoyalties: number
  performanceRoyalties: number
  mechanicalRoyalties: number
  syncRoyalties: number
  monthlyTrend: number
  weeklyTrend: number
  isLoading: boolean
  error: string | null
}

export function useRoyaltyData(accessToken: string | null, workIds: string[]) {
  const [metrics, setMetrics] = useState<RoyaltyMetrics>({
    totalRoyalties: 0,
    performanceRoyalties: 0,
    mechanicalRoyalties: 0,
    syncRoyalties: 0,
    monthlyTrend: 0,
    weeklyTrend: 0,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    if (!accessToken || workIds.length === 0) {
      setMetrics(prev => ({ ...prev, isLoading: false }))
      return
    }

    const fetchRoyaltyData = async () => {
      try {
        setMetrics(prev => ({ ...prev, isLoading: true, error: null }))

        // Fetch earnings for all works
        const earningsPromises = workIds.map(async (workId) => {
          try {
            const response = await fetch(`/api/royalties/earnings?workId=${workId}`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            })
            if (!response.ok) return null
            return await response.json()
          } catch (error) {
            console.error(`Failed to fetch earnings for work ${workId}:`, error)
            return null
          }
        })

        const earningsResults = await Promise.all(earningsPromises)
        const validEarnings = earningsResults.filter(Boolean)

        // Calculate totals
        const totals = validEarnings.reduce(
          (acc, earnings) => ({
            total: acc.total + (earnings.total_earnings || 0),
            performance: acc.performance + (earnings.performance_earnings || 0),
            mechanical: acc.mechanical + (earnings.mechanical_earnings || 0),
            sync: acc.sync + (earnings.sync_earnings || 0),
          }),
          { total: 0, performance: 0, mechanical: 0, sync: 0 }
        )

        // Fetch trend data (monthly and weekly)
        const monthlyTrendPromise = fetch(`/api/royalties/trends?period=monthly`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(r => r.ok ? r.json() : { percentageChange: 0 })

        const weeklyTrendPromise = fetch(`/api/royalties/trends?period=weekly`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(r => r.ok ? r.json() : { percentageChange: 0 })

        const [monthlyTrend, weeklyTrend] = await Promise.all([
          monthlyTrendPromise,
          weeklyTrendPromise
        ])

        setMetrics({
          totalRoyalties: totals.total,
          performanceRoyalties: totals.performance,
          mechanicalRoyalties: totals.mechanical,
          syncRoyalties: totals.sync,
          monthlyTrend: monthlyTrend.percentageChange || 0,
          weeklyTrend: weeklyTrend.percentageChange || 0,
          isLoading: false,
          error: null,
        })

      } catch (error) {
        console.error('Failed to fetch royalty data:', error)
        setMetrics(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load royalty data'
        }))
      }
    }

    fetchRoyaltyData()
  }, [accessToken, workIds.join(',')])

  return metrics
}