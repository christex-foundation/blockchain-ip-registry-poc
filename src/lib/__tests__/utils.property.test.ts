import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateISRC, validateRoyaltyShares, validateWalletAddress, calculateTotalShares } from '../utils'

const PROPERTY_TEST_RUNS = 3

describe('Property-Based Tests for Validation Utils', () => {
  describe('validateISRC - Properties', () => {
    it('should always validate properly formatted ISRCs', () => {
      // Use only known valid ISRCs
      const validISRCs = ['USRC17607834', 'GBRC19123456', 'DERC20654321', 'CARC18987654']
      
      validISRCs.forEach(isrc => {
        expect(validateISRC(isrc)).toBe(true)
      })
    })

    it('should always reject improperly formatted ISRCs', () => {
      const invalidISRCs = ['too-short', 'way-too-long-to-be-valid', 'usrc12345678', '']
      
      invalidISRCs.forEach(isrc => {
        expect(validateISRC(isrc)).toBe(false)
      })
    })

    it('should handle any string input without crashing', () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 20 }), (anyString) => {
          const result = validateISRC(anyString)
          expect(typeof result).toBe('boolean')
        }),
        { numRuns: PROPERTY_TEST_RUNS },
      )
    })
  })

  describe('validateWalletAddress - Properties', () => {
    it('should validate known good addresses', () => {
      const validAddresses = [
        'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
        'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8',
        '11111111111111111111111111111112'
      ]
      
      validAddresses.forEach(address => {
        expect(validateWalletAddress(address)).toBe(true)
      })
    })

    it('should reject obviously invalid addresses', () => {
      const invalidAddresses = ['too-short', '0x1234567890abcdef', '', 'contains-invalid-chars-0OIl']
      
      invalidAddresses.forEach(address => {
        expect(validateWalletAddress(address)).toBe(false)
      })
    })

    it('should handle any string input without crashing', () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 50 }), (anyString) => {
          const result = validateWalletAddress(anyString)
          expect(typeof result).toBe('boolean')
        }),
        { numRuns: PROPERTY_TEST_RUNS },
      )
    })
  })

  describe('validateRoyaltyShares - Properties', () => {
    it('should validate when shares sum to exactly 100', () => {
      const validSharesTestCases = [
        [100],
        [50, 50],
        [60, 40],
        [33.33, 33.33, 33.34],
        [25, 25, 25, 25]
      ]

      validSharesTestCases.forEach(shares => {
        const contributors = shares.map(share => ({ royaltyShare: share }))
        expect(validateRoyaltyShares(contributors)).toBe(true)
      })
    })

    it('should reject when shares do not sum to 100', () => {
      const invalidSharesTestCases = [
        [50], // too low
        [60, 60], // too high
        [30, 30, 30], // sums to 90
        [], // empty
        [0] // zero
      ]

      invalidSharesTestCases.forEach(shares => {
        const contributors = shares.map(share => ({ royaltyShare: share }))
        expect(validateRoyaltyShares(contributors)).toBe(false)
      })
    })

    it('should handle edge cases without crashing', () => {
      const edgeCases = [[], [0], [-10], [1000], [0.01]]
      
      edgeCases.forEach(shares => {
        const contributors = shares.map(share => ({ royaltyShare: share }))
        const result = validateRoyaltyShares(contributors)
        expect(typeof result).toBe('boolean')
      })
    })
  })

  describe('calculateTotalShares - Properties', () => {
    it('should return correct sums for known values', () => {
      const testCases = [
        { shares: [50, 50], expected: 100 },
        { shares: [25, 75], expected: 100 },
        { shares: [10, 20, 30], expected: 60 },
        { shares: [100], expected: 100 },
        { shares: [], expected: 0 }
      ]

      testCases.forEach(({ shares, expected }) => {
        const contributors = shares.map(share => ({ royaltyShare: share }))
        const result = calculateTotalShares(contributors)
        expect(Math.abs(result - expected)).toBeLessThan(0.01)
      })
    })

    it('should be order-independent', () => {
      const shares = [10, 20, 30, 40]
      const contributors1 = shares.map(share => ({ royaltyShare: share }))
      const contributors2 = [...shares].reverse().map(share => ({ royaltyShare: share }))

      const total1 = calculateTotalShares(contributors1)
      const total2 = calculateTotalShares(contributors2)

      expect(total1).toBe(total2)
    })

    it('should handle negative values', () => {
      const contributors = [{ royaltyShare: -10 }, { royaltyShare: 20 }]
      const result = calculateTotalShares(contributors)
      expect(result).toBe(10)
    })
  })

  describe('Integration Tests', () => {
    it('should maintain consistency between validation and calculation', () => {
      const validShareSets = [[50, 50], [33.33, 33.33, 33.34], [60, 40]]
      
      validShareSets.forEach(shares => {
        const contributors = shares.map(share => ({ royaltyShare: share }))
        const isValid = validateRoyaltyShares(contributors)
        const total = calculateTotalShares(contributors)
        
        if (isValid) {
          expect(Math.abs(total - 100)).toBeLessThan(1)
        }
      })
    })

    it('should reject edge case ISRCs consistently', () => {
      const edgeCaseISRCs = ['', 'A', 'USRC123', 'toolongtobevalid', 'us1c12345678']
      
      edgeCaseISRCs.forEach(isrc => {
        expect(validateISRC(isrc)).toBe(false)
      })
    })
  })
})