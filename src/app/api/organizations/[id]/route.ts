import { NextRequest, NextResponse } from 'next/server'
import { privyServer } from '@/lib/privy-server'
import { OrganizationRepository } from '@/lib/repositories/organization-repository'
import { getCollectionData } from '@/lib/solana-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!authToken) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
    }

    const { userId } = await privyServer.verifyAuthToken(authToken)
    
    const organization = await OrganizationRepository.findByIdWithMembers(params.id)
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    // Check if user is a member
    const isMember = await OrganizationRepository.isMember(organization.id, userId)
    
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get on-chain collection data if collection exists
    let collectionData = null
    if (organization.collection_address) {
      collectionData = await getCollectionData(organization.collection_address)
    }
    
    return NextResponse.json({
      organization,
      collection: collectionData,
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}