import { NextRequest, NextResponse } from 'next/server'
import { privyServer } from '@/lib/privy-server'
import { UserRepository } from '@/lib/repositories/user-repository'
import { UsageEventsRepository } from '@/lib/repositories/usage-events-repository'

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const claims = await privyServer.verifyAuthToken(token)
    const privyUserId = claims.userId

    // Convert Privy user ID to database user
    const user = await UserRepository.findByPrivyUserId(privyUserId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly'
    const workId = searchParams.get('workId')

    // Determine the number of days based on period
    const days = period === 'weekly' ? 7 : 30

    // Get trend data
    const trends = await UsageEventsRepository.getRecentTrends(workId || undefined, days)

    return NextResponse.json({
      period,
      currentPeriod: trends.currentPeriod,
      previousPeriod: trends.previousPeriod,
      percentageChange: trends.percentageChange,
      trend: trends.percentageChange >= 0 ? 'up' : 'down',
    })
  } catch (error) {
    console.error('Trends fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 })
  }
}
