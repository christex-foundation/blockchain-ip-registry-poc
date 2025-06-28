import { NextRequest, NextResponse } from 'next/server'
import { verifyPrivyToken } from '@/lib/privy-server'
import { WorkRepository } from '@/lib/repositories/work-repository'
import { RoyaltyRepository } from '@/lib/repositories/royalty-repository'

interface RoyaltyDistributionRequest {
  workId: string
  amount: number
}

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
    const { workId, amount }: RoyaltyDistributionRequest = await request.json()

    if (!workId || !amount) {
      return NextResponse.json({ error: 'Work ID and amount are required' }, { status: 400 })
    }

    // Fetch the work with contributors from database
    const work = await WorkRepository.findByIdWithContributors(workId)
    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Validate that contributors exist and shares are valid
    if (!work.contributors || work.contributors.length === 0) {
      return NextResponse.json({ error: 'No contributors found for this work' }, { status: 400 })
    }

    // Validate total shares
    const totalShares = work.contributors.reduce((sum, contributor) => sum + contributor.royalty_share, 0)
    if (totalShares !== 100) {
      return NextResponse.json({ error: 'Invalid contributor shares configuration' }, { status: 400 })
    }

    // Create royalty distribution record
    const royaltyDistribution = await RoyaltyRepository.createRoyaltyDistribution({
      work_id: workId,
      total_amount: amount,
      status: 'processing',
    })

    // Calculate distributions based on contributor shares
    const distributions = work.contributors.map((contributor) => ({
      contributorId: contributor.id,
      recipient: contributor.name,
      walletAddress: contributor.wallet_address,
      share: contributor.royalty_share,
      amount: Math.floor((amount * contributor.royalty_share) / 100), // Convert to lamports/smallest unit
      signature: null, // Will be populated when actual transaction is executed
    }))

    // For now, we'll simulate the transaction execution
    // In a real implementation, you would:
    // 1. Get user's Solana wallet from Privy
    // 2. Execute the transactions using Privy's server wallet
    // 3. Update the distribution record with transaction signatures

    const mockTransactionSignature = `mock_signature_${Date.now()}`

    // Update the distribution as completed
    const completedDistribution = await RoyaltyRepository.markAsCompleted(
      royaltyDistribution.id,
      mockTransactionSignature,
    )

    return NextResponse.json({
      success: true,
      distribution: {
        id: completedDistribution.id,
        workId: work.id,
        workTitle: work.title,
        totalAmount: amount,
        distributions: distributions,
        transactionSignature: mockTransactionSignature,
        timestamp: completedDistribution.created_at,
        status: completedDistribution.status,
      },
    })
  } catch (error) {
    console.error('Royalty distribution error:', error)
    return NextResponse.json({ error: 'Failed to distribute royalties' }, { status: 500 })
  }
}
