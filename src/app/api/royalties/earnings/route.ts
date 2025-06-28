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
    const workId = searchParams.get('workId')

    if (workId) {
      // Get earnings for specific work
      const earnings = await UsageEventsRepository.getEarningsForWork(workId)
      return NextResponse.json(
        earnings || {
          total_earnings: 0,
          performance_earnings: 0,
          mechanical_earnings: 0,
          sync_earnings: 0,
        },
      )
    } else {
      // Get total earnings for user
      const totalEarnings = await UsageEventsRepository.getTotalEarningsForUser(user.id)
      return NextResponse.json({ total_earnings: totalEarnings })
    }
  } catch (error) {
    console.error('Earnings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
  }
}
