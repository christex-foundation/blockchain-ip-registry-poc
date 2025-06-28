import { NextRequest, NextResponse } from 'next/server'
import { privyServer } from '@/lib/privy-server'
import { OrganizationRepository } from '@/lib/repositories/organization-repository'
import { UserRepository } from '@/lib/repositories/user-repository'
import { createOrganizationCollection } from '@/lib/solana-server'

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!authToken) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
    }

    const { userId } = await privyServer.verifyAuthToken(authToken)
    
    const organizations = await OrganizationRepository.findUserOrganizations(userId)
    
    return NextResponse.json({ organizations })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!authToken) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
    }

    const { userId } = await privyServer.verifyAuthToken(authToken)
    const user = await privyServer.getUser(userId)
    
    // Ensure user exists in our database
    const dbUser = await UserRepository.findByPrivyUserId(userId)
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database. Please register first.' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { name, type, description, imageUrl } = body
    
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }
    
    if (!['publishing_company', 'individual_artist'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be publishing_company or individual_artist' },
        { status: 400 }
      )
    }
    
    // Create organization in database first
    const organization = await OrganizationRepository.createOrganization({
      name,
      collection_address: null,
    })
    
    // Add creator as owner using database user ID
    await OrganizationRepository.addMember({
      organization_id: organization.id,
      user_id: dbUser.id,
      role: 'owner',
    })
    
    // Create Core collection on-chain
    const collectionResult = await createOrganizationCollection({
      name,
      type,
      ownerId: userId,
      ownerName: user.email?.address,
      description,
      imageUrl,
    })
    
    if (!collectionResult.success) {
      throw new Error('Failed to create organization collection on-chain')
    }
    
    // Update organization with collection address
    const updatedOrganization = await OrganizationRepository.updateCollectionAddress(
      organization.id,
      collectionResult.collectionId
    )
    
    return NextResponse.json({
      organization: updatedOrganization,
      collection: {
        address: collectionResult.collectionId,
        signature: collectionResult.signature,
        attributes: collectionResult.attributes,
      },
    })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}