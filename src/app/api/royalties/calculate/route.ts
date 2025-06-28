import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, Database } from '@/lib/supabase'

type UsageEvent = Database['public']['Tables']['usage_events']['Row']
type RoyaltyEarning = Database['public']['Tables']['royalty_earnings']['Row']

export async function POST(request: NextRequest) {
  try {
    const { workId } = await request.json()

    if (!workId) {
      return NextResponse.json(
        { error: 'Missing required field: workId' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify work exists
    const { data: work, error: workError } = await supabase
      .from('works')
      .select('id, title')
      .eq('id', workId)
      .single()

    if (workError || !work) {
      return NextResponse.json(
        { error: `Work not found: ${workId}` },
        { status: 404 }
      )
    }

    // Get all usage events for this work
    const { data: usageEvents, error: eventsError } = await supabase
      .from('usage_events')
      .select('*')
      .eq('work_id', workId)
      .order('period_end', { ascending: true })

    if (eventsError) {
      console.error('Failed to fetch usage events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to fetch usage events' },
        { status: 500 }
      )
    }

    // Calculate earnings by category
    const earnings = calculateEarnings(usageEvents || [])

    // Upsert royalty earnings record
    const { data: existingEarnings, error: existingError } = await supabase
      .from('royalty_earnings')
      .select('*')
      .eq('work_id', workId)
      .single()

    let updatedEarnings: RoyaltyEarning

    if (existingEarnings) {
      // Update existing record
      const { data, error: updateError } = await supabase
        .from('royalty_earnings')
        .update({
          total_earnings: earnings.total,
          performance_earnings: earnings.performance,
          mechanical_earnings: earnings.mechanical,
          sync_earnings: earnings.sync,
          last_calculated_at: new Date().toISOString(),
        })
        .eq('work_id', workId)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update royalty earnings:', updateError)
        return NextResponse.json(
          { error: 'Failed to update royalty earnings' },
          { status: 500 }
        )
      }

      updatedEarnings = data
    } else {
      // Create new record
      const { data, error: createError } = await supabase
        .from('royalty_earnings')
        .insert({
          work_id: workId,
          total_earnings: earnings.total,
          performance_earnings: earnings.performance,
          mechanical_earnings: earnings.mechanical,
          sync_earnings: earnings.sync,
          last_calculated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create royalty earnings:', createError)
        return NextResponse.json(
          { error: 'Failed to create royalty earnings' },
          { status: 500 }
        )
      }

      updatedEarnings = data
    }

    return NextResponse.json({
      success: true,
      workId,
      workTitle: work.title,
      earnings: {
        total: updatedEarnings.total_earnings,
        performance: updatedEarnings.performance_earnings,
        mechanical: updatedEarnings.mechanical_earnings,
        sync: updatedEarnings.sync_earnings,
      },
      eventsProcessed: usageEvents?.length || 0,
      lastCalculatedAt: updatedEarnings.last_calculated_at,
    })

  } catch (error) {
    console.error('Royalty calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateEarnings(events: UsageEvent[]): {
  total: number
  performance: number
  mechanical: number
  sync: number
} {
  let performance = 0
  let mechanical = 0
  let sync = 0

  for (const event of events) {
    const amount = event.revenue_amount

    switch (event.event_type) {
      case 'stream':
      case 'radio':
        performance += amount
        break
      case 'download':
        mechanical += amount
        break
      case 'sync':
        sync += amount
        break
    }
  }

  return {
    total: performance + mechanical + sync,
    performance,
    mechanical,
    sync,
  }
}