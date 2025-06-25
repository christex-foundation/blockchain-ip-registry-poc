import { describe, it, expect, vi } from 'vitest'

// Mock the Privy server dependency to prevent browser environment error
vi.mock('../privy-server', () => ({
  privyServer: {
    getUser: vi.fn(),
  },
}))

import { createOnChainAttributes, createWorkMetadata, lamportsToSol, solToLamports } from '../solana-server'

describe('Solana Server - Real Implementation Tests', () => {
  describe('createOnChainAttributes', () => {
    it('should create proper on-chain attributes from work data', () => {
      const workData = {
        title: 'Test Song',
        isrc: 'TEST123456789',
        workId: 'work-123',
        description: 'A test song for validation',
        contributors: [
          { name: 'Artist 1', wallet: 'wallet1', share: 60 },
          { name: 'Producer 1', wallet: 'wallet2', share: 40 },
        ],
      }

      const attributes = createOnChainAttributes(workData)

      expect(attributes).toHaveLength(10)

      // Verify core attributes
      expect(attributes).toContainEqual({ key: 'title', value: 'Test Song' })
      expect(attributes).toContainEqual({ key: 'isrc', value: 'TEST123456789' })
      expect(attributes).toContainEqual({ key: 'work_id', value: 'work-123' })
      expect(attributes).toContainEqual({ key: 'contributors_count', value: '2' })
      expect(attributes).toContainEqual({ key: 'total_shares', value: '100' })
      expect(attributes).toContainEqual({ key: 'type', value: 'Intellectual Property' })
      expect(attributes).toContainEqual({ key: 'category', value: 'Music' })
      expect(attributes).toContainEqual({ key: 'description', value: 'A test song for validation' })

      // Verify contributors data is properly serialized
      const contributorsAttr = attributes.find((attr) => attr.key === 'contributors_data')
      expect(contributorsAttr).toBeDefined()
      const contributorsData = JSON.parse(contributorsAttr!.value)
      expect(contributorsData).toHaveLength(2)
      expect(contributorsData[0]).toEqual({ name: 'Artist 1', wallet: 'wallet1', share: 60 })

      // Verify royalty distribution data
      const royaltyAttr = attributes.find((attr) => attr.key === 'royalty_distribution')
      expect(royaltyAttr).toBeDefined()
      const royaltyData = JSON.parse(royaltyAttr!.value)
      expect(royaltyData).toHaveLength(2)
      expect(royaltyData[0]).toEqual({
        recipient: 'wallet1',
        recipient_name: 'Artist 1',
        share_percentage: 60,
      })
    })

    it('should handle missing ISRC gracefully', () => {
      const workData = {
        title: 'Test Song',
        workId: 'work-123',
        contributors: [{ name: 'Artist', wallet: 'wallet1', share: 100 }],
      }

      const attributes = createOnChainAttributes(workData)

      expect(attributes).toContainEqual({ key: 'isrc', value: 'Not specified' })
    })

    it('should handle missing description by generating default', () => {
      const workData = {
        title: 'Test Song',
        workId: 'work-123',
        contributors: [{ name: 'Artist', wallet: 'wallet1', share: 100 }],
      }

      const attributes = createOnChainAttributes(workData)

      expect(attributes).toContainEqual({
        key: 'description',
        value: 'Intellectual Property Work: Test Song',
      })
    })

    it('should calculate total shares correctly', () => {
      const workData = {
        title: 'Test Song',
        workId: 'work-123',
        contributors: [
          { name: 'Artist 1', wallet: 'wallet1', share: 30 },
          { name: 'Artist 2', wallet: 'wallet2', share: 25 },
          { name: 'Producer', wallet: 'wallet3', share: 45 },
        ],
      }

      const attributes = createOnChainAttributes(workData)

      expect(attributes).toContainEqual({ key: 'total_shares', value: '100' })
      expect(attributes).toContainEqual({ key: 'contributors_count', value: '3' })
    })

    it('should handle empty contributors array', () => {
      const workData = {
        title: 'Test Song',
        workId: 'work-123',
        contributors: [],
      }

      const attributes = createOnChainAttributes(workData)

      expect(attributes).toContainEqual({ key: 'contributors_count', value: '0' })
      expect(attributes).toContainEqual({ key: 'total_shares', value: '0' })

      const contributorsAttr = attributes.find((attr) => attr.key === 'contributors_data')
      const contributorsData = JSON.parse(contributorsAttr!.value)
      expect(contributorsData).toHaveLength(0)
    })
  })

  describe('createWorkMetadata', () => {
    it('should create proper metadata structure', () => {
      const workData = {
        title: 'Test Album',
        isrc: 'TEST987654321',
        description: 'A comprehensive test album',
        contributors: [
          { name: 'Lead Artist', wallet: 'artist-wallet', share: 70 },
          { name: 'Producer', wallet: 'producer-wallet', share: 30 },
        ],
      }

      const result = createWorkMetadata(workData)

      // Verify core metadata
      expect(result.coreMetadata).toEqual({
        name: 'Test Album',
        uri: '',
      })

      // Verify extended metadata structure
      expect(result.extendedMetadata.name).toBe('Test Album')
      expect(result.extendedMetadata.description).toBe('A comprehensive test album')
      expect(result.extendedMetadata.attributes).toHaveLength(5)

      // Verify attributes
      expect(result.extendedMetadata.attributes).toContainEqual({
        trait_type: 'ISRC',
        value: 'TEST987654321',
      })
      expect(result.extendedMetadata.attributes).toContainEqual({
        trait_type: 'Contributors Count',
        value: 2,
      })
      expect(result.extendedMetadata.attributes).toContainEqual({
        trait_type: 'Total Shares',
        value: 100,
      })

      // Verify properties
      expect(result.extendedMetadata.properties.category).toBe('music')
      expect(result.extendedMetadata.properties.creators).toHaveLength(2)
      expect(result.extendedMetadata.properties.creators[0]).toEqual({
        address: 'artist-wallet',
        share: 70,
        name: 'Lead Artist',
      })

      // Verify IP data
      expect(result.extendedMetadata.properties.ip_data.isrc).toBe('TEST987654321')
      expect(result.extendedMetadata.properties.ip_data.royalty_distribution).toHaveLength(2)
    })

    it('should throw error when shares do not total 100%', () => {
      const workData = {
        title: 'Invalid Shares',
        contributors: [
          { name: 'Artist 1', wallet: 'wallet1', share: 60 },
          { name: 'Artist 2', wallet: 'wallet2', share: 30 }, // Total = 90%
        ],
      }

      expect(() => createWorkMetadata(workData)).toThrow('Contributor shares must total 100%')
    })

    it('should handle missing optional fields', () => {
      const workData = {
        title: 'Minimal Work',
        contributors: [{ name: 'Solo Artist', wallet: 'solo-wallet', share: 100 }],
      }

      const result = createWorkMetadata(workData)

      expect(result.extendedMetadata.description).toBe('Intellectual Property Work: Minimal Work')
      expect(result.extendedMetadata.image).toBe('')
      expect(result.extendedMetadata.attributes).toContainEqual({
        trait_type: 'ISRC',
        value: 'Not specified',
      })
      expect(result.extendedMetadata.properties.ip_data.isrc).toBeUndefined()
    })

    it('should validate business logic for contributor shares', () => {
      const validWorkData = {
        title: 'Valid Work',
        contributors: [
          { name: 'Artist', wallet: 'wallet1', share: 50 },
          { name: 'Producer', wallet: 'wallet2', share: 50 },
        ],
      }

      expect(() => createWorkMetadata(validWorkData)).not.toThrow()

      const invalidWorkData = {
        title: 'Invalid Work',
        contributors: [
          { name: 'Artist', wallet: 'wallet1', share: 60 },
          { name: 'Producer', wallet: 'wallet2', share: 50 }, // Total = 110%
        ],
      }

      expect(() => createWorkMetadata(invalidWorkData)).toThrow()
    })
  })

  describe('Utility Functions', () => {
    describe('lamportsToSol', () => {
      it('should convert lamports to SOL correctly', () => {
        expect(lamportsToSol(1000000000)).toBe(1) // 1 SOL
        expect(lamportsToSol(500000000)).toBe(0.5) // 0.5 SOL
        expect(lamportsToSol(1)).toBe(0.000000001) // 1 lamport
        expect(lamportsToSol(0)).toBe(0)
      })

      it('should handle large amounts', () => {
        expect(lamportsToSol(10000000000000)).toBe(10000) // 10,000 SOL
      })
    })

    describe('solToLamports', () => {
      it('should convert SOL to lamports correctly', () => {
        expect(solToLamports(1)).toBe(1000000000) // 1 SOL
        expect(solToLamports(0.5)).toBe(500000000) // 0.5 SOL
        expect(solToLamports(0.000000001)).toBe(1) // 1 lamport
        expect(solToLamports(0)).toBe(0)
      })

      it('should handle decimal precision', () => {
        expect(solToLamports(1.5)).toBe(1500000000)
        expect(solToLamports(0.123456789)).toBe(123456789)
      })
    })

    describe('SOL conversion round-trip', () => {
      it('should maintain precision in round-trip conversions', () => {
        const originalSol = 1.5
        const lamports = solToLamports(originalSol)
        const convertedBack = lamportsToSol(lamports)
        expect(convertedBack).toBe(originalSol)
      })

      it('should handle edge cases', () => {
        expect(lamportsToSol(solToLamports(0))).toBe(0)
        expect(solToLamports(lamportsToSol(1000000000))).toBe(1000000000)
      })
    })
  })
})

describe('Data Validation and Business Logic', () => {
  describe('Share Distribution Validation', () => {
    it('should validate total shares equal 100%', () => {
      const validDistribution = [
        { name: 'Artist', wallet: 'wallet1', share: 60 },
        { name: 'Producer', wallet: 'wallet2', share: 40 },
      ]

      const workData = {
        title: 'Test',
        contributors: validDistribution,
      }

      expect(() => createWorkMetadata(workData)).not.toThrow()
    })

    it('should reject invalid share distributions', () => {
      const invalidDistributions = [
        [{ name: 'Artist', wallet: 'wallet1', share: 101 }], // Over 100%
        [
          { name: 'Artist', wallet: 'wallet1', share: 50 },
          { name: 'Producer', wallet: 'wallet2', share: 40 },
        ], // Under 100%
        [
          { name: 'Artist', wallet: 'wallet1', share: 60 },
          { name: 'Producer', wallet: 'wallet2', share: 50 },
        ], // Over 100%
      ]

      invalidDistributions.forEach((contributors) => {
        const workData = { title: 'Test', contributors }
        expect(() => createWorkMetadata(workData)).toThrow('Contributor shares must total 100%')
      })
    })
  })

  describe('Data Structure Integrity', () => {
    it('should maintain consistent data structures across functions', () => {
      const workData = {
        title: 'Consistency Test',
        isrc: 'CONSISTENCY123',
        workId: 'work-consistency',
        contributors: [{ name: 'Artist', wallet: 'artist-wallet', share: 100 }],
      }

      const attributes = createOnChainAttributes(workData)
      const metadata = createWorkMetadata(workData)

      // Verify consistent data between on-chain and off-chain
      const titleAttr = attributes.find((attr) => attr.key === 'title')
      expect(titleAttr?.value).toBe(metadata.extendedMetadata.name)

      const isrcAttr = attributes.find((attr) => attr.key === 'isrc')
      const isrcTrait = metadata.extendedMetadata.attributes.find((attr) => attr.trait_type === 'ISRC')
      expect(isrcAttr?.value).toBe(isrcTrait?.value)
    })

    it('should handle complex contributor scenarios', () => {
      const complexContributors = [
        { name: 'Lead Vocalist', wallet: 'vocalist-wallet', share: 35 },
        { name: 'Guitarist', wallet: 'guitarist-wallet', share: 25 },
        { name: 'Producer', wallet: 'producer-wallet', share: 20 },
        { name: 'Songwriter', wallet: 'songwriter-wallet', share: 20 },
      ]

      const workData = {
        title: 'Complex Work',
        workId: 'complex-work',
        contributors: complexContributors,
      }

      const attributes = createOnChainAttributes(workData)
      const metadata = createWorkMetadata(workData)

      // Verify contributor count consistency
      const countAttr = attributes.find((attr) => attr.key === 'contributors_count')
      const countTrait = metadata.extendedMetadata.attributes.find((attr) => attr.trait_type === 'Contributors Count')

      expect(countAttr?.value).toBe('4')
      expect(countTrait?.value).toBe(4)
      expect(metadata.extendedMetadata.properties.creators).toHaveLength(4)

      // Verify royalty distribution integrity
      const royaltyAttr = attributes.find((attr) => attr.key === 'royalty_distribution')
      const royaltyData = JSON.parse(royaltyAttr!.value)

      expect(royaltyData).toHaveLength(4)
      expect(metadata.extendedMetadata.properties.ip_data.royalty_distribution).toHaveLength(4)

      // Verify total shares
      const totalShares = royaltyData.reduce(
        (sum: number, item: { share_percentage: number }) => sum + item.share_percentage,
        0,
      )
      expect(totalShares).toBe(100)
    })
  })
})
