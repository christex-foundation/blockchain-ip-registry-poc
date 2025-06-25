import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ellipsify(str = '', len = 4, delimiter = '..') {
  const strLen = str.length
  const limit = len * 2 + delimiter.length

  return strLen >= limit ? str.substring(0, len) + delimiter + str.substring(strLen - len, strLen) : str
}

// Validation functions for IP OnChain
export function validateISRC(isrc: string): boolean {
  if (!isrc || typeof isrc !== 'string') return false

  const trimmedISRC = isrc.trim()

  // Must be exactly 12 characters
  if (trimmedISRC.length !== 12) return false

  // ISRC format: CCRCYYNNNNN
  // CC = Country code (2 letters, uppercase only)
  // RC = Registrant code (3 alphanumeric, uppercase)
  // YY = Year (2 digits)
  // NNNNN = Designation code (5 digits)

  // More specific validation: first 2 chars must be letters only, 3rd char cannot be a number
  if (!/^[A-Z]{2}[A-Z]/.test(trimmedISRC)) return false

  const isrcRegex = /^[A-Z]{2}[A-Z][A-Z0-9]{2}[0-9]{7}$/

  // Additional validation: no spaces or special characters
  if (trimmedISRC.includes(' ') || !/^[A-Z0-9]+$/.test(trimmedISRC)) return false

  return isrcRegex.test(trimmedISRC)
}

export function validateWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false

  const trimmedAddress = address.trim()

  // Reject common non-Solana formats
  if (trimmedAddress.startsWith('0x') || trimmedAddress.startsWith('0X')) return false // Ethereum

  // Special case: allow Solana system program and other known addresses FIRST
  const knownSolanaAddresses = [
    '11111111111111111111111111111112', // System program
    '1111111111111111111111111111111', // Common test address
  ]
  if (knownSolanaAddresses.includes(trimmedAddress)) {
    return true // Known Solana address, skip all other checks
  }

  // Reject Bitcoin addresses more strictly
  if (trimmedAddress.startsWith('1') || trimmedAddress.startsWith('3') || trimmedAddress.startsWith('bc1')) {
    // Bitcoin addresses are typically 26-35 characters, so reject them
    if (trimmedAddress.length < 40) return false
  }

  // Solana addresses should be exactly 32-44 characters
  if (trimmedAddress.length < 32 || trimmedAddress.length > 44) return false

  // Solana wallet address validation
  // Should be 32-44 characters, base58 encoded
  // Base58 alphabet excludes: 0 (zero), O (capital o), I (capital i), l (lower case L)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

  // Additional checks for invalid characters
  if (
    trimmedAddress.includes('0') ||
    trimmedAddress.includes('O') ||
    trimmedAddress.includes('I') ||
    trimmedAddress.includes('l')
  ) {
    return false
  }

  return base58Regex.test(trimmedAddress)
}

export function validateRoyaltyShares(contributors: Array<{ royaltyShare: number }>): boolean {
  if (!contributors || contributors.length === 0) return false

  const total = calculateTotalShares(contributors)
  return Math.abs(total - 100) < 0.001 // Allow for floating point precision issues
}

export function calculateTotalShares(contributors: Array<{ royaltyShare: number }>): number {
  return contributors.reduce((sum, contributor) => {
    const share = Number(contributor.royaltyShare) || 0
    return sum + share
  }, 0)
}
