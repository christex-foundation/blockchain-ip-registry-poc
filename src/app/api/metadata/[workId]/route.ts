import { NextRequest, NextResponse } from 'next/server'
import { WorkRepository } from '@/lib/repositories/work-repository'
import { ContributorRepository } from '@/lib/repositories/contributor-repository'
import { getAssetAttributes } from '@/lib/solana-server'

interface MetadataResponse {
  version: string
  type: string
  workId: string // Change from number to string to match database
  timestamp: string
  metadata: {
    name: string
    description: string
    image: string
    external_url: string
    attributes: Array<{
      trait_type: string
      value: string | number
    }>
    properties: {
      category: string
      files: unknown[]
      creators: Array<{
        address: string
        share: number
        name: string
      }>
      ip_data: {
        isrc?: string
        royalty_distribution: Array<{
          recipient: string
          recipient_name: string
          share_percentage: number
        }>
      }
    }
  }
  // Add database fields to match actual schema
  database_fields: {
    id: string
    title: string
    isrc: string | null
    total_shares: number | null
    nft_mint_address: string | null
    metadata_uri: string | null
    created_at: string | null
    updated_at: string | null
  }
  // Add on-chain attributes if available
  on_chain_attributes?: Array<{
    key: string
    value: string
  }>
}

export async function GET(request: NextRequest, { params }: { params: { workId: string } }) {
  try {
    const workId = params.workId

    // Validate workId format (should be UUID)
    if (!workId || workId.length < 10) {
      return NextResponse.json({ error: 'Invalid work ID format' }, { status: 400 })
    }

    // Fetch work from database
    const work = await WorkRepository.findById(workId.toString())
    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Fetch contributors
    const contributors = await ContributorRepository.findByWorkId(workId.toString())

    // Fetch on-chain attributes if NFT is minted
    let onChainAttributes: Array<{ key: string; value: string }> | undefined
    if (work.nft_mint_address) {
      try {
        const attributes = await getAssetAttributes(work.nft_mint_address)
        onChainAttributes = attributes || undefined
        console.log('Retrieved on-chain attributes:', onChainAttributes)
      } catch (error) {
        console.warn('Failed to fetch on-chain attributes:', error)
        // Continue without on-chain attributes
      }
    }

    // Build metadata response matching actual database schema
    const metadataResponse: MetadataResponse = {
      version: '1.0',
      type: 'ip-onchain-metadata',
      workId: work.id, // Use string ID from database
      timestamp: work.created_at || new Date().toISOString(),
      metadata: {
        name: work.title,
        description: `Intellectual Property Work: ${work.title}`,
        image: '', // Could be populated from work data if stored
        external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/works/${work.id}`,
        attributes: [
          {
            trait_type: 'ISRC',
            value: work.isrc || 'Not specified',
          },
          {
            trait_type: 'Contributors Count',
            value: contributors.length,
          },
          {
            trait_type: 'Total Shares',
            value: work.total_shares || 100,
          },
          {
            trait_type: 'Type',
            value: 'Intellectual Property',
          },
          {
            trait_type: 'Category',
            value: 'Music',
          },
          {
            trait_type: 'NFT Mint Address',
            value: work.nft_mint_address || 'Not minted',
          },
          {
            trait_type: 'Created At',
            value: work.created_at || 'Unknown',
          },
          {
            trait_type: 'Updated At',
            value: work.updated_at || 'Unknown',
          },
          // Add on-chain attributes to the off-chain metadata for compatibility
          ...(onChainAttributes?.map((attr) => ({
            trait_type: `OnChain: ${attr.key}`,
            value: attr.value,
          })) || []),
        ],
        properties: {
          category: 'music',
          files: [],
          creators: contributors.map((contributor) => ({
            address: contributor.wallet_address,
            share: contributor.royalty_share,
            name: contributor.name,
          })),
          ip_data: {
            isrc: work.isrc || undefined,
            royalty_distribution: contributors.map((contributor) => ({
              recipient: contributor.wallet_address,
              recipient_name: contributor.name,
              share_percentage: contributor.royalty_share,
            })),
          },
        },
      },
      // Include raw database fields for transparency
      database_fields: {
        id: work.id,
        title: work.title,
        isrc: work.isrc,
        total_shares: work.total_shares,
        nft_mint_address: work.nft_mint_address,
        metadata_uri: work.metadata_uri,
        created_at: work.created_at,
        updated_at: work.updated_at,
      },
      // Include on-chain attributes separately for easy access
      ...(onChainAttributes && { on_chain_attributes: onChainAttributes }),
    }

    // Set CORS headers for cross-origin access
    return NextResponse.json(metadataResponse, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Metadata-Source': onChainAttributes ? 'hybrid-on-off-chain' : 'off-chain-only',
      },
    })
  } catch (error) {
    console.error('Metadata retrieval error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
