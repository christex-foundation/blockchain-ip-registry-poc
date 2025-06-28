export { WorkBuilder, ContributorBuilder, TestScenarios } from './work-builder'
export { UserBuilder, AuthBuilder, AuthScenarios } from './user-builder'
export { OrganizationBuilder, OrganizationMemberBuilder, OrganizationTestData } from './organization-builder'

// Helper functions for common test patterns
export const generateValidISRC = (country = 'US', year = '17', designation = '607834') => {
  return `${country}RC${year}${designation}`
}

export const generateValidWalletAddress = () => {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const createShareDistribution = (contributorCount: number): number[] => {
  if (contributorCount === 1) return [100]
  if (contributorCount === 2) return [60, 40]
  if (contributorCount === 3) return [50, 30, 20]
  if (contributorCount === 4) return [35, 25, 20, 20]
  
  // For more than 4, distribute evenly with remainder to first contributor
  const baseShare = Math.floor(100 / contributorCount)
  const remainder = 100 % contributorCount
  const shares = Array(contributorCount).fill(baseShare)
  shares[0] += remainder
  
  return shares
}