import { NextRequest, NextResponse } from 'next/server'
import { verifyPrivyToken } from '@/lib/privy-server'
import { createWorkMetadata, uploadMetadataToIPFS } from '@/lib/solana-server'
import { WorkRepository } from '@/lib/repositories/work-repository'
import { ContributorRepository } from '@/lib/repositories/contributor-repository'
import { UserRepository } from '@/lib/repositories/user-repository'

interface ContributorData {
  name: string
  walletAddress: string
  share: number
}

interface WorkRegistrationData {
  title: string
  isrc?: string
  contributors: ContributorData[]
  description?: string
  imageUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 401 })
    }

    // Verify the token and get user info
    const verifiedClaims = await verifyPrivyToken(accessToken)
    if (!verifiedClaims) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Ensure user exists in our database
    await UserRepository.upsertUserByPrivyId({
      privy_user_id: verifiedClaims.userId,
      email: null, // Email will be available through Privy user data
      embedded_wallet_address: null, // Will be updated later when we get wallet info
    })

    // Parse request body
    const workData: WorkRegistrationData = await request.json()

    // Validate required fields
    if (!workData.title || !workData.contributors || !Array.isArray(workData.contributors)) {
      return NextResponse.json({ error: 'Title and contributors are required' }, { status: 400 })
    }

    // Validate contributors
    const totalShares = workData.contributors.reduce(
      (sum: number, contributor: ContributorData) => sum + contributor.share,
      0,
    )
    if (totalShares !== 100) {
      return NextResponse.json({ error: 'Contributor shares must total 100%' }, { status: 400 })
    }

    // Check if ISRC already exists
    if (workData.isrc) {
      const existingWork = await WorkRepository.findByISRC(workData.isrc)
      if (existingWork) {
        return NextResponse.json({ error: 'Work with this ISRC already exists' }, { status: 400 })
      }
    }

    // Create work record in database
    const work = await WorkRepository.createWork({
      title: workData.title,
      isrc: workData.isrc || null,
      total_shares: 100,
    })

    // Create contributors
    const contributorsData = workData.contributors.map((contributor: ContributorData) => ({
      work_id: work.id,
      name: contributor.name,
      wallet_address: contributor.walletAddress,
      royalty_share: contributor.share,
    }))

    const contributors = await ContributorRepository.createMultipleContributors(contributorsData)

    // Create metadata
    const metadata = createWorkMetadata({
      title: workData.title,
      isrc: workData.isrc,
      contributors: workData.contributors.map((contributor) => ({
        name: contributor.name,
        wallet: contributor.walletAddress,
        share: contributor.share,
      })),
      description: workData.description,
      imageUrl: workData.imageUrl,
    })

    // Upload metadata to IPFS
    const metadataUri = await uploadMetadataToIPFS(metadata)

    // Update work with metadata URI
    const updatedWork = await WorkRepository.updateMetadataUri(work.id, metadataUri)

    // For future: mint NFT and update with mint address
    // const mintResult = await mintWorkNFT(metadata, metadataUri)
    // await WorkRepository.updateNftMintAddress(work.id, mintResult.mintAddress)

    return NextResponse.json({
      success: true,
      work: {
        id: updatedWork.id,
        title: updatedWork.title,
        isrc: updatedWork.isrc,
        contributors: contributors.map((c) => ({
          id: c.id,
          name: c.name,
          walletAddress: c.wallet_address,
          share: c.royalty_share,
        })),
        metadataUri: updatedWork.metadata_uri,
        mintAddress: updatedWork.nft_mint_address,
        createdAt: updatedWork.created_at,
        createdBy: verifiedClaims.userId,
      },
    })
  } catch (error) {
    console.error('Work registration error:', error)
    return NextResponse.json({ error: 'Failed to register work' }, { status: 500 })
  }
}
