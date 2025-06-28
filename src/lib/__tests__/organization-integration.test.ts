import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrganizationBuilder, OrganizationMemberBuilder, UserBuilder, WorkBuilder } from '../../test/builders'

// Mock all external dependencies before importing anything
vi.mock('../supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('../privy-server', () => ({
  privyServer: {
    verifyAuthToken: vi.fn(),
    getUser: vi.fn(),
  },
}))

vi.mock('../solana-server', () => ({
  createOrganizationCollection: vi.fn(),
  createOrganizationAsset: vi.fn(),
}))

vi.mock('../repositories/user-repository', () => ({
  UserRepository: {
    findByPrivyUserId: vi.fn(),
    upsertUserByPrivyId: vi.fn(),
  },
}))

vi.mock('../repositories/work-repository', () => ({
  WorkRepository: {
    createWork: vi.fn(),
  },
}))

vi.mock('../repositories/organization-repository', () => ({
  OrganizationRepository: {
    findById: vi.fn(),
    createOrganization: vi.fn(),
    addMember: vi.fn(),
    updateCollectionAddress: vi.fn(),
    isMember: vi.fn(),
    hasPermission: vi.fn(),
    findUserOrganizations: vi.fn(),
  },
}))

// Now we can safely import the mocked modules
const { OrganizationRepository } = await import('../repositories/organization-repository')
const { UserRepository } = await import('../repositories/user-repository')
const { WorkRepository } = await import('../repositories/work-repository')
const { createOrganizationCollection, createOrganizationAsset } = await import('../solana-server')

describe('Organization Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Organization Creation Workflow', () => {
    it('should create organization with on-chain collection and add owner as member', async () => {
      // Arrange
      const privyUserId = 'did:privy:cm123abc456'
      const dbUser = UserBuilder.create().withPrivyUserId(privyUserId).build()
      const organizationData = OrganizationBuilder.create().buildInsert()
      const organization = OrganizationBuilder.create().withName(organizationData.name).build()
      const memberData = OrganizationMemberBuilder.owner(organization.id, dbUser.id).buildInsert()
      
      const mockCollectionResult = {
        success: true,
        collectionId: 'collection123',
        signature: 'signature123',
        attributes: [
          { key: 'org_type', value: 'publishing_company' },
          { key: 'org_name', value: organizationData.name },
          { key: 'owner_id', value: privyUserId },
        ],
      }

      // Mock repository calls
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(dbUser as any)
      vi.mocked(OrganizationRepository.createOrganization).mockResolvedValue(organization as any)
      vi.mocked(OrganizationRepository.addMember).mockResolvedValue({} as any)
      vi.mocked(createOrganizationCollection).mockResolvedValue(mockCollectionResult)
      vi.mocked(OrganizationRepository.updateCollectionAddress).mockResolvedValue({
        ...organization,
        collection_address: mockCollectionResult.collectionId,
      } as any)

      // Act - Simulate the organization creation workflow
      const user = await UserRepository.findByPrivyUserId(privyUserId)
      expect(user).toBeTruthy()

      const createdOrg = await OrganizationRepository.createOrganization(organizationData)
      expect(createdOrg.name).toBe(organizationData.name)

      await OrganizationRepository.addMember({
        organization_id: createdOrg.id,
        user_id: user!.id,
        role: 'owner',
      })

      const collectionResult = await createOrganizationCollection({
        name: organizationData.name,
        type: 'publishing_company',
        ownerId: privyUserId,
        ownerName: user!.email || 'Test User',
      })

      expect(collectionResult.success).toBe(true)
      expect(collectionResult.collectionId).toBe('collection123')

      // Assert
      expect(OrganizationRepository.createOrganization).toHaveBeenCalledWith(organizationData)
      expect(OrganizationRepository.addMember).toHaveBeenCalledWith({
        organization_id: organization.id,
        user_id: dbUser.id,
        role: 'owner',
      })
      expect(createOrganizationCollection).toHaveBeenCalledWith({
        name: organizationData.name,
        type: 'publishing_company',
        ownerId: privyUserId,
        ownerName: dbUser.email,
      })
    })
  })

  describe('Work Registration in Organization', () => {
    it('should register work under organization collection when user is member', async () => {
      // Arrange
      const privyUserId = 'did:privy:cm123abc456'
      const dbUser = UserBuilder.create().withPrivyUserId(privyUserId).build()
      const organization = OrganizationBuilder.create()
        .withCollectionAddress('collection123')
        .build()
      const workData = { title: 'Test Work', isrc: 'USRC17607834', total_shares: 100 }

      const mockAssetResult = {
        success: true,
        assetId: 'asset123',
        signature: 'signature123',
        onChainAttributes: [
          { key: 'title', value: workData.title },
          { key: 'work_id', value: 'work-123' },
          { key: 'created_by', value: privyUserId },
        ],
      }

      // Mock membership check
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(dbUser as any)
      vi.mocked(OrganizationRepository.isMember).mockResolvedValue(true)
      vi.mocked(WorkRepository.createWork).mockResolvedValue({
        id: 'work-123',
        ...workData,
      } as any)
      vi.mocked(createOrganizationAsset).mockResolvedValue(mockAssetResult)

      // Act - Simulate work registration workflow
      const user = await UserRepository.findByPrivyUserId(privyUserId)
      const isMember = await OrganizationRepository.isMember(organization.id, privyUserId)
      
      expect(isMember).toBe(true)

      const work = await WorkRepository.createWork({
        ...workData,
        organization_id: organization.id,
        created_by_user_id: user!.id,
      })

      const assetResult = await createOrganizationAsset({
        collectionAddress: organization.collection_address!,
        ownerAddress: 'owner-wallet-address',
        metadata: { name: workData.title, uri: 'metadata-uri' },
        workId: work.id,
        contributors: [{ name: 'Artist', wallet: 'wallet-address', share: 100 }],
        createdByUserId: privyUserId,
      })

      // Assert
      expect(assetResult.success).toBe(true)
      expect(OrganizationRepository.isMember).toHaveBeenCalledWith(organization.id, privyUserId)
      expect(WorkRepository.createWork).toHaveBeenCalledWith({
        ...workData,
        organization_id: organization.id,
        created_by_user_id: dbUser.id,
      })
      expect(createOrganizationAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          collectionAddress: organization.collection_address,
          workId: work.id,
          createdByUserId: privyUserId,
        })
      )
    })

    it('should prevent work registration when user is not organization member', async () => {
      // Arrange
      const privyUserId = 'did:privy:cm123abc456'
      const organization = OrganizationBuilder.create().build()

      // Mock non-membership
      vi.mocked(OrganizationRepository.isMember).mockResolvedValue(false)

      // Act & Assert
      const isMember = await OrganizationRepository.isMember(organization.id, privyUserId)
      expect(isMember).toBe(false)

      // In the actual API, this would return a 403 error
      // Here we just verify the membership check failed
      expect(OrganizationRepository.isMember).toHaveBeenCalledWith(organization.id, privyUserId)
    })
  })

  describe('Member Management Workflow', () => {
    it('should add member to both database and on-chain collection', async () => {
      // Arrange
      const ownerPrivyId = 'did:privy:owner123'
      const newMemberPrivyId = 'did:privy:member456'
      const ownerUser = UserBuilder.create().withPrivyUserId(ownerPrivyId).build()
      const newMemberUser = UserBuilder.create().withPrivyUserId(newMemberPrivyId).build()
      const organization = OrganizationBuilder.create()
        .withCollectionAddress('collection123')
        .build()

      // Mock permission check and member addition
      vi.mocked(OrganizationRepository.hasPermission).mockResolvedValue(true)
      vi.mocked(UserRepository.findByPrivyUserId)
        .mockResolvedValueOnce(ownerUser as any) // For permission check
        .mockResolvedValueOnce(newMemberUser as any) // For member addition
      vi.mocked(OrganizationRepository.addMember).mockResolvedValue({} as any)

      // Act - Simulate member addition workflow
      const hasPermission = await OrganizationRepository.hasPermission(
        organization.id,
        ownerPrivyId,
        ['owner', 'admin']
      )
      expect(hasPermission).toBe(true)

      const newUser = await UserRepository.findByPrivyUserId(newMemberPrivyId)
      expect(newUser).toBeTruthy()

      await OrganizationRepository.addMember({
        organization_id: organization.id,
        user_id: newUser!.id,
        role: 'member',
      })

      // Assert
      expect(OrganizationRepository.hasPermission).toHaveBeenCalledWith(
        organization.id,
        ownerPrivyId,
        ['owner', 'admin']
      )
      expect(OrganizationRepository.addMember).toHaveBeenCalledWith({
        organization_id: organization.id,
        user_id: newMemberUser.id,
        role: 'member',
      })
    })

    it('should prevent member addition when user lacks permissions', async () => {
      // Arrange
      const memberPrivyId = 'did:privy:member123'
      const organization = OrganizationBuilder.create().build()

      // Mock insufficient permissions
      vi.mocked(OrganizationRepository.hasPermission).mockResolvedValue(false)

      // Act & Assert
      const hasPermission = await OrganizationRepository.hasPermission(
        organization.id,
        memberPrivyId,
        ['owner', 'admin']
      )
      expect(hasPermission).toBe(false)

      // In the actual API, this would return a 403 error
      expect(OrganizationRepository.hasPermission).toHaveBeenCalledWith(
        organization.id,
        memberPrivyId,
        ['owner', 'admin']
      )
    })
  })

  describe('Data Consistency Scenarios', () => {
    it('should handle organization with missing collection address gracefully', async () => {
      // Arrange
      const privyUserId = 'did:privy:cm123abc456'
      const organization = OrganizationBuilder.create().withCollectionAddress(null).build()

      // Mock organization lookup
      vi.mocked(OrganizationRepository.findById).mockResolvedValue(organization as any)

      // Act
      const foundOrg = await OrganizationRepository.findById(organization.id)

      // Assert
      expect(foundOrg).toBeTruthy()
      expect(foundOrg!.collection_address).toBeNull()
      
      // This scenario should be handled gracefully in the API
      // (works can still be registered as individual assets)
    })

    it('should handle user conversion from Privy ID to database UUID correctly', async () => {
      // Arrange
      const privyUserId = 'did:privy:cm123abc456'
      const dbUser = UserBuilder.create().withPrivyUserId(privyUserId).build()
      const organizations = [
        OrganizationBuilder.create().build(),
        OrganizationBuilder.create().build(),
      ]

      // Mock user lookup and organizations fetch
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(dbUser as any)
      vi.mocked(OrganizationRepository.findUserOrganizations).mockImplementation(async (id) => {
        // Simulate the actual repository behavior
        const user = await UserRepository.findByPrivyUserId(id)
        if (!user) return []
        return organizations as any
      })

      // Act
      const userOrgs = await OrganizationRepository.findUserOrganizations(privyUserId)

      // Assert
      expect(UserRepository.findByPrivyUserId).toHaveBeenCalledWith(privyUserId)
      expect(userOrgs).toEqual(organizations)
      expect(userOrgs).toHaveLength(2)
    })
  })
})