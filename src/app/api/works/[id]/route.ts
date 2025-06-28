import { NextRequest, NextResponse } from 'next/server'
import { verifyPrivyToken } from '@/lib/privy-server'
import { WorkRepository } from '@/lib/repositories/work-repository'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validate that ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'Work ID is required' },
        { status: 400 }
      )
    }

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

    // Fetch the work with contributors
    const work = await WorkRepository.findByIdWithContributors(id)

    if (!work) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      )
    }

    // Transform to API format
    const transformedWork = {
      id: work.id,
      title: work.title,
      isrc: work.isrc,
      contributors: work.contributors.map((contributor) => ({
        id: contributor.id,
        name: contributor.name,
        walletAddress: contributor.wallet_address,
        share: contributor.royalty_share,
      })),
      metadataUri: work.metadata_uri,
      mintAddress: work.nft_mint_address,
      createdAt: work.created_at,
      updatedAt: work.updated_at,
      status: work.nft_mint_address ? 'minted' : 'pending',
      totalShares: work.total_shares,
      organizationId: work.organization_id,
      createdByUserId: work.created_by_user_id,
    }

    return NextResponse.json({
      success: true,
      work: transformedWork,
    })
  } catch (error) {
    console.error('Failed to fetch work:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}