import { NextRequest, NextResponse } from 'next/server'
import { verifyPrivyToken } from '@/lib/privy-server'

export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 401 })
    }

    // Verify the token
    const verifiedClaims = await verifyPrivyToken(accessToken)
    if (!verifiedClaims) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Parse request body
    const { workId, amount } = await request.json()

    if (!workId || !amount) {
      return NextResponse.json({ error: 'Work ID and amount are required' }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Fetch the work from database
    // 2. Get user's Solana wallet from Privy
    // 3. Calculate distributions based on contributor shares
    // 4. Execute the transactions using Privy's server wallet

    // For now, we'll simulate the distribution
    const mockDistribution = {
      workId,
      totalAmount: amount,
      distributions: [
        {
          recipient: 'Artist One',
          wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          amount: amount * 0.6, // 60% share
          signature: `mock_signature_${Date.now()}_1`,
        },
        {
          recipient: 'Producer',
          wallet: 'ByT7spdPJyxfLYD7bGhRZwXzGhWAhYWzXHJ7qJGbGqmH',
          amount: amount * 0.4, // 40% share
          signature: `mock_signature_${Date.now()}_2`,
        },
      ],
      timestamp: new Date().toISOString(),
      status: 'completed',
    }

    return NextResponse.json({
      success: true,
      distribution: mockDistribution,
    })
  } catch (error) {
    console.error('Royalty distribution error:', error)
    return NextResponse.json({ error: 'Failed to distribute royalties' }, { status: 500 })
  }
}
