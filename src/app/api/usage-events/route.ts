import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, Database } from '@/lib/supabase'

type UsageEventInsert = Database['public']['Tables']['usage_events']['Insert']

interface UsageEventRequest {
  workId: string
  eventType: 'stream' | 'download' | 'radio' | 'sync'
  platform: string
  playCount?: number
  unitCount?: number
  revenueAmount: number
  currency?: string
  periodStart: string
  periodEnd: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const events: UsageEventRequest[] = Array.isArray(body) ? body : [body]

    const supabase = createServerSupabaseClient()

    // Validate and transform the events
    const usageEvents: UsageEventInsert[] = []
    
    for (const event of events) {
      // Validate required fields
      if (!event.workId || !event.eventType || !event.platform || !event.revenueAmount) {
        return NextResponse.json(
          { error: 'Missing required fields: workId, eventType, platform, revenueAmount' },
          { status: 400 }
        )
      }

      // Validate work exists
      const { data: work, error: workError } = await supabase
        .from('works')
        .select('id')
        .eq('id', event.workId)
        .single()

      if (workError || !work) {
        return NextResponse.json(
          { error: `Work not found: ${event.workId}` },
          { status: 404 }
        )
      }

      usageEvents.push({
        work_id: event.workId,
        event_type: event.eventType,
        platform: event.platform,
        play_count: event.playCount || null,
        unit_count: event.unitCount || null,
        revenue_amount: event.revenueAmount,
        currency: event.currency || 'SOL',
        period_start: event.periodStart,
        period_end: event.periodEnd,
        reported_at: new Date().toISOString(),
      })
    }

    // Insert usage events
    const { data: insertedEvents, error: insertError } = await supabase
      .from('usage_events')
      .insert(usageEvents)
      .select()

    if (insertError) {
      console.error('Failed to insert usage events:', insertError)
      return NextResponse.json(
        { error: 'Failed to insert usage events' },
        { status: 500 }
      )
    }

    // Trigger royalty recalculation for affected works
    const uniqueWorkIds = [...new Set(usageEvents.map(e => e.work_id))]
    
    // Call royalty calculation service (we'll implement this next)
    for (const workId of uniqueWorkIds) {
      try {
        await fetch(`${request.nextUrl.origin}/api/royalties/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workId }),
        })
      } catch (error) {
        console.error(`Failed to trigger royalty calculation for work ${workId}:`, error)
        // Don't fail the whole request if calculation fails
      }
    }

    return NextResponse.json({
      success: true,
      eventsProcessed: insertedEvents?.length || 0,
      events: insertedEvents,
    })

  } catch (error) {
    console.error('Usage events ingestion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve usage events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const eventType = searchParams.get('eventType')
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '100')

    const supabase = createServerSupabaseClient()

    let query = supabase
      .from('usage_events')
      .select('*')
      .order('reported_at', { ascending: false })
      .limit(limit)

    if (workId) {
      query = query.eq('work_id', workId)
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Failed to fetch usage events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch usage events' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      events: events || [],
      count: events?.length || 0,
    })

  } catch (error) {
    console.error('Usage events fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}