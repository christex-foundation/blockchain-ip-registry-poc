import { NextRequest, NextResponse } from 'next/server'
import { verifyPrivyToken } from '@/lib/privy-server'
import {
  createWorkMetadata,
  createMetadataReference,
  mintWorkNFT,
  createOrganizationAsset,
  getUserSolanaWalletFromPrivy,
} from '@/lib/solana-server'
import { WorkRepository } from '@/lib/repositories/work-repository'
import { ContributorRepository } from '@/lib/repositories/contributor-repository'
import { UserRepository } from '@/lib/repositories/user-repository'
import { OrganizationRepository } from '@/lib/repositories/organization-repository'

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
  organizationId?: string
}

// ISRC format validation regex
const ISRC_REGEX = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/

export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 401 })
    }

    // Verify the token and get user info
    let verifiedClaims
    try {
      verifiedClaims = await verifyPrivyToken(accessToken)
      if (!verifiedClaims) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
      }
    } catch (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // Get user's Solana wallet from Privy
    let userWallet
    try {
      userWallet = await getUserSolanaWalletFromPrivy(verifiedClaims.userId)
    } catch (walletError) {
      console.error('Wallet retrieval error:', walletError)
      return NextResponse.json(
        {
          error: 'User must have a Solana wallet connected to register works',
        },
        { status: 400 },
      )
    }

    // Ensure user exists in our database
    const dbUser = await UserRepository.upsertUserByPrivyId({
      privy_user_id: verifiedClaims.userId,
      email: null, // Email will be available through Privy user data
      embedded_wallet_address: userWallet.address,
    })

    // Parse request body
    const workData: WorkRegistrationData = await request.json()

    // Validate required fields
    if (!workData.title || !workData.contributors || !Array.isArray(workData.contributors)) {
      return NextResponse.json({ error: 'Title and contributors are required' }, { status: 400 })
    }

    // Validate ISRC format if provided
    if (workData.isrc && !ISRC_REGEX.test(workData.isrc)) {
      return NextResponse.json({ error: 'Invalid ISRC format' }, { status: 400 })
    }

    // Validate contributors
    const totalShares = workData.contributors.reduce(
      (sum: number, contributor: ContributorData) => sum + contributor.share,
      0,
    )
    if (totalShares !== 100) {
      return NextResponse.json({ error: 'Contributor shares must total 100%' }, { status: 400 })
    }

    // Validate wallet addresses
    for (const contributor of workData.contributors) {
      if (!contributor.walletAddress || contributor.walletAddress.length < 32) {
        return NextResponse.json(
          {
            error: `Invalid wallet address for contributor: ${contributor.name}`,
          },
          { status: 400 },
        )
      }
    }

    // Check if ISRC already exists
    if (workData.isrc) {
      const existingWork = await WorkRepository.findByISRC(workData.isrc)
      if (existingWork) {
        return NextResponse.json({ error: 'Work with this ISRC already exists' }, { status: 400 })
      }
    }

    // Validate organization if provided
    let organization = null
    if (workData.organizationId) {
      organization = await OrganizationRepository.findById(workData.organizationId)
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
      }

      // Check if user is a member of the organization
      const isMember = await OrganizationRepository.isMember(organization.id, verifiedClaims.userId)
      if (!isMember) {
        return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 403 })
      }
    }

    // Create work record in database
    const work = await WorkRepository.createWork({
      title: workData.title,
      isrc: workData.isrc || null,
      total_shares: 100,
      organization_id: workData.organizationId || null,
      created_by_user_id: dbUser.id,
    })

    // Create contributors
    const contributorsData = workData.contributors.map((contributor: ContributorData) => ({
      work_id: work.id,
      name: contributor.name,
      wallet_address: contributor.walletAddress,
      royalty_share: contributor.share,
    }))

    const contributors = await ContributorRepository.createMultipleContributors(contributorsData)

    // Create metadata using the new server-side approach
    const { coreMetadata, extendedMetadata } = createWorkMetadata({
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

    // Create metadata reference (hybrid on-chain/off-chain approach)
    const metadataUri = await createMetadataReference(parseInt(work.id), extendedMetadata)

    // Update work with metadata URI
    const updatedWork = await WorkRepository.updateMetadataUri(work.id, metadataUri)

    // Mint NFT using server-side Metaplex Core (with organization support)
    try {
      let mintResult

      if (organization && organization.collection_address) {
        // Mint as part of organization collection
        mintResult = await createOrganizationAsset({
          collectionAddress: organization.collection_address,
          ownerAddress: userWallet.address,
          metadata: {
            name: coreMetadata.name,
            uri: metadataUri,
          },
          workId: work.id,
          contributors: workData.contributors.map((contributor) => ({
            name: contributor.name,
            wallet: contributor.walletAddress,
            share: contributor.share,
          })),
          isrc: workData.isrc,
          description: workData.description,
          createdByUserId: verifiedClaims.userId,
        })
      } else {
        // Mint as individual work (existing behavior)
        mintResult = await mintWorkNFT({
          workId: work.id,
          ownerAddress: userWallet.address,
          metadata: {
            name: coreMetadata.name,
            uri: metadataUri,
          },
          contributors: workData.contributors.map((contributor) => ({
            name: contributor.name,
            wallet: contributor.walletAddress,
            share: contributor.share,
          })),
          isrc: workData.isrc,
          description: workData.description,
        })
      }

      // Update work with NFT mint address (convert PublicKey to string)
      const finalWork = await WorkRepository.updateNftMintAddress(work.id, mintResult.assetId.toString())

      console.log('Work registered and NFT minted successfully with on-chain attributes:', {
        workId: work.id,
        assetId: mintResult.assetId.toString(),
        signature: mintResult.signature,
        onChainAttributes: mintResult.onChainAttributes,
      })

      return NextResponse.json({
        success: true,
        work: {
          id: finalWork.id,
          title: finalWork.title,
          isrc: finalWork.isrc,
          contributors: contributors.map((c) => ({
            id: c.id,
            name: c.name,
            walletAddress: c.wallet_address,
            share: c.royalty_share,
          })),
          metadataUri: finalWork.metadata_uri,
          mintAddress: finalWork.nft_mint_address,
          createdAt: finalWork.created_at,
          createdBy: verifiedClaims.userId,
        },
        nft: {
          assetId: mintResult.assetId.toString(),
          signature: mintResult.signature,
          explorerUrl: `https://core.metaplex.com/explorer/${mintResult.assetId.toString()}?env=devnet`,
          onChainAttributes: mintResult.onChainAttributes,
        },
      })
    } catch (mintError) {
      console.error('NFT minting failed:', mintError)

      // Return work data even if minting failed - user can retry minting later
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
          mintAddress: null,
          createdAt: updatedWork.created_at,
          createdBy: verifiedClaims.userId,
        },
        warning: 'Work registered but NFT minting failed. Please try again.',
        error: mintError instanceof Error ? mintError.message : 'Unknown minting error',
      })
    }
  } catch (error) {
    console.error('Work registration error:', error)
    return NextResponse.json(
      {
        error: 'Failed to register work',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
