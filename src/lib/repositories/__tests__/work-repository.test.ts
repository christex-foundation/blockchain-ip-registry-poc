import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkRepository } from '../work-repository'
import { WorkBuilder, TestScenarios } from '@/test/builders'

// Create a proper mock for the Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

describe('WorkRepository - Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createWork - Contract Behavior', () => {
    it('should create a work with valid data structure', async () => {
      const workData = TestScenarios.validSingleArtist().buildForDatabase()
      
      const mockCreatedWork = {
        id: 'work-123',
        ...workData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        nft_mint_address: null,
        metadata_uri: null,
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedWork,
              error: null,
            }),
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await WorkRepository.createWork(workData)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('works')
      expect(mockQuery.insert).toHaveBeenCalledWith(workData)
      expect(result).toEqual(mockCreatedWork)
      
      // Verify contract expectations
      expect(result.id).toBeTruthy()
      expect(result.title).toBe(workData.title)
      expect(result.created_at).toBeTruthy()
    })

    it('should handle creation failures gracefully', async () => {
      const workData = TestScenarios.validDualArtist().buildForDatabase()

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(WorkRepository.createWork(workData)).rejects.toThrow('Failed to create work: Database error')
    })
    
    it('should maintain data integrity requirements', async () => {
      const workData = WorkBuilder.create()
        .withTitle('Data Integrity Test')
        .withISRC('USRC17607834')
        .buildForDatabase()
      
      // Verify work data meets basic requirements
      expect(workData.title).toBeTruthy()
      expect(workData.isrc).toMatch(/^[A-Z]{2}RC\d{8}$/)
      expect(workData.total_shares).toBeGreaterThan(0)
    })
  })

  describe('findByISRC - Query Contract', () => {
    it('should find work by valid ISRC format', async () => {
      const workData = TestScenarios.validSingleArtist().build()
      const mockWork = {
        id: 'work-123',
        ...workData,
        created_at: '2024-01-01T00:00:00Z',
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockWork,
              error: null,
            }),
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await WorkRepository.findByISRC(workData.isrc!)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('works')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.select().eq).toHaveBeenCalledWith('isrc', workData.isrc)
      expect(result).toEqual(mockWork)
      
      // Verify contract: found work should have valid structure
      expect(result?.id).toBeTruthy()
      expect(result?.isrc).toBe(workData.isrc)
    })

    it('should return null when work not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No rows returned
            }),
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await WorkRepository.findByISRC('NONEXISTENT')

      expect(result).toBeNull()
    })

    it('should throw error for database errors other than not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'OTHER_ERROR', message: 'Database connection failed' },
            }),
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(WorkRepository.findByISRC('USRC17607834')).rejects.toThrow(
        'Failed to find work by ISRC: Database connection failed',
      )
    })
  })

  describe('findAllWithContributors', () => {
    it('should fetch all works with contributors', async () => {
      const mockWorksWithContributors = [
        {
          id: 'work-123',
          title: 'Test Song',
          contributors: [
            {
              id: 'contrib-1',
              name: 'Artist',
              wallet_address: 'wallet123',
              royalty_share: 60,
            },
            {
              id: 'contrib-2',
              name: 'Producer',
              wallet_address: 'wallet456',
              royalty_share: 40,
            },
          ],
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockWorksWithContributors,
            error: null,
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await WorkRepository.findAllWithContributors()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('works')
      expect(mockQuery.select).toHaveBeenCalledWith(`
        *,
        contributors (*)
      `)
      expect(result).toEqual(mockWorksWithContributors)
    })

    it('should handle empty results', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await WorkRepository.findAllWithContributors()

      expect(result).toEqual([])
    })
  })

  describe('updateNftMintAddress', () => {
    it('should update NFT mint address', async () => {
      const workId = 'work-123'
      const mintAddress = 'mint123'
      const mockUpdatedWork = {
        id: workId,
        nft_mint_address: mintAddress,
        title: 'Test Song',
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedWork,
                error: null,
              }),
            }),
          }),
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await WorkRepository.updateNftMintAddress(workId, mintAddress)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('works')
      expect(mockQuery.update).toHaveBeenCalledWith({ nft_mint_address: mintAddress })
      expect(result).toEqual(mockUpdatedWork)
    })
  })

  describe('getWorkCount', () => {
    it('should return work count', async () => {
      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await WorkRepository.getWorkCount()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('works')
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(result).toBe(5)
    })

    it('should return 0 when count is null', async () => {
      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          count: null,
          error: null,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await WorkRepository.getWorkCount()

      expect(result).toBe(0)
    })
  })
})
