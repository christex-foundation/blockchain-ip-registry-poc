import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateISRC, validateRoyaltyShares, validateWalletAddress, calculateTotalShares } from '../utils'

// Mock the repositories for integration testing
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}))

describe('Integration Tests - Full Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Work Registration Complete Workflow', () => {
    it('should validate and process complete work registration', () => {
      // Simulate a complete work registration workflow
      const workData = {
        title: 'Test Song',
        isrc: 'USRC17607834',
        description: 'A test song for integration testing',
        contributors: [
          {
            name: 'Lead Artist',
            walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
            royaltyShare: 45,
          },
          {
            name: 'Producer',
            walletAddress: 'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8',
            royaltyShare: 35,
          },
          {
            name: 'Songwriter',
            walletAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            royaltyShare: 20,
          },
        ],
      }

      // Step 1: Validate ISRC format
      const isrcValid = validateISRC(workData.isrc)
      expect(isrcValid).toBe(true)

      // Step 2: Validate all wallet addresses
      const walletValidations = workData.contributors.map((contributor) =>
        validateWalletAddress(contributor.walletAddress),
      )
      expect(walletValidations.every((valid) => valid)).toBe(true)

      // Step 3: Validate royalty share distribution
      const sharesValid = validateRoyaltyShares(workData.contributors)
      expect(sharesValid).toBe(true)

      // Step 4: Calculate total shares (should be 100%)
      const totalShares = calculateTotalShares(workData.contributors)
      expect(totalShares).toBe(100)

      // Step 5: Simulate successful workflow completion
      const workflowResult = {
        workId: 'work-123',
        status: 'validated',
        contributors: workData.contributors.length,
        totalShares,
      }

      expect(workflowResult.status).toBe('validated')
      expect(workflowResult.contributors).toBe(3)
      expect(workflowResult.totalShares).toBe(100)
    })

    it('should reject invalid work registration workflow', () => {
      const invalidWorkData = {
        title: 'Invalid Work',
        isrc: 'INVALID_ISRC', // Invalid ISRC
        contributors: [
          {
            name: 'Artist',
            walletAddress: 'invalid_wallet', // Invalid wallet
            royaltyShare: 70,
          },
          {
            name: 'Producer',
            walletAddress: 'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8',
            royaltyShare: 40, // Total 110% - invalid
          },
        ],
      }

      // Validation should fail at multiple steps
      const isrcValid = validateISRC(invalidWorkData.isrc)
      const firstWalletValid = validateWalletAddress(invalidWorkData.contributors[0].walletAddress)
      const sharesValid = validateRoyaltyShares(invalidWorkData.contributors)

      expect(isrcValid).toBe(false)
      expect(firstWalletValid).toBe(false)
      expect(sharesValid).toBe(false)

      // Workflow should be rejected
      const workflowResult = {
        status: 'rejected',
        errors: [
          !isrcValid && 'Invalid ISRC format',
          !firstWalletValid && 'Invalid wallet address',
          !sharesValid && 'Invalid royalty share distribution',
        ].filter(Boolean),
      }

      expect(workflowResult.status).toBe('rejected')
      expect(workflowResult.errors).toHaveLength(3)
    })
  })

  describe('Royalty Distribution Workflow', () => {
    it('should calculate and validate royalty distribution', () => {
      const work = {
        id: 'work-123',
        title: 'Test Song',
        contributors: [
          {
            id: 'contrib-1',
            name: 'Artist',
            walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
            royaltyShare: 60,
          },
          {
            id: 'contrib-2',
            name: 'Producer',
            walletAddress: 'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8',
            royaltyShare: 40,
          },
        ],
      }

      const distributionAmount = 1000 // $1000 to distribute

      // Step 1: Validate royalty shares still total 100%
      const sharesValid = validateRoyaltyShares(work.contributors)
      expect(sharesValid).toBe(true)

      // Step 2: Calculate individual distributions
      const distributions = work.contributors.map((contributor) => ({
        contributorId: contributor.id,
        walletAddress: contributor.walletAddress,
        share: contributor.royaltyShare,
        amount: (distributionAmount * contributor.royaltyShare) / 100,
      }))

      // Step 3: Validate distribution calculations
      const totalDistributed = distributions.reduce((sum, dist) => sum + dist.amount, 0)
      expect(totalDistributed).toBe(distributionAmount)

      // Step 4: Validate wallet addresses for distribution
      const allWalletsValid = distributions.every((dist) => validateWalletAddress(dist.walletAddress))
      expect(allWalletsValid).toBe(true)

      // Expected distribution
      expect(distributions[0].amount).toBe(600) // 60% of 1000
      expect(distributions[1].amount).toBe(400) // 40% of 1000
    })

    it('should handle complex multi-contributor royalty distribution', () => {
      const work = {
        contributors: [
          { royaltyShare: 22.5, walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV' },
          { royaltyShare: 22.5, walletAddress: 'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8' },
          { royaltyShare: 20.0, walletAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { royaltyShare: 15.0, walletAddress: '11111111111111111111111111111112' },
          { royaltyShare: 10.0, walletAddress: 'So11111111111111111111111111111111111111112' },
          { royaltyShare: 10.0, walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jq' },
        ],
      }

      const distributionAmount = 10000 // $10,000

      // Validate the complex share structure
      expect(validateRoyaltyShares(work.contributors)).toBe(true)
      expect(calculateTotalShares(work.contributors)).toBe(100)

      // Calculate distributions
      const distributions = work.contributors.map((contributor, index) => ({
        contributorIndex: index,
        share: contributor.royaltyShare,
        amount: (distributionAmount * contributor.royaltyShare) / 100,
        walletAddress: contributor.walletAddress,
      }))

      // Validate total distribution
      const totalDistributed = distributions.reduce((sum, dist) => sum + dist.amount, 0)
      expect(totalDistributed).toBe(distributionAmount)

      // Validate individual amounts
      expect(distributions[0].amount).toBe(2250) // 22.5%
      expect(distributions[1].amount).toBe(2250) // 22.5%
      expect(distributions[2].amount).toBe(2000) // 20.0%
      expect(distributions[3].amount).toBe(1500) // 15.0%
      expect(distributions[4].amount).toBe(1000) // 10.0%
      expect(distributions[5].amount).toBe(1000) // 10.0%
    })
  })

  describe('Data Validation Pipeline', () => {
    it('should process validation pipeline for work data', () => {
      const workDataSamples = [
        {
          title: 'Valid Work 1',
          isrc: 'USRC17607834',
          contributors: [{ royaltyShare: 100, walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV' }],
          expectedValid: true,
        },
        {
          title: 'Invalid ISRC',
          isrc: 'INVALID',
          contributors: [{ royaltyShare: 100, walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV' }],
          expectedValid: false,
        },
        {
          title: 'Invalid Wallet',
          isrc: 'GBUM71505078',
          contributors: [{ royaltyShare: 100, walletAddress: 'invalid_wallet' }],
          expectedValid: false,
        },
        {
          title: 'Invalid Shares',
          isrc: 'FRUM71200001',
          contributors: [
            { royaltyShare: 60, walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV' },
            { royaltyShare: 30, walletAddress: 'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8' },
          ], // Only 90% total
          expectedValid: false,
        },
      ]

      const validationResults = workDataSamples.map((sample) => {
        const isrcValid = validateISRC(sample.isrc)
        const walletsValid = sample.contributors.every((c) => validateWalletAddress(c.walletAddress))
        const sharesValid = validateRoyaltyShares(sample.contributors)

        const overallValid = isrcValid && walletsValid && sharesValid

        return {
          title: sample.title,
          isrcValid,
          walletsValid,
          sharesValid,
          overallValid,
          expectedValid: sample.expectedValid,
        }
      })

      // Verify each validation result matches expectation
      validationResults.forEach((result) => {
        expect(result.overallValid).toBe(result.expectedValid)
      })

      // Verify specific validation failures
      expect(validationResults[1].isrcValid).toBe(false) // Invalid ISRC
      expect(validationResults[2].walletsValid).toBe(false) // Invalid wallet
      expect(validationResults[3].sharesValid).toBe(false) // Invalid shares
    })
  })

  describe('Cross-Component Integration', () => {
    it('should integrate validation with business logic', () => {
      // Simulate a complete business workflow
      const businessWorkflow = {
        validateWorkData: (workData: any) => {
          const validations = {
            isrc: validateISRC(workData.isrc),
            wallets: workData.contributors.every((c: any) => validateWalletAddress(c.walletAddress)),
            shares: validateRoyaltyShares(workData.contributors),
          }

          return {
            valid: Object.values(validations).every(Boolean),
            validations,
          }
        },

        calculateDistribution: (contributors: any[], amount: number) => {
          if (!validateRoyaltyShares(contributors)) {
            throw new Error('Invalid royalty shares')
          }

          return contributors.map((contributor) => ({
            ...contributor,
            distributionAmount: (amount * contributor.royaltyShare) / 100,
          }))
        },

        processWork: (workData: any, distributionAmount?: number) => {
          const validation = businessWorkflow.validateWorkData(workData)

          if (!validation.valid) {
            return {
              status: 'rejected',
              validations: validation.validations,
            }
          }

          const result: any = {
            status: 'approved',
            workId: 'generated-work-id',
            contributorCount: workData.contributors.length,
            totalShares: calculateTotalShares(workData.contributors),
          }

          if (distributionAmount) {
            result.distributions = businessWorkflow.calculateDistribution(workData.contributors, distributionAmount)
          }

          return result
        },
      }

      // Test valid workflow
      const validWork = {
        title: 'Integration Test Song',
        isrc: 'USRC17607834',
        contributors: [
          {
            name: 'Artist',
            walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
            royaltyShare: 70,
          },
          {
            name: 'Producer',
            walletAddress: 'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8',
            royaltyShare: 30,
          },
        ],
      }

      const result = businessWorkflow.processWork(validWork, 5000)

      expect(result.status).toBe('approved')
      expect(result.contributorCount).toBe(2)
      expect(result.totalShares).toBe(100)
      expect(result.distributions).toHaveLength(2)
      expect(result.distributions[0].distributionAmount).toBe(3500) // 70% of 5000
      expect(result.distributions[1].distributionAmount).toBe(1500) // 30% of 5000

      // Test invalid workflow
      const invalidWork = {
        title: 'Invalid Work',
        isrc: 'INVALID',
        contributors: [
          {
            name: 'Artist',
            walletAddress: 'invalid_wallet',
            royaltyShare: 110, // Over 100%
          },
        ],
      }

      const invalidResult = businessWorkflow.processWork(invalidWork)

      expect(invalidResult.status).toBe('rejected')
      expect(invalidResult.validations.isrc).toBe(false)
      expect(invalidResult.validations.wallets).toBe(false)
      expect(invalidResult.validations.shares).toBe(false)
    })
  })
})
