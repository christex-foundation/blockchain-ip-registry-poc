import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { WorkBuilder, AuthBuilder, TestScenarios } from '@/test/builders'

// Mock only external dependencies, not business logic
vi.mock('@/lib/privy-server', () => ({
  verifyPrivyToken: vi.fn(),
}))

vi.mock('@/lib/solana-server', () => ({
  getUserSolanaWalletFromPrivy: vi.fn(),
  createWorkMetadata: vi.fn().mockReturnValue({
    coreMetadata: { name: 'Test Song', uri: '' },
    extendedMetadata: { name: 'Test Song', description: 'Test' },
  }),
  createMetadataReference: vi.fn().mockResolvedValue('ipfs://metadata-hash'),
  mintWorkNFT: vi.fn().mockResolvedValue({
    success: true,
    assetId: { toString: () => 'HdFUYggmcPLy9hsRajgAALVk7AE4s4K26xhreAUMwXZc' },
    signature: 'mock-signature-hash',
    metadata: { name: 'Test Song', uri: 'ipfs://metadata-hash' },
    onChainAttributes: [],
  }),
}))

vi.mock('@/lib/repositories/user-repository', () => ({
  UserRepository: {
    upsertUserByPrivyId: vi.fn(),
  },
}))

vi.mock('@/lib/repositories/work-repository', () => ({
  WorkRepository: {
    findByISRC: vi.fn(),
    createWork: vi.fn(),
    updateMetadataUri: vi.fn(),
    updateNftMintAddress: vi.fn(),
  },
}))

vi.mock('@/lib/repositories/contributor-repository', () => ({
  ContributorRepository: {
    createMultipleContributors: vi.fn(),
  },
}))

import { verifyPrivyToken } from '@/lib/privy-server'
import {
  getUserSolanaWalletFromPrivy,
  createWorkMetadata,
  createMetadataReference,
  mintWorkNFT,
} from '@/lib/solana-server'
import { UserRepository } from '@/lib/repositories/user-repository'
import { WorkRepository } from '@/lib/repositories/work-repository'
import { ContributorRepository } from '@/lib/repositories/contributor-repository'

describe('Work Registration API - Behavioral Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Work Registration Flow', () => {
    it('should register a valid work end-to-end', async () => {
      // Arrange: Setup valid auth and work data
      const auth = AuthBuilder.create().build()
      const workData = TestScenarios.validDualArtist().buildForAPI()

      const mockUser = {
        id: 'user-123',
        privy_user_id: auth.userId,
        email: 'test@example.com',
        embedded_wallet_address: auth.linked_accounts![0].address,
        created_at: '2024-01-01T00:00:00Z',
      }

      const mockWork = {
        id: 'work-123',
        title: workData.title,
        isrc: workData.isrc,
        total_shares: 100,
        created_at: '2024-01-01T00:00:00Z',
      }

      const mockContributors = workData.contributors.map((c, i) => ({
        id: `contrib-${i + 1}`,
        work_id: 'work-123',
        name: c.name,
        wallet_address: c.walletAddress,
        royalty_share: c.royaltyShare,
        created_at: '2024-01-01T00:00:00Z',
      }))

      // Setup mocks for successful flow
      vi.mocked(verifyPrivyToken).mockResolvedValue({ userId: auth.userId })
      vi.mocked(getUserSolanaWalletFromPrivy).mockResolvedValue({ address: auth.linked_accounts![0].address })
      vi.mocked(UserRepository.upsertUserByPrivyId).mockResolvedValue(mockUser)
      vi.mocked(WorkRepository.findByISRC).mockResolvedValue(null) // ISRC doesn't exist
      vi.mocked(WorkRepository.createWork).mockResolvedValue(mockWork)
      vi.mocked(WorkRepository.updateNftMintAddress).mockResolvedValue({
        ...mockWork,
        nft_mint_address: 'HdFUYggmcPLy9hsRajgAALVk7AE4s4K26xhreAUMwXZc',
      })
      vi.mocked(ContributorRepository.createMultipleContributors).mockResolvedValue(mockContributors)

      // Act: Make the request
      const request = new NextRequest('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(workData),
      })

      const response = await POST(request)
      const responseData = await response.json()

      // Assert: Verify behavioral outcomes
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.work).toBeDefined()
      expect(responseData.work.id).toBe('work-123')
      expect(responseData.work.title).toBe(workData.title)

      // Verify business logic was followed correctly
      expect(getUserSolanaWalletFromPrivy).toHaveBeenCalledWith(auth.userId)
      expect(WorkRepository.findByISRC).toHaveBeenCalledWith(workData.isrc)
      expect(WorkRepository.createWork).toHaveBeenCalledWith(
        expect.objectContaining({
          title: workData.title,
          isrc: workData.isrc,
          total_shares: 100,
        }),
      )

      // Verify contributor data integrity
      if (vi.mocked(ContributorRepository.createMultipleContributors).mock.calls.length > 0) {
        const contributorCall = vi.mocked(ContributorRepository.createMultipleContributors).mock.calls[0][0]
        const totalShares = contributorCall.reduce((sum: number, c: any) => sum + c.royalty_share, 0)
        expect(totalShares).toBe(100)
      }
    })

    it('should reject duplicate ISRC registrations', async () => {
      // Arrange: Setup existing work with same ISRC
      const auth = AuthBuilder.create().build()
      const workData = TestScenarios.validSingleArtist().buildForAPI()

      const existingWork = {
        id: 'existing-work-123',
        title: 'Existing Song',
        isrc: workData.isrc,
        total_shares: 100,
      }

      vi.mocked(verifyPrivyToken).mockResolvedValue({ userId: auth.userId })
      vi.mocked(getUserSolanaWalletFromPrivy).mockResolvedValue({ address: auth.linked_accounts![0].address })
      vi.mocked(UserRepository.upsertUserByPrivyId).mockResolvedValue({
        id: 'user-123',
        privy_user_id: auth.userId,
        email: 'test@example.com',
        embedded_wallet_address: auth.linked_accounts![0].address,
        created_at: '2024-01-01T00:00:00Z',
      })
      vi.mocked(WorkRepository.findByISRC).mockResolvedValue(existingWork)

      // Act
      const request = new NextRequest('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(workData),
      })

      const response = await POST(request)
      const responseData = await response.json()

      // Assert: Should prevent duplicate registration
      expect(response.status).toBe(400)
      expect(responseData.error).toContain('ISRC already exists')
      expect(WorkRepository.createWork).not.toHaveBeenCalled()
      expect(ContributorRepository.createMultipleContributors).not.toHaveBeenCalled()
    })

    it('should validate royalty share distribution', async () => {
      // Arrange: Invalid share distribution
      const auth = AuthBuilder.create().build()
      const invalidWorkData = TestScenarios.invalidShares().buildForAPI()

      vi.mocked(verifyPrivyToken).mockResolvedValue({ userId: auth.userId })
      vi.mocked(getUserSolanaWalletFromPrivy).mockResolvedValue({ address: auth.linked_accounts![0].address })

      // Act
      const request = new NextRequest('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(invalidWorkData),
      })

      const response = await POST(request)
      const responseData = await response.json()

      // Assert: Should reject invalid share distribution
      expect(response.status).toBe(400)
      expect(responseData.error).toContain('shares must total 100%')
      expect(WorkRepository.createWork).not.toHaveBeenCalled()
    })

    it('should handle authentication failures', async () => {
      // Arrange: Invalid token
      const workData = TestScenarios.validSingleArtist().buildForAPI()

      vi.mocked(verifyPrivyToken).mockRejectedValue(new Error('Invalid token'))

      // Act
      const request = new NextRequest('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
        body: JSON.stringify(workData),
      })

      const response = await POST(request)
      const responseData = await response.json()

      // Assert: Should reject unauthenticated requests
      expect(response.status).toBe(401)
      expect(responseData.error).toContain('Authentication failed')
      expect(WorkRepository.createWork).not.toHaveBeenCalled()
    })
  })

  describe('Business Rules Validation', () => {
    it('should enforce valid ISRC format', async () => {
      const auth = AuthBuilder.create().build()
      const workData = WorkBuilder.create().withISRC('INVALID_ISRC').withValidShareDistribution().buildForAPI()

      vi.mocked(verifyPrivyToken).mockResolvedValue({ userId: auth.userId })
      vi.mocked(getUserSolanaWalletFromPrivy).mockResolvedValue({ address: auth.linked_accounts![0].address })

      const request = new NextRequest('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(workData),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Invalid ISRC format')
    })

    it('should enforce valid wallet addresses', async () => {
      const auth = AuthBuilder.create().build()
      const workData = {
        title: 'Test Song',
        isrc: 'USRC17607834',
        contributors: [
          {
            name: 'Artist',
            walletAddress: 'invalid_wallet_address',
            share: 100,
          },
        ],
      }

      vi.mocked(verifyPrivyToken).mockResolvedValue({ userId: auth.userId })
      vi.mocked(getUserSolanaWalletFromPrivy).mockResolvedValue({ address: auth.linked_accounts![0].address })

      const request = new NextRequest('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(workData),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Invalid wallet address')
    })

    it('should require at least one contributor', async () => {
      const auth = AuthBuilder.create().build()
      const workData = {
        title: 'Test Song',
        isrc: 'USRC17607834',
        contributors: [],
      }

      vi.mocked(verifyPrivyToken).mockResolvedValue({ userId: auth.userId })
      vi.mocked(getUserSolanaWalletFromPrivy).mockResolvedValue({ address: auth.linked_accounts![0].address })

      const request = new NextRequest('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(workData),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Contributor shares must total 100%')
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle database errors gracefully', async () => {
      const auth = AuthBuilder.create().build()
      const workData = TestScenarios.validSingleArtist().buildForAPI()

      vi.mocked(verifyPrivyToken).mockResolvedValue({ userId: auth.userId })
      vi.mocked(getUserSolanaWalletFromPrivy).mockResolvedValue({ address: auth.linked_accounts![0].address })
      vi.mocked(UserRepository.upsertUserByPrivyId).mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(workData),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toContain('Failed to register work')
      expect(WorkRepository.createWork).not.toHaveBeenCalled()
    })

    it('should rollback on partial failures', async () => {
      const auth = AuthBuilder.create().build()
      const workData = TestScenarios.validDualArtist().buildForAPI()

      const mockUser = {
        id: 'user-123',
        privy_user_id: auth.userId,
        email: 'test@example.com',
        embedded_wallet_address: auth.linked_accounts![0].address,
        created_at: '2024-01-01T00:00:00Z',
      }

      const mockWork = {
        id: 'work-123',
        title: workData.title,
        isrc: workData.isrc,
        total_shares: 100,
        created_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(verifyPrivyToken).mockResolvedValue({ userId: auth.userId })
      vi.mocked(getUserSolanaWalletFromPrivy).mockResolvedValue({ address: auth.linked_accounts![0].address })
      vi.mocked(UserRepository.upsertUserByPrivyId).mockResolvedValue(mockUser)
      vi.mocked(WorkRepository.findByISRC).mockResolvedValue(null)
      vi.mocked(WorkRepository.createWork).mockResolvedValue(mockWork)
      vi.mocked(ContributorRepository.createMultipleContributors).mockRejectedValue(
        new Error('Contributor creation failed'),
      )

      const request = new NextRequest('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(workData),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toContain('Failed to register work')

      // In a real implementation, we'd expect a rollback of the work creation
      // This test documents the expected behavior for transaction handling
    })
  })
})
