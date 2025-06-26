import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContributorRepository } from '../contributor-repository'
import { WorkBuilder, ContributorBuilder, TestScenarios } from '@/test/builders'

// Create a proper mock for the Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

describe('ContributorRepository - Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createMultipleContributors - Contract Behavior', () => {
    it('should create contributors maintaining share integrity', async () => {
      const workId = 'work-123'
      const contributors = TestScenarios.validDualArtist().build().contributors
      const mockContributorsData = contributors.map(c => 
        ContributorBuilder.create()
          .withName(c.name)
          .withWalletAddress(c.wallet_address)
          .withShare(c.royalty_share)
          .buildForDatabase(workId)
      )

      const mockCreatedContributors = mockContributorsData.map((data, index) => ({
        id: `contrib-${index + 1}`,
        ...data,
        created_at: '2024-01-01T00:00:00Z',
      }))

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockCreatedContributors,
            error: null,
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await ContributorRepository.createMultipleContributors(mockContributorsData)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('contributors')
      expect(mockQuery.insert).toHaveBeenCalledWith(mockContributorsData)
      expect(result).toEqual(mockCreatedContributors)
      
      // Verify contract: total shares should equal 100%
      const totalShares = result.reduce((sum, c) => sum + c.royalty_share, 0)
      expect(totalShares).toBe(100)
      
      // Verify all contributors belong to same work
      expect(result.every(c => c.work_id === workId)).toBe(true)
    })

    it('should handle creation failures gracefully', async () => {
      const workId = 'work-123'
      const contributor = ContributorBuilder.create().asArtist().buildForDatabase(workId)
      const mockContributorsData = [contributor]

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database constraint violation' },
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(ContributorRepository.createMultipleContributors(mockContributorsData)).rejects.toThrow(
        'Failed to create contributors: Database constraint violation',
      )
    })
  })

  describe('findByWorkId', () => {
    it('should find contributors by work ID ordered by royalty share', async () => {
      const workId = 'work-123'
      const mockContributors = [
        {
          id: 'contrib-1',
          work_id: workId,
          name: 'Artist',
          wallet_address: 'wallet123',
          royalty_share: 60,
        },
        {
          id: 'contrib-2',
          work_id: workId,
          name: 'Producer',
          wallet_address: 'wallet456',
          royalty_share: 40,
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockContributors,
              error: null,
            }),
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await ContributorRepository.findByWorkId(workId)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('contributors')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.select().eq).toHaveBeenCalledWith('work_id', workId)
      expect(result).toEqual(mockContributors)
    })

    it('should return empty array when no contributors found', async () => {
      const workId = 'work-123'

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await ContributorRepository.findByWorkId(workId)

      expect(result).toEqual([])
    })
  })

  describe('validateRoyaltySharesTotal', () => {
    it('should return true when shares total 100%', async () => {
      const workId = 'work-123'
      const mockContributors = [
        {
          id: 'contrib-1',
          work_id: workId,
          name: 'Artist',
          wallet_address: 'wallet123',
          royalty_share: 60,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'contrib-2',
          work_id: workId,
          name: 'Producer',
          wallet_address: 'wallet456',
          royalty_share: 40,
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Mock the findByWorkId method
      vi.spyOn(ContributorRepository, 'findByWorkId').mockResolvedValue(mockContributors)

      const result = await ContributorRepository.validateRoyaltySharesTotal(workId)

      expect(result).toBe(true)
      expect(ContributorRepository.findByWorkId).toHaveBeenCalledWith(workId)
    })

    it('should return false when shares do not total 100%', async () => {
      const workId = 'work-123'
      const mockContributors = [
        {
          id: 'contrib-1',
          work_id: workId,
          name: 'Artist',
          wallet_address: 'wallet123',
          royalty_share: 60,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'contrib-2',
          work_id: workId,
          name: 'Producer',
          wallet_address: 'wallet456',
          royalty_share: 30,
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      vi.spyOn(ContributorRepository, 'findByWorkId').mockResolvedValue(mockContributors)

      const result = await ContributorRepository.validateRoyaltySharesTotal(workId)

      expect(result).toBe(false)
    })

    it('should return false when shares exceed 100%', async () => {
      const workId = 'work-123'
      const mockContributors = [
        {
          id: 'contrib-1',
          work_id: workId,
          name: 'Artist',
          wallet_address: 'wallet123',
          royalty_share: 60,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'contrib-2',
          work_id: workId,
          name: 'Producer',
          wallet_address: 'wallet456',
          royalty_share: 50,
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      vi.spyOn(ContributorRepository, 'findByWorkId').mockResolvedValue(mockContributors)

      const result = await ContributorRepository.validateRoyaltySharesTotal(workId)

      expect(result).toBe(false)
    })
  })

  describe('getTotalRoyaltyShares', () => {
    it('should calculate total royalty shares correctly', async () => {
      const workId = 'work-123'
      const mockContributors = [
        {
          id: 'contrib-1',
          work_id: workId,
          name: 'Artist',
          wallet_address: 'wallet123',
          royalty_share: 35,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'contrib-2',
          work_id: workId,
          name: 'Producer',
          wallet_address: 'wallet456',
          royalty_share: 25,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'contrib-3',
          work_id: workId,
          name: 'Engineer',
          wallet_address: 'wallet789',
          royalty_share: 40,
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      vi.spyOn(ContributorRepository, 'findByWorkId').mockResolvedValue(mockContributors)

      const result = await ContributorRepository.getTotalRoyaltyShares(workId)

      expect(result).toBe(100)
    })

    it('should handle empty contributors array', async () => {
      const workId = 'work-123'

      vi.spyOn(ContributorRepository, 'findByWorkId').mockResolvedValue([])

      const result = await ContributorRepository.getTotalRoyaltyShares(workId)

      expect(result).toBe(0)
    })
  })

  describe('findByWalletAddress', () => {
    it('should find contributors by wallet address', async () => {
      const walletAddress = 'wallet123'
      const mockContributors = [
        {
          id: 'contrib-1',
          work_id: 'work-123',
          name: 'Artist',
          wallet_address: walletAddress,
          royalty_share: 60,
        },
        {
          id: 'contrib-2',
          work_id: 'work-456',
          name: 'Artist',
          wallet_address: walletAddress,
          royalty_share: 50,
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockContributors,
            error: null,
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await ContributorRepository.findByWalletAddress(walletAddress)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('contributors')
      expect(mockQuery.select().eq).toHaveBeenCalledWith('wallet_address', walletAddress)
      expect(result).toEqual(mockContributors)
    })

    it('should return empty array when no contributors found for wallet', async () => {
      const walletAddress = 'nonexistent-wallet'

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await ContributorRepository.findByWalletAddress(walletAddress)

      expect(result).toEqual([])
    })
  })
})
