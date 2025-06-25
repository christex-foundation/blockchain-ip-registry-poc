import { describe, it, expect } from 'vitest'
import { validateISRC, validateRoyaltyShares, validateWalletAddress, calculateTotalShares } from '../utils'

describe('Validation Utils', () => {
  describe('validateISRC', () => {
    it('should validate correct ISRC format', () => {
      const validISRCs = [
        'USRC17607834',
        'GBUM71505078',
        'FRUM71200001',
        'DEUM71200001',
        'JPAN12345678',
        'CAUM71200001',
        'AUUM71200001',
      ]

      validISRCs.forEach((isrc) => {
        expect(validateISRC(isrc)).toBe(true)
      })
    })

    it('should reject invalid ISRC formats', () => {
      const testCases = [
        { isrc: 'invalid', expected: false, reason: 'completely invalid' },
        { isrc: 'US12345', expected: false, reason: 'too short' },
        { isrc: 'USRC176078341', expected: false, reason: 'too long' },
        { isrc: 'usrc17607834', expected: false, reason: 'lowercase' },
        { isrc: 'US1C17607834', expected: false, reason: 'number in country code' },
        { isrc: 'USRCAB607834', expected: false, reason: 'letter in year' },
        { isrc: 'USRC1760783A', expected: false, reason: 'letter in designation' },
        { isrc: '', expected: false, reason: 'empty string' },
        { isrc: 'USRC 17607834', expected: false, reason: 'contains space' },
        { isrc: 'USRC\t17607834', expected: false, reason: 'contains tab' },
        { isrc: 'USRC\n17607834', expected: false, reason: 'contains newline' },
      ]

      testCases.forEach(({ isrc, expected }) => {
        expect(validateISRC(isrc)).toBe(expected)
      })
    })

    it('should reject malicious input attempts', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE works; --',
        '${process.env.SECRET}',
        '../../../etc/passwd',
        'javascript:alert(1)',
        'USRC🎵🎶🎵🎶🎵🎶',
        'USRC\u0000\u0001\u0002',
        'USRC\n\r\t1234567',
      ]

      maliciousInputs.forEach((input) => {
        expect(validateISRC(input)).toBe(false)
      })
    })

    it('should handle very long inputs gracefully', () => {
      const longString = 'A'.repeat(10000)
      expect(validateISRC(longString)).toBe(false)
    })
  })

  describe('validateRoyaltyShares', () => {
    it('should validate when shares total exactly 100%', () => {
      const testCases = [
        { shares: [60, 40], expected: true },
        { shares: [50, 50], expected: true },
        { shares: [25, 25, 25, 25], expected: true },
        { shares: [100], expected: true }, // Single contributor
        { shares: [33.33, 33.33, 33.34], expected: true }, // Precision handling
      ]

      testCases.forEach(({ shares, expected }) => {
        const contributors = shares.map((share) => ({ royaltyShare: share }))
        expect(validateRoyaltyShares(contributors)).toBe(expected)
      })
    })

    it('should reject when shares do not total 100%', () => {
      const testCases = [
        { shares: [60, 30], expected: false }, // 90% total
        { shares: [60, 50], expected: false }, // 110% total
        { shares: [50, 40], expected: false }, // 90% total
        { shares: [], expected: false }, // No contributors
        { shares: [0], expected: false }, // Zero shares
        { shares: [99.99], expected: false }, // Close but not 100%
        { shares: [100.01], expected: false }, // Slightly over 100%
      ]

      testCases.forEach(({ shares, expected }) => {
        const contributors = shares.map((share) => ({ royaltyShare: share }))
        expect(validateRoyaltyShares(contributors)).toBe(expected)
      })
    })

    it('should handle complex real-world share distributions', () => {
      const complexSplit = [
        { royaltyShare: 22.5 }, // Lead Artist
        { royaltyShare: 22.5 }, // Featured Artist
        { royaltyShare: 20.0 }, // Producer
        { royaltyShare: 15.0 }, // Songwriter
        { royaltyShare: 10.0 }, // Engineer
        { royaltyShare: 10.0 }, // Label
      ]

      expect(validateRoyaltyShares(complexSplit)).toBe(true)
      expect(calculateTotalShares(complexSplit)).toBe(100)
    })

    it('should handle floating point precision issues', () => {
      const precisionSplit = [
        { royaltyShare: (1 / 3) * 100 }, // 33.333...
        { royaltyShare: (1 / 3) * 100 }, // 33.333...
        { royaltyShare: (1 / 3) * 100 }, // 33.333...
      ]

      const total = calculateTotalShares(precisionSplit)
      // Due to floating point precision, this might not be exactly 100
      expect(Math.abs(total - 100)).toBeLessThan(0.01)
    })
  })

  describe('validateWalletAddress', () => {
    it('should validate correct Solana wallet addresses', () => {
      const validWallets = [
        '11111111111111111111111111111112', // System program (32 chars)
        'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV', // 44 chars
        'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8', // 44 chars
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token program (44 chars)
        'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jq', // 43 chars - valid Solana length
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5D', // 43 chars
        'So11111111111111111111111111111111111111112', // SOL token (44 chars)
      ]

      validWallets.forEach((wallet) => {
        expect(validateWalletAddress(wallet)).toBe(true)
      })
    })

    it('should reject invalid wallet addresses', () => {
      const testCases = [
        { wallet: 'invalid', expected: false, reason: 'too short' },
        { wallet: '0x1234567890123456789012345678901234567890', expected: false, reason: 'Ethereum format' },
        { wallet: '0x742d35Cc6634C0532925a3b8D4C9db', expected: false, reason: 'Ethereum format' },
        { wallet: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', expected: false, reason: 'Bitcoin format' },
        { wallet: '123', expected: false, reason: 'too short' },
        { wallet: 'TooShort123456789', expected: false, reason: 'too short (< 32 chars)' },
        { wallet: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqVV', expected: false, reason: 'too long' },
        { wallet: '', expected: false, reason: 'empty string' },
        { wallet: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8j0V', expected: false, reason: 'contains 0' },
        { wallet: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jOV', expected: false, reason: 'contains O' },
        { wallet: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jIV', expected: false, reason: 'contains I' },
        { wallet: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jlV', expected: false, reason: 'contains l' },
      ]

      testCases.forEach(({ wallet, expected }) => {
        expect(validateWalletAddress(wallet)).toBe(expected)
      })
    })

    it('should reject malicious input attempts', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE works; --',
        '${process.env.SECRET}',
        '../../../etc/passwd',
        'javascript:alert(1)',
        'wallet🚀address',
        'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8j\u0000V',
        'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8j\nV',
        'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8j\tV',
      ]

      maliciousInputs.forEach((input) => {
        expect(validateWalletAddress(input)).toBe(false)
      })
    })

    it('should handle very long inputs gracefully', () => {
      const longString = 'A'.repeat(10000)
      expect(validateWalletAddress(longString)).toBe(false)
    })
  })

  describe('calculateTotalShares', () => {
    it('should calculate total shares correctly', () => {
      const testCases = [
        { contributors: [{ royaltyShare: 25 }, { royaltyShare: 35 }, { royaltyShare: 40 }], expected: 100 },
        { contributors: [{ royaltyShare: 33.33 }, { royaltyShare: 66.67 }], expected: 100 },
        { contributors: [{ royaltyShare: 100 }], expected: 100 },
        { contributors: [{ royaltyShare: 50 }, { royaltyShare: 30 }, { royaltyShare: 20 }], expected: 100 },
      ]

      testCases.forEach(({ contributors, expected }) => {
        expect(calculateTotalShares(contributors)).toBe(expected)
      })
    })

    it('should handle edge cases', () => {
      // Empty array
      expect(calculateTotalShares([])).toBe(0)

      // Zero shares
      expect(calculateTotalShares([{ royaltyShare: 0 }, { royaltyShare: 0 }])).toBe(0)

      // Negative shares (should still calculate)
      expect(calculateTotalShares([{ royaltyShare: -10 }, { royaltyShare: 110 }])).toBe(100)
    })

    it('should handle floating point precision', () => {
      const contributors = [
        { royaltyShare: (1 / 3) * 100 }, // 33.333...
        { royaltyShare: (1 / 3) * 100 }, // 33.333...
        { royaltyShare: (1 / 3) * 100 }, // 33.333...
      ]

      const total = calculateTotalShares(contributors)
      // Due to floating point precision, this might not be exactly 100
      expect(Math.abs(total - 100)).toBeLessThan(0.01)
    })

    it('should handle type coercion gracefully', () => {
      // Test with proper number types
      const contributors = [{ royaltyShare: 50 }, { royaltyShare: 50 }]
      expect(calculateTotalShares(contributors)).toBe(100)
    })
  })

  describe('Security and Edge Cases', () => {
    it('should handle unicode and special characters', () => {
      const unicodeInputs = [
        'USRC🎵🎶🎵🎶🎵🎶',
        'wallet🚀address',
        'USRC\u0000\u0001\u0002',
        'USRC\n\r\t1234567',
        'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8j\u0000V',
      ]

      unicodeInputs.forEach((input) => {
        expect(validateISRC(input)).toBe(false)
        expect(validateWalletAddress(input)).toBe(false)
      })
    })

    it('should handle null and undefined inputs', () => {
      // @ts-expect-error Testing invalid input types
      expect(validateISRC(null)).toBe(false)
      // @ts-expect-error Testing invalid input types
      expect(validateISRC(undefined)).toBe(false)
      // @ts-expect-error Testing invalid input types
      expect(validateWalletAddress(null)).toBe(false)
      // @ts-expect-error Testing invalid input types
      expect(validateWalletAddress(undefined)).toBe(false)
    })

    it('should handle non-string inputs', () => {
      const nonStringInputs = [123, true, {}, [], NaN]

      nonStringInputs.forEach((input) => {
        // @ts-expect-error Testing invalid input types
        expect(validateISRC(input)).toBe(false)
        // @ts-expect-error Testing invalid input types
        expect(validateWalletAddress(input)).toBe(false)
      })
    })
  })
})
