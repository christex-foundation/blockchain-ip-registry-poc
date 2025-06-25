import { NextRequest, NextResponse } from 'next/server'
import { WorkRepository } from '@/lib/repositories/work-repository'
import { ContributorRepository } from '@/lib/repositories/contributor-repository'

interface MetadataResponse {
  version: string
  type: string
  workId: number
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
}

export async function GET(request: NextRequest, { params }: { params: { workId: string } }) {
  try {
    const workId = parseInt(params.workId)

    if (isNaN(workId)) {
      return NextResponse.json({ error: 'Invalid work ID' }, { status: 400 })
    }

    // Fetch work from database
    const work = await WorkRepository.findById(workId.toString())
    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 })
    }

    // Fetch contributors
    const contributors = await ContributorRepository.findByWorkId(workId.toString())

    // Build metadata response
    const metadataResponse: MetadataResponse = {
      version: '1.0',
      type: 'ip-onchain-metadata',
      workId: parseInt(work.id),
      timestamp: typeof work.created_at === 'string' ? work.created_at : new Date().toISOString(),
      metadata: {
        name: work.title,
        description: `Intellectual Property Work: ${work.title}`,
        image: '', // Could be populated from work data if stored
        external_url: '', // Could link to a detail page
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
    }

    // Set CORS headers for cross-origin access
    return NextResponse.json(metadataResponse, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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
