import { NextRequest, NextResponse } from 'next/server'
import { privyServer } from '@/lib/privy-server'
import { OrganizationRepository } from '@/lib/repositories/organization-repository'
import { UserRepository } from '@/lib/repositories/user-repository'
import { addOrganizationMember, getOrganizationMembers } from '@/lib/solana-server'

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
    
    const organization = await OrganizationRepository.findById(params.id)
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    // Check if user is a member
    const isMember = await OrganizationRepository.isMember(organization.id, userId)
    
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get members from both database and on-chain
    const dbMembers = await OrganizationRepository.findByIdWithMembers(params.id)
    
    let onChainMembers = []
    if (organization.collection_address) {
      onChainMembers = await getOrganizationMembers(organization.collection_address)
    }
    
    return NextResponse.json({
      databaseMembers: dbMembers?.members || [],
      onChainMembers,
    })
  } catch (error) {
    console.error('Error fetching organization members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization members' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!authToken) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
    }

    const { userId } = await privyServer.verifyAuthToken(authToken)
    
    const organization = await OrganizationRepository.findById(params.id)
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    // Check if user has admin/owner permissions
    const hasPermission = await OrganizationRepository.hasPermission(
      organization.id,
      userId,
      ['owner', 'admin']
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const body = await request.json()
    const { userId: newPrivyUserId, role } = body
    
    if (!newPrivyUserId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }
    
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be admin or member' },
        { status: 400 }
      )
    }
    
    // Find the user in our database
    const newUser = await UserRepository.findByPrivyUserId(newPrivyUserId)
    if (!newUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 400 }
      )
    }
    
    // Get user info for on-chain member addition
    const user = await privyServer.getUser(newPrivyUserId)
    
    // Add member to database using internal user ID
    const member = await OrganizationRepository.addMember({
      organization_id: organization.id,
      user_id: newUser.id,
      role,
    })
    
    // Add member to on-chain collection
    let onChainResult = null
    if (organization.collection_address) {
      onChainResult = await addOrganizationMember({
        collectionAddress: organization.collection_address,
        userId: newPrivyUserId,
        userName: user.email?.address || 'Unknown User',
        role,
      })
    }
    
    return NextResponse.json({
      member,
      onChain: onChainResult,
    })
  } catch (error) {
    console.error('Error adding organization member:', error)
    
    if (error instanceof Error && error.message.includes('already a member')) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to add organization member' },
      { status: 500 }
    )
  }
}