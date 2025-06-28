import { createServerSupabaseClient, Database } from '../supabase'

type UsageEvent = Database['public']['Tables']['usage_events']['Row']
type UsageEventInsert = Database['public']['Tables']['usage_events']['Insert']
type RoyaltyEarning = Database['public']['Tables']['royalty_earnings']['Row']

export interface EarningsBreakdown {
  total: number
  performance: number
  mechanical: number
  sync: number
}

export interface UsageStats {
  totalPlays: number
  totalDownloads: number
  totalEvents: number
  platformBreakdown: Record<string, number>
  eventTypeBreakdown: Record<string, number>
}

export class UsageEventsRepository {
  private static getSupabaseClient() {
    return createServerSupabaseClient()
  }

  static async findByWorkId(workId: string, limit = 100): Promise<UsageEvent[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('usage_events')
      .select('*')
      .eq('work_id', workId)
      .order('reported_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to find usage events by work ID: ${error.message}`)
    }

    return data || []
  }

  static async findByEventType(eventType: string, limit = 100): Promise<UsageEvent[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('usage_events')
      .select('*')
      .eq('event_type', eventType)
      .order('reported_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to find usage events by type: ${error.message}`)
    }

    return data || []
  }

  static async createUsageEvents(events: UsageEventInsert[]): Promise<UsageEvent[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('usage_events')
      .insert(events)
      .select()

    if (error) {
      throw new Error(`Failed to create usage events: ${error.message}`)
    }

    return data || []
  }

  static async getUsageStats(workId: string): Promise<UsageStats> {
    const supabase = this.getSupabaseClient()

    const { data: events, error } = await supabase
      .from('usage_events')
      .select('*')
      .eq('work_id', workId)

    if (error) {
      throw new Error(`Failed to get usage stats: ${error.message}`)
    }

    const stats: UsageStats = {
      totalPlays: 0,
      totalDownloads: 0,
      totalEvents: events?.length || 0,
      platformBreakdown: {},
      eventTypeBreakdown: {},
    }

    for (const event of events || []) {
      // Count plays and downloads
      if (event.play_count) {
        stats.totalPlays += event.play_count
      }
      if (event.unit_count) {
        stats.totalDownloads += event.unit_count
      }

      // Platform breakdown
      stats.platformBreakdown[event.platform] = 
        (stats.platformBreakdown[event.platform] || 0) + 1

      // Event type breakdown
      stats.eventTypeBreakdown[event.event_type] = 
        (stats.eventTypeBreakdown[event.event_type] || 0) + 1
    }

    return stats
  }

  static async getEarningsForWork(workId: string): Promise<RoyaltyEarning | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('royalty_earnings')
      .select('*')
      .eq('work_id', workId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get earnings for work: ${error.message}`)
    }

    return data
  }

  static async getTotalEarningsForUser(userId: string): Promise<number> {
    const supabase = this.getSupabaseClient()

    // Get all works created by user
    const { data: userWorks, error: worksError } = await supabase
      .from('works')
      .select('id')
      .eq('created_by_user_id', userId)

    if (worksError) {
      throw new Error(`Failed to get user works: ${worksError.message}`)
    }

    if (!userWorks || userWorks.length === 0) {
      return 0
    }

    const workIds = userWorks.map(w => w.id)

    // Get earnings for all user works
    const { data: earnings, error: earningsError } = await supabase
      .from('royalty_earnings')
      .select('total_earnings')
      .in('work_id', workIds)

    if (earningsError) {
      throw new Error(`Failed to get user earnings: ${earningsError.message}`)
    }

    return (earnings || []).reduce((sum, earning) => sum + earning.total_earnings, 0)
  }

  static async getRecentTrends(workId?: string, days = 30): Promise<{
    currentPeriod: number
    previousPeriod: number
    percentageChange: number
  }> {
    const supabase = this.getSupabaseClient()

    const now = new Date()
    const currentPeriodStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - (days * 24 * 60 * 60 * 1000))

    let currentQuery = supabase
      .from('usage_events')
      .select('revenue_amount')
      .gte('period_end', currentPeriodStart.toISOString())
      .lte('period_end', now.toISOString())

    let previousQuery = supabase
      .from('usage_events')
      .select('revenue_amount')
      .gte('period_end', previousPeriodStart.toISOString())
      .lt('period_end', currentPeriodStart.toISOString())

    if (workId) {
      currentQuery = currentQuery.eq('work_id', workId)
      previousQuery = previousQuery.eq('work_id', workId)
    }

    const [currentResult, previousResult] = await Promise.all([
      currentQuery,
      previousQuery
    ])

    if (currentResult.error || previousResult.error) {
      throw new Error('Failed to get trend data')
    }

    const currentPeriod = (currentResult.data || [])
      .reduce((sum, event) => sum + event.revenue_amount, 0)
    
    const previousPeriod = (previousResult.data || [])
      .reduce((sum, event) => sum + event.revenue_amount, 0)

    const percentageChange = previousPeriod > 0 
      ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 
      : 0

    return {
      currentPeriod,
      previousPeriod,
      percentageChange
    }
  }
}