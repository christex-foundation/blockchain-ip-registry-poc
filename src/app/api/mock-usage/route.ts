import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

interface MockUsageOptions {
  workId?: string
  days?: number
  eventsPerDay?: number
}

export async function POST(request: NextRequest) {
  try {
    const { workId, days = 30, eventsPerDay = 5 }: MockUsageOptions = await request.json()

    const supabase = createServerSupabaseClient()

    // Get works to generate data for
    let works: Array<{ id: string; title: string; created_at: string }>

    if (workId) {
      const { data: work, error } = await supabase
        .from('works')
        .select('id, title, created_at')
        .eq('id', workId)
        .single()

      if (error || !work) {
        return NextResponse.json(
          { error: `Work not found: ${workId}` },
          { status: 404 }
        )
      }
      works = [work]
    } else {
      const { data, error } = await supabase
        .from('works')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch works' },
          { status: 500 }
        )
      }
      works = data || []
    }

    if (works.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No works found to generate usage data for',
        eventsGenerated: 0,
      })
    }

    const mockEvents = []
    const today = new Date()

    for (const work of works) {
      const workCreated = new Date(work.created_at || today)
      const startDate = new Date(Math.max(
        today.getTime() - (days * 24 * 60 * 60 * 1000),
        workCreated.getTime()
      ))

      // Generate events for each day since the work was created (up to the days limit)
      for (let d = 0; d < days; d++) {
        const currentDate = new Date(startDate.getTime() + (d * 24 * 60 * 60 * 1000))
        
        if (currentDate > today) break

        // Generate random events for this day
        const dayEvents = Math.floor(Math.random() * eventsPerDay) + 1

        for (let e = 0; e < dayEvents; e++) {
          const event = generateRandomUsageEvent(work.id, currentDate)
          mockEvents.push(event)
        }
      }
    }

    // Send events to the ingestion endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/usage-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockEvents),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: `Failed to ingest mock data: ${errorData.error}` },
        { status: 500 }
      )
    }

    const ingestResult = await response.json()

    return NextResponse.json({
      success: true,
      message: `Generated mock usage data for ${works.length} work(s)`,
      eventsGenerated: mockEvents.length,
      worksProcessed: works.map(w => ({ id: w.id, title: w.title })),
      ingestResult,
    })

  } catch (error) {
    console.error('Mock usage generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateRandomUsageEvent(workId: string, date: Date) {
  const eventTypes = ['stream', 'download', 'radio', 'sync'] as const
  const platforms = {
    stream: ['spotify', 'apple_music', 'youtube_music', 'tidal', 'deezer'],
    download: ['itunes', 'amazon_music', 'bandcamp', 'beatport'],
    radio: ['radio_station_fm', 'internet_radio', 'satellite_radio'],
    sync: ['tv_commercial', 'film_soundtrack', 'youtube_content', 'podcast']
  }

  // Weighted random selection (streams are most common)
  const eventTypeWeights = { stream: 0.6, download: 0.2, radio: 0.15, sync: 0.05 }
  const eventType = weightedRandomChoice(eventTypeWeights)
  
  const platformOptions = platforms[eventType]
  const platform = platformOptions[Math.floor(Math.random() * platformOptions.length)]

  // Generate realistic revenue amounts based on industry rates
  const revenueRates = {
    stream: () => Math.random() * 0.002 + 0.001, // $0.001-0.003 per stream
    download: () => Math.random() * 0.5 + 0.5, // $0.50-1.00 per download
    radio: () => Math.random() * 0.02 + 0.01, // $0.01-0.03 per radio play
    sync: () => Math.random() * 200 + 50, // $50-250 per sync deal
  }

  const revenueAmount = revenueRates[eventType]()

  // Generate counts based on event type
  let playCount = null
  let unitCount = null

  if (eventType === 'stream' || eventType === 'radio') {
    playCount = Math.floor(Math.random() * 1000) + 1
  } else if (eventType === 'download') {
    unitCount = Math.floor(Math.random() * 10) + 1
  }

  // Create period (events typically report for previous day/week)
  const periodEnd = new Date(date)
  const periodStart = new Date(date.getTime() - (24 * 60 * 60 * 1000)) // Previous day

  return {
    workId,
    eventType,
    platform,
    playCount,
    unitCount,
    revenueAmount: Number(revenueAmount.toFixed(4)),
    currency: 'SOL',
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  }
}

function weightedRandomChoice(weights: Record<string, number>): string {
  const entries = Object.entries(weights)
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let random = Math.random() * totalWeight

  for (const [key, weight] of entries) {
    random -= weight
    if (random <= 0) {
      return key
    }
  }

  return entries[0][0] // Fallback
}