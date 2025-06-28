import { NextRequest, NextResponse } from 'next/server'
import { verifyPrivyToken } from '@/lib/privy-server'
import { WorkRepository } from '@/lib/repositories/work-repository'

export async function GET(request: NextRequest) {
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

    // Get all works with contributors from database
    const worksWithContributors = await WorkRepository.findAllWithContributors()

    // Transform to API format
    const works = worksWithContributors.map((work) => ({
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
    }))

    return NextResponse.json({
      success: true,
      works: works,
      count: works.length,
    })
  } catch (error) {
    console.error('Works list error:', error)
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 })
  }
}
