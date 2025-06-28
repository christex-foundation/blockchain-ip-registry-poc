import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrganizationRepository } from '../organization-repository'
import { UserRepository } from '../user-repository'
import { createServerSupabaseClient } from '../../supabase'

// Mock Supabase
vi.mock('../../supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}))

// Mock UserRepository
vi.mock('../user-repository', () => ({
  UserRepository: {
    findByPrivyUserId: vi.fn(),
  },
}))

const mockSupabaseClient = {
  from: vi.fn(),
}

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()

describe('OrganizationRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServerSupabaseClient).mockReturnValue(mockSupabaseClient as any)
    
    // Setup method chaining with proper return objects
    const selectChain = { eq: mockEq, order: mockOrder, single: mockSingle }
    const insertChain = { select: vi.fn().mockReturnValue({ single: mockSingle }) }
    const updateChain = { eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }) }
    const deleteChain = { eq: vi.fn().mockReturnValue({}) }
    
    mockSupabaseClient.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })
    
    mockSelect.mockReturnValue(selectChain)
    mockInsert.mockReturnValue(insertChain)
    mockUpdate.mockReturnValue(updateChain)
    mockDelete.mockReturnValue(deleteChain)
    
    mockEq.mockReturnValue({ single: mockSingle, order: mockOrder, eq: mockEq })
    mockOrder.mockReturnValue({ single: mockSingle, eq: mockEq })
    mockSingle.mockReturnValue({ eq: mockEq, select: mockSelect })
  })

  describe('findById', () => {
    it('should return organization when found', async () => {
      const mockOrganization = {
        id: 'org-1',
        name: 'Test Org',
        collection_address: 'collection123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSingle.mockResolvedValue({ data: mockOrganization, error: null })

      const result = await OrganizationRepository.findById('org-1')

      expect(result).toEqual(mockOrganization)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('organizations')
      expect(mockEq).toHaveBeenCalledWith('id', 'org-1')
    })

    it('should return null when organization not found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

      const result = await OrganizationRepository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should throw error on database error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Database error' } })

      await expect(OrganizationRepository.findById('org-1')).rejects.toThrow('Failed to find organization by ID: Database error')
    })
  })

  describe('findUserOrganizations', () => {
    it('should return empty array when user not found in database', async () => {
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(null)

      const result = await OrganizationRepository.findUserOrganizations('did:privy:123')

      expect(result).toEqual([])
      expect(UserRepository.findByPrivyUserId).toHaveBeenCalledWith('did:privy:123')
    })

    it('should return user organizations when user exists', async () => {
      const mockUser = { id: 'user-1', privy_user_id: 'did:privy:123' }
      const mockOrganizations = [
        { id: 'org-1', name: 'Org 1' },
        { id: 'org-2', name: 'Org 2' },
      ]

      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(mockUser as any)
      mockOrder.mockResolvedValue({ data: mockOrganizations, error: null })

      const result = await OrganizationRepository.findUserOrganizations('did:privy:123')

      expect(result).toEqual(mockOrganizations)
      expect(mockEq).toHaveBeenCalledWith('organization_members.user_id', 'user-1')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should throw error on database error', async () => {
      const mockUser = { id: 'user-1', privy_user_id: 'did:privy:123' }
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(mockUser as any)
      mockOrder.mockResolvedValue({ data: null, error: { message: 'Database error' } })

      await expect(OrganizationRepository.findUserOrganizations('did:privy:123')).rejects.toThrow('Failed to find user organizations: Database error')
    })
  })

  describe('createOrganization', () => {
    it('should create organization successfully', async () => {
      const organizationData = {
        name: 'New Org',
        collection_address: null,
      }
      const mockCreatedOrganization = {
        id: 'org-new',
        ...organizationData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSingle.mockResolvedValue({ data: mockCreatedOrganization, error: null })

      const result = await OrganizationRepository.createOrganization(organizationData)

      expect(result).toEqual(mockCreatedOrganization)
      expect(mockInsert).toHaveBeenCalledWith(organizationData)
    })

    it('should throw error on creation failure', async () => {
      const organizationData = { name: 'New Org', collection_address: null }
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Creation failed' } })

      await expect(OrganizationRepository.createOrganization(organizationData)).rejects.toThrow('Failed to create organization: Creation failed')
    })
  })

  describe('addMember', () => {
    it('should add member successfully', async () => {
      const memberData = {
        organization_id: 'org-1',
        user_id: 'user-1',
        role: 'member' as const,
      }
      const mockMember = {
        id: 'member-1',
        ...memberData,
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSingle.mockResolvedValue({ data: mockMember, error: null })

      const result = await OrganizationRepository.addMember(memberData)

      expect(result).toEqual(mockMember)
      expect(mockInsert).toHaveBeenCalledWith(memberData)
    })

    it('should throw specific error for duplicate member', async () => {
      const memberData = {
        organization_id: 'org-1',
        user_id: 'user-1',
        role: 'member' as const,
      }
      mockSingle.mockResolvedValue({ data: null, error: { code: '23505' } })

      await expect(OrganizationRepository.addMember(memberData)).rejects.toThrow('User is already a member of this organization')
    })

    it('should throw generic error for other failures', async () => {
      const memberData = {
        organization_id: 'org-1',
        user_id: 'user-1',
        role: 'member' as const,
      }
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })

      await expect(OrganizationRepository.addMember(memberData)).rejects.toThrow('Failed to add organization member: Insert failed')
    })
  })

  describe('getMemberRole', () => {
    it('should return role when user is member', async () => {
      const mockUser = { id: 'user-1', privy_user_id: 'did:privy:123' }
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(mockUser as any)
      mockSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })

      const result = await OrganizationRepository.getMemberRole('org-1', 'did:privy:123')

      expect(result).toBe('admin')
      expect(mockEq).toHaveBeenCalledWith('organization_id', 'org-1')
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('should return null when user not found in database', async () => {
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(null)

      const result = await OrganizationRepository.getMemberRole('org-1', 'did:privy:123')

      expect(result).toBeNull()
    })

    it('should return null when user is not a member', async () => {
      const mockUser = { id: 'user-1', privy_user_id: 'did:privy:123' }
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(mockUser as any)
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

      const result = await OrganizationRepository.getMemberRole('org-1', 'did:privy:123')

      expect(result).toBeNull()
    })
  })

  describe('isMember', () => {
    it('should return true when user has role', async () => {
      const mockUser = { id: 'user-1', privy_user_id: 'did:privy:123' }
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(mockUser as any)
      mockSingle.mockResolvedValue({ data: { role: 'member' }, error: null })

      const result = await OrganizationRepository.isMember('org-1', 'did:privy:123')

      expect(result).toBe(true)
    })

    it('should return false when user has no role', async () => {
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(null)

      const result = await OrganizationRepository.isMember('org-1', 'did:privy:123')

      expect(result).toBe(false)
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has required role', async () => {
      const mockUser = { id: 'user-1', privy_user_id: 'did:privy:123' }
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(mockUser as any)
      mockSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })

      const result = await OrganizationRepository.hasPermission('org-1', 'did:privy:123', ['admin', 'owner'])

      expect(result).toBe(true)
    })

    it('should return false when user role not in required roles', async () => {
      const mockUser = { id: 'user-1', privy_user_id: 'did:privy:123' }
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(mockUser as any)
      mockSingle.mockResolvedValue({ data: { role: 'member' }, error: null })

      const result = await OrganizationRepository.hasPermission('org-1', 'did:privy:123', ['admin', 'owner'])

      expect(result).toBe(false)
    })

    it('should return false when user is not a member', async () => {
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(null)

      const result = await OrganizationRepository.hasPermission('org-1', 'did:privy:123', ['admin', 'owner'])

      expect(result).toBe(false)
    })
  })
})