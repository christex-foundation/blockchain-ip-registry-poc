import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { privyServer } from '@/lib/privy-server'
import { OrganizationRepository } from '@/lib/repositories/organization-repository'
import { UserRepository } from '@/lib/repositories/user-repository'
import { createOrganizationCollection } from '@/lib/solana-server'

// Mock dependencies
vi.mock('@/lib/privy-server', () => ({
  privyServer: {
    verifyAuthToken: vi.fn(),
    getUser: vi.fn(),
  },
}))

vi.mock('@/lib/repositories/organization-repository', () => ({
  OrganizationRepository: {
    findUserOrganizations: vi.fn(),
    createOrganization: vi.fn(),
    addMember: vi.fn(),
    updateCollectionAddress: vi.fn(),
  },
}))

vi.mock('@/lib/repositories/user-repository', () => ({
  UserRepository: {
    findByPrivyUserId: vi.fn(),
  },
}))

vi.mock('@/lib/solana-server', () => ({
  createOrganizationCollection: vi.fn(),
}))

const createMockRequest = (authToken?: string, body?: any) => {
  const headers = new Headers()
  if (authToken) {
    headers.set('authorization', `Bearer ${authToken}`)
  }
  
  return new NextRequest('http://localhost:3000/api/organizations', {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('/api/organizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/organizations', () => {
    it('should return user organizations successfully', async () => {
      const mockOrganizations = [
        { id: 'org-1', name: 'Test Org 1', collection_address: 'collection1' },
        { id: 'org-2', name: 'Test Org 2', collection_address: null },
      ]

      vi.mocked(privyServer.verifyAuthToken).mockResolvedValue({ userId: 'did:privy:123' })
      vi.mocked(OrganizationRepository.findUserOrganizations).mockResolvedValue(mockOrganizations as any)

      const request = createMockRequest('valid-token')
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.organizations).toEqual(mockOrganizations)
      expect(OrganizationRepository.findUserOrganizations).toHaveBeenCalledWith('did:privy:123')
    })

    it('should return 401 when no auth token provided', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('No authorization token provided')
    })

    it('should return 500 on repository error', async () => {
      vi.mocked(privyServer.verifyAuthToken).mockResolvedValue({ userId: 'did:privy:123' })
      vi.mocked(OrganizationRepository.findUserOrganizations).mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('valid-token')
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Failed to fetch organizations')
    })
  })

  describe('POST /api/organizations', () => {
    const validOrganizationData = {
      name: 'Test Organization',
      type: 'publishing_company',
      description: 'A test organization',
      imageUrl: 'https://example.com/logo.png',
    }

    it('should create organization successfully', async () => {
      const mockUser = { id: 'user-1', privy_user_id: 'did:privy:123' }
      const mockOrganization = {
        id: 'org-1',
        name: 'Test Organization',
        collection_address: null,
      }
      const mockUpdatedOrganization = {
        ...mockOrganization,
        collection_address: 'collection123',
      }
      const mockCollectionResult = {
        success: true,
        collectionId: 'collection123',
        signature: 'signature123',
        attributes: [],
      }

      vi.mocked(privyServer.verifyAuthToken).mockResolvedValue({ userId: 'did:privy:123' })
      vi.mocked(privyServer.getUser).mockResolvedValue({ email: { address: 'test@example.com' } } as any)
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(mockUser as any)
      vi.mocked(OrganizationRepository.createOrganization).mockResolvedValue(mockOrganization as any)
      vi.mocked(OrganizationRepository.addMember).mockResolvedValue({} as any)
      vi.mocked(createOrganizationCollection).mockResolvedValue(mockCollectionResult)
      vi.mocked(OrganizationRepository.updateCollectionAddress).mockResolvedValue(mockUpdatedOrganization as any)

      const request = createMockRequest('valid-token', validOrganizationData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.organization).toEqual(mockUpdatedOrganization)
      expect(responseData.collection.address).toBe('collection123')
      expect(OrganizationRepository.addMember).toHaveBeenCalledWith({
        organization_id: 'org-1',
        user_id: 'user-1',
        role: 'owner',
      })
    })

    it('should return 400 when user not found in database', async () => {
      vi.mocked(privyServer.verifyAuthToken).mockResolvedValue({ userId: 'did:privy:123' })
      vi.mocked(privyServer.getUser).mockResolvedValue({ email: { address: 'test@example.com' } } as any)
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(null)

      const request = createMockRequest('valid-token', validOrganizationData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('User not found in database. Please register first.')
    })

    it('should return 400 when name is missing', async () => {
      const invalidData = { ...validOrganizationData, name: '' }

      vi.mocked(privyServer.verifyAuthToken).mockResolvedValue({ userId: 'did:privy:123' })
      vi.mocked(privyServer.getUser).mockResolvedValue({ email: { address: 'test@example.com' } } as any)
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue({ id: 'user-1' } as any)

      const request = createMockRequest('valid-token', invalidData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Name and type are required')
    })

    it('should return 400 when type is invalid', async () => {
      const invalidData = { ...validOrganizationData, type: 'invalid_type' }

      vi.mocked(privyServer.verifyAuthToken).mockResolvedValue({ userId: 'did:privy:123' })
      vi.mocked(privyServer.getUser).mockResolvedValue({ email: { address: 'test@example.com' } } as any)
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue({ id: 'user-1' } as any)

      const request = createMockRequest('valid-token', invalidData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Type must be publishing_company or individual_artist')
    })

    it('should return 500 when collection creation fails', async () => {
      const mockUser = { id: 'user-1', privy_user_id: 'did:privy:123' }
      const mockOrganization = { id: 'org-1', name: 'Test Organization' }

      vi.mocked(privyServer.verifyAuthToken).mockResolvedValue({ userId: 'did:privy:123' })
      vi.mocked(privyServer.getUser).mockResolvedValue({ email: { address: 'test@example.com' } } as any)
      vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(mockUser as any)
      vi.mocked(OrganizationRepository.createOrganization).mockResolvedValue(mockOrganization as any)
      vi.mocked(OrganizationRepository.addMember).mockResolvedValue({} as any)
      vi.mocked(createOrganizationCollection).mockResolvedValue({ success: false })

      const request = createMockRequest('valid-token', validOrganizationData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Failed to create organization')
    })

    it('should return 401 when no auth token provided', async () => {
      const request = createMockRequest(undefined, validOrganizationData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('No authorization token provided')
    })
  })
})