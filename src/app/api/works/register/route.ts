import { NextRequest, NextResponse } from 'next/server'
import { verifyPrivyToken } from '@/lib/privy-server'
import { createWorkMetadata, uploadMetadataToIPFS, mintWorkNFT } from '@/lib/solana-server'

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
    const workData = await request.json()

    // Validate required fields
    if (!workData.title || !workData.contributors || !Array.isArray(workData.contributors)) {
      return NextResponse.json({ error: 'Title and contributors are required' }, { status: 400 })
    }

    // Validate contributors
    const totalShares = workData.contributors.reduce((sum: number, contributor: any) => sum + contributor.share, 0)
    if (totalShares !== 100) {
      return NextResponse.json({ error: 'Contributor shares must total 100%' }, { status: 400 })
    }

    // Create metadata
    const metadata = createWorkMetadata({
      title: workData.title,
      isrc: workData.isrc,
      contributors: workData.contributors,
      description: workData.description,
      imageUrl: workData.imageUrl,
    })

    // Upload metadata to IPFS
    const metadataUri = await uploadMetadataToIPFS(metadata)

    // For now, we'll return the metadata and URI without actually minting
    // In a full implementation, you would mint the NFT here

    return NextResponse.json({
      success: true,
      work: {
        id: `work_${Date.now()}`, // Generate a temporary ID
        title: workData.title,
        isrc: workData.isrc,
        contributors: workData.contributors,
        metadata,
        metadataUri,
        createdAt: new Date().toISOString(),
        createdBy: verifiedClaims.userId,
      },
    })
  } catch (error) {
    console.error('Work registration error:', error)
    return NextResponse.json({ error: 'Failed to register work' }, { status: 500 })
  }
}
